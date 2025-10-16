import crypto from 'crypto';
import axios from 'axios';
import _ from 'lodash';
import pLimit from 'p-limit';
import cliProgress from 'cli-progress';
import config from '../config/index.js';
import { User } from '../modules/user/user.model.js';
import { Pet } from '../modules/pet/pet.model.js';
import logger from '../utils/logger.js';
import { UserRoleEnum } from '../modules/user/user.types.js';
import { sanitizePetObject } from '../utils/petSanitizer.js';

// Note: sanitizePetObject function has been moved to utils/petSanitizer.js
// and is now imported from there to ensure consistency across the application

class PetfinderService {
  constructor() {
    this.baseUrl = 'https://api.petfinder.com/v2';
    this.token = null;
    this.tokenExpiry = null;

    // Token refresh lock mechanism
    this.tokenRefreshPromise = null;
    this.tokenRefreshInProgress = false;

    // Petfinder enums
    this.AGE_ENUM = {
      BABY: 'Baby',
      YOUNG: 'Young',
      ADULT: 'Adult',
      SENIOR: 'Senior',
    };

    // Rate limiting and retry configuration
    this.CONCURRENT_REQUESTS = 3; // Reduced for better rate limit compliance
    this.BATCH_SIZE = 20; // Larger batch size for bulk insert optimization
    this.limit = pLimit(this.CONCURRENT_REQUESTS);

    // Retry configuration
    this.MAX_RETRIES = 3;
    this.RETRY_DELAYS = [1000, 2000, 5000]; // Progressive delays in ms
    this.RATE_LIMIT_DELAY = 60000; // 1 minute delay on rate limit

    // Rate limiting tracking
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.rateLimitResetTime = 0;

    // Validate base URL
    try {
      new URL(this.baseUrl);
    } catch (error) {
      logger.error('Invalid base URL:', this.baseUrl);
      throw error;
    }
  }

  // Rate limiting and retry utilities
  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async handleRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    // Ensure minimum delay between requests (100ms)
    if (timeSinceLastRequest < 100) {
      await this.delay(100 - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();
  }

  async waitForRateLimitReset() {
    const now = Date.now();
    if (this.rateLimitResetTime > now) {
      const waitTime = this.rateLimitResetTime - now;
      logger.warn(
        `🔄 Rate limit hit! Waiting ${Math.ceil(waitTime / 1000)}s for reset...`
      );
      await this.delay(waitTime);
      this.rateLimitResetTime = 0;
    }
  }

  async retryWithBackoff(
    operation,
    operationName,
    maxRetries = this.MAX_RETRIES
  ) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Handle rate limiting before each attempt
        await this.waitForRateLimitReset();
        await this.handleRateLimit();

        const result = await operation();
        this.requestCount++;

        // Reset retry count on success
        return result;
      } catch (error) {
        lastError = error;

        // Check if it's a rate limit error
        if (error.response?.status === 429) {
          logger.warn(
            `⚠️ Rate limit exceeded for ${operationName} (attempt ${attempt}/${maxRetries})`
          );

          // Set rate limit reset time (usually 1 hour from now)
          this.rateLimitResetTime = Date.now() + this.RATE_LIMIT_DELAY;

          if (attempt < maxRetries) {
            const delay =
              this.RETRY_DELAYS[attempt - 1] ||
              this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1];
            logger.info(`⏳ Waiting ${delay}ms before retry...`);
            await this.delay(delay);
            continue;
          }
        }

        // Check if it's a server error (5xx)
        if (error.response?.status >= 500) {
          logger.warn(
            `⚠️ Server error for ${operationName} (attempt ${attempt}/${maxRetries}): ${error.response.status}`
          );

          if (attempt < maxRetries) {
            const delay =
              this.RETRY_DELAYS[attempt - 1] ||
              this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1];
            logger.info(`⏳ Waiting ${delay}ms before retry...`);
            await this.delay(delay);
            continue;
          }
        }

        // For other errors, log and continue with retry
        if (attempt < maxRetries) {
          logger.warn(
            `⚠️ Error for ${operationName} (attempt ${attempt}/${maxRetries}): ${error.message}`
          );
          const delay =
            this.RETRY_DELAYS[attempt - 1] ||
            this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1];
          logger.info(`⏳ Waiting ${delay}ms before retry...`);
          await this.delay(delay);
        }
      }
    }

    logger.error(
      `❌ Failed ${operationName} after ${maxRetries} attempts:`,
      lastError.message
    );
    throw lastError;
  }

  // Reset rate limiting counters (useful for long-running imports)
  resetRateLimitCounters() {
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.rateLimitResetTime = 0;
    logger.info('🔄 Rate limit counters reset');
  }

  // Get current rate limiting status
  getRateLimitStatus() {
    return {
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
      rateLimitResetTime: this.rateLimitResetTime,
      timeSinceLastRequest: Date.now() - this.lastRequestTime,
    };
  }

  // Get current token status
  getTokenStatus() {
    const now = Date.now();
    const isExpired = !this.tokenExpiry || now >= this.tokenExpiry;
    const timeUntilExpiry = this.tokenExpiry ? this.tokenExpiry - now : 0;

    return {
      hasToken: !!this.token,
      isExpired,
      timeUntilExpiry: Math.max(0, timeUntilExpiry),
      refreshInProgress: this.tokenRefreshInProgress,
      hasRefreshPromise: !!this.tokenRefreshPromise,
    };
  }

  // Force token refresh (useful for testing or manual refresh)
  async forceTokenRefresh() {
    logger.info('🔄 Forcing token refresh...');
    this.tokenRefreshInProgress = false;
    this.tokenRefreshPromise = null;
    this.token = null;
    this.tokenExpiry = null;
    return this.getToken();
  }

  // Bulk insert pets with duplicate handling and validation
  async bulkInsertPets(petsData, shelterId) {
    if (!petsData || !Array.isArray(petsData) || petsData.length === 0) {
      logger.warn('No pets data provided for bulk insert');
      return { inserted: 0, skipped: 0, errors: 0 };
    }

    if (!shelterId) {
      logger.warn('No shelter ID provided for bulk insert');
      return { inserted: 0, skipped: 0, errors: 0 };
    }

    return this.retryWithBackoff(async () => {
      logger.info(`🔄 Processing bulk insert for ${petsData.length} pets...`);

      // Extract external IDs for duplicate checking
      const externalIds = petsData
        .filter((pet) => pet && pet.id)
        .map((pet) => pet.id.toString());

      if (externalIds.length === 0) {
        logger.warn('No valid external IDs found in pets data');
        return { inserted: 0, skipped: 0, errors: 0 };
      }

      // Check for existing pets in bulk
      const existingPets = await Pet.find({
        'metadata.externalId': { $in: externalIds },
        'metadata.source': 'petfinder',
      });

      const existingIds = new Set(
        existingPets.map((pet) => pet.metadata.externalId)
      );

      // Filter out existing pets and invalid data
      const petsToInsert = [];
      const skippedPets = [];
      const errorPets = [];

      for (const petData of petsData) {
        if (!petData || !petData.id) {
          errorPets.push({ petId: 'unknown', reason: 'Invalid pet data' });
          continue;
        }

        const externalId = petData.id.toString();

        if (existingIds.has(externalId)) {
          skippedPets.push({ petId: externalId, reason: 'Already exists' });
          continue;
        }

        try {
          const petDoc = this.createPetDocument(petData, shelterId);
          // Apply schema filtering to ensure only valid fields are included
          const sanitizedPetDoc = sanitizePetObject(petDoc);
          petsToInsert.push(sanitizedPetDoc);
        } catch (error) {
          errorPets.push({
            petId: externalId,
            reason: `Validation error: ${error.message}`,
          });
        }
      }

      logger.info(
        `📊 Bulk insert stats: ${petsToInsert.length} to insert, ${skippedPets.length} skipped, ${errorPets.length} errors`
      );

      // Perform bulk insert if there are pets to insert
      let insertedCount = 0;
      if (petsToInsert.length > 0) {
        try {
          const result = await Pet.insertMany(petsToInsert, {
            ordered: false, // Continue on errors
            rawResult: true,
          });

          insertedCount = result.insertedCount || petsToInsert.length;
          logger.info(
            `✅ Bulk insert completed: ${insertedCount} pets inserted`
          );
        } catch (error) {
          logger.error('❌ Bulk insert failed:', error.message);

          // Handle partial failures
          if (error.writeErrors) {
            const writeErrorIds = error.writeErrors.map(
              (err) => err.err?.op?.metadata?.externalId || 'unknown'
            );
            logger.error(
              `Failed to insert pets with IDs: ${writeErrorIds.join(', ')}`
            );
          }

          // Fall back to individual inserts for failed pets
          logger.info(
            '🔄 Falling back to individual inserts for failed pets...'
          );
          for (const petDoc of petsToInsert) {
            try {
              await new Pet(petDoc).save();
              insertedCount++;
            } catch (individualError) {
              errorPets.push({
                petId: petDoc.metadata.externalId,
                reason: `Individual insert failed: ${individualError.message}`,
              });
            }
          }
        }
      }

      // Log detailed results
      if (skippedPets.length > 0) {
        logger.debug(
          `⏭️ Skipped pets: ${skippedPets.map((p) => p.petId).join(', ')}`
        );
      }

      if (errorPets.length > 0) {
        logger.warn(
          `❌ Error pets: ${errorPets.map((p) => `${p.petId} (${p.reason})`).join(', ')}`
        );
      }

      return {
        inserted: insertedCount,
        skipped: skippedPets.length,
        errors: errorPets.length,
        total: petsData.length,
      };
    }, `bulkInsertPets (${petsData.length} pets)`);
  }

  /**
   * Enhanced method to create pet document with comprehensive data mapping for AI matching
   *
   * ENHANCED MAPPINGS FOR AI RECOMMENDATIONS:
   *
   * PHOTOS: ✅ Complete - small, medium, large, full sizes with validation
   * VIDEOS: ✅ Complete - title, url, description, duration, thumbnail
   * TAGS: ✅ Complete - filtered enum with description extraction
   * ATTRIBUTES: ✅ Complete - houseTrained, specialNeeds, declawed, spayedNeutered, shotsCurrent
   *
   * BEHAVIOR: ✅ Enhanced - goodWith, activityLevel, training, crateTrained, leashTrained, etc.
   * HEALTH RECORDS: ✅ Enhanced - extracted from description and attributes
   * BEHAVIOR RECORDS: ✅ Enhanced - extracted from description analysis
   *
   * LIFESTYLE: ✅ Complete - energyLevel, independenceLevel, socialNeeds, apartmentFriendly, requiresYard
   * CARE: ✅ Complete - groomingNeeds, exerciseNeeds, attentionNeeds, medicalCareLevel
   * EXPERIENCE: ✅ Complete - suitableForFirstTimeOwners, trainingRequired, patienceRequired
   * ALLERGIES: ✅ Complete - hypoallergenic, sheddingLevel, danderLevel
   *
   * @param {Object} petData - Raw pet data from Petfinder API
   * @param {string} shelterId - ID of the shelter
   * @returns {Object} Sanitized pet document ready for database insertion
   */
  createPetDocument(petData, shelterId) {
    if (!shelterId) {
      throw new Error('No shelter ID provided for pet');
    }

    if (!petData || !petData.id) {
      throw new Error('Invalid pet data');
    }

    // Allowed tags enum from Pet model
    const ALLOWED_TAGS = [
      'Cute',
      'Friendly',
      'Playful',
      'Calm',
      'Energetic',
      'Gentle',
      'Loving',
      'Smart',
      'Quiet',
      'Active',
      'Independent',
      'Social',
      'Protective',
      'Curious',
      'Affectionate',
      'Loyal',
      'Patient',
      'Adventurous',
      'Relaxed',
      'Cheerful',
    ];

    // Helper function to map pet type
    const mapPetType = (type) => {
      const typeMap = {
        dog: 'dog',
        cat: 'cat',
        bird: 'bird',
        reptile: 'other',
        'small-furry': 'other',
        barnyard: 'other',
        horse: 'other',
        rabbit: 'other',
        'scales-fins-other': 'other',
        // Additional Petfinder type variations
        canine: 'dog',
        feline: 'cat',
        avian: 'bird',
        rodent: 'other',
        ferret: 'other',
        'guinea pig': 'other',
        hamster: 'other',
        gerbil: 'other',
        mouse: 'other',
        rat: 'other',
        chinchilla: 'other',
        hedgehog: 'other',
        'sugar glider': 'other',
        ferret: 'other',
        pig: 'other',
        goat: 'other',
        sheep: 'other',
        cow: 'other',
        donkey: 'other',
        llama: 'other',
        alpaca: 'other',
        fish: 'other',
        amphibian: 'other',
        invertebrate: 'other',
      };
      return typeMap[type?.toLowerCase()] || 'other';
    };

    // Helper function to map gender
    const mapGender = (gender) => {
      const genderMap = {
        male: 'male',
        female: 'female',
        unknown: 'unknown',
        // Additional Petfinder gender variations
        m: 'male',
        f: 'female',
        boy: 'male',
        girl: 'female',
        'neutered male': 'male',
        'spayed female': 'female',
        'intact male': 'male',
        'intact female': 'female',
      };
      return genderMap[gender?.toLowerCase()] || 'unknown';
    };

    // Helper function to map size
    const mapSize = (size) => {
      const sizeMap = {
        small: 'small',
        medium: 'medium',
        large: 'large',
        xlarge: 'large',
        'extra large': 'large',
        // Additional Petfinder size variations
        'x-large': 'large',
        xl: 'large',
        'extra-large': 'large',
        tiny: 'small',
        mini: 'small',
        miniature: 'small',
        giant: 'large',
        huge: 'large',
      };
      return sizeMap[size?.toLowerCase()] || 'medium';
    };

    // Helper function to map age
    const mapAge = (age) => {
      if (!age) return 'adult'; // Default to adult if age is undefined/null

      const ageMap = {
        [this.AGE_ENUM.BABY]: 'baby',
        [this.AGE_ENUM.YOUNG]: 'young',
        [this.AGE_ENUM.ADULT]: 'adult',
        [this.AGE_ENUM.SENIOR]: 'senior',
        // Handle lowercase variations
        [this.AGE_ENUM.BABY.toLowerCase()]: 'baby',
        [this.AGE_ENUM.YOUNG.toLowerCase()]: 'young',
        [this.AGE_ENUM.ADULT.toLowerCase()]: 'adult',
        [this.AGE_ENUM.SENIOR.toLowerCase()]: 'senior',
        // Handle numeric ages (if provided)
        1: 'baby',
        2: 'young',
        3: 'adult',
        4: 'senior',
        // Additional Petfinder age variations
        kitten: 'baby',
        puppy: 'baby',
        juvenile: 'young',
        mature: 'adult',
        elderly: 'senior',
        geriatric: 'senior',
      };

      const mappedAge = ageMap[age];
      if (!mappedAge) {
        logger.warn(`Unknown age value: ${age}, defaulting to 'adult'`);
        return 'adult';
      }

      return mappedAge;
    };

    // Helper function to ensure string value
    const ensureString = (value) => {
      if (!value || typeof value !== 'string') return 'Unknown';
      return value.trim() || 'Unknown';
    };

    // Helper function to map and standardize colors
    const mapColor = (color) => {
      if (!color) return undefined;

      const colorMap = {
        // Basic colors
        black: 'Black',
        white: 'White',
        brown: 'Brown',
        tan: 'Tan',
        cream: 'Cream',
        red: 'Red',
        orange: 'Orange',
        yellow: 'Yellow',
        blue: 'Blue',
        gray: 'Gray',
        grey: 'Gray',
        silver: 'Silver',
        gold: 'Gold',
        chocolate: 'Chocolate',
        fawn: 'Fawn',
        brindle: 'Brindle',
        merle: 'Merle',
        tricolor: 'Tricolor',
        bicolor: 'Bicolor',
        calico: 'Calico',
        tortoiseshell: 'Tortoiseshell',
        tabby: 'Tabby',
        striped: 'Striped',
        spotted: 'Spotted',
        patched: 'Patched',
        mixed: 'Mixed',
        unknown: 'Unknown',
        // Common variations
        'light brown': 'Light Brown',
        'dark brown': 'Dark Brown',
        'light gray': 'Light Gray',
        'dark gray': 'Dark Gray',
        'light tan': 'Light Tan',
        'dark tan': 'Dark Tan',
        'light cream': 'Light Cream',
        'dark cream': 'Dark Cream',
        'light orange': 'Light Orange',
        'dark orange': 'Dark Orange',
        'light red': 'Light Red',
        'dark red': 'Dark Red',
        'light yellow': 'Light Yellow',
        'dark yellow': 'Dark Yellow',
        'light blue': 'Light Blue',
        'dark blue': 'Dark Blue',
        'light silver': 'Light Silver',
        'dark silver': 'Dark Silver',
        'light gold': 'Light Gold',
        'dark gold': 'Dark Gold',
        'light chocolate': 'Light Chocolate',
        'dark chocolate': 'Dark Chocolate',
        'light fawn': 'Light Fawn',
        'dark fawn': 'Dark Fawn',
      };

      const mappedColor = colorMap[color.toLowerCase()];
      return (
        mappedColor ||
        color.charAt(0).toUpperCase() + color.slice(1).toLowerCase()
      );
    };

    // Helper function to map and standardize species
    const mapSpecies = (species) => {
      if (!species) return 'Unknown';

      const speciesMap = {
        // Common species
        dog: 'Dog',
        cat: 'Cat',
        bird: 'Bird',
        rabbit: 'Rabbit',
        hamster: 'Hamster',
        'guinea pig': 'Guinea Pig',
        ferret: 'Ferret',
        horse: 'Horse',
        pig: 'Pig',
        goat: 'Goat',
        sheep: 'Sheep',
        cow: 'Cow',
        donkey: 'Donkey',
        llama: 'Llama',
        alpaca: 'Alpaca',
        fish: 'Fish',
        reptile: 'Reptile',
        amphibian: 'Amphibian',
        invertebrate: 'Invertebrate',
        // Common variations
        canine: 'Dog',
        feline: 'Cat',
        avian: 'Bird',
        rodent: 'Rodent',
        equine: 'Horse',
        bovine: 'Cow',
        caprine: 'Goat',
        ovine: 'Sheep',
        asinine: 'Donkey',
        camelid: 'Llama',
        lagomorph: 'Rabbit',
        mustelid: 'Ferret',
        cricetid: 'Hamster',
        caviid: 'Guinea Pig',
      };

      const mappedSpecies = speciesMap[species.toLowerCase()];
      return (
        mappedSpecies ||
        species.charAt(0).toUpperCase() + species.slice(1).toLowerCase()
      );
    };

    // Helper function to ensure valid breed (throws error for unknown breeds)
    const ensureValidBreed = (breed) => {
      if (!breed || typeof breed !== 'string') {
        throw new Error('Breed is required and cannot be empty');
      }
      const trimmedBreed = breed.trim();
      if (!trimmedBreed) {
        throw new Error('Breed cannot be empty after trimming');
      }
      if (
        [
          'unknown',
          'Unknown',
          'UNKNOWN',
          'Unknown Breed',
          'Mixed Breed',
        ].includes(trimmedBreed)
      ) {
        throw new Error(`Invalid breed: ${trimmedBreed}`);
      }
      return trimmedBreed;
    };

    // Helper function to map coat type
    const mapCoat = (coat) => {
      if (!coat) return undefined;

      const coatMap = {
        short: 'short',
        medium: 'medium',
        long: 'long',
        wire: 'wire',
        curly: 'curly',
        smooth: 'smooth',
        rough: 'rough',
        'short-haired': 'short',
        'medium-haired': 'medium',
        'long-haired': 'long',
        'wire-haired': 'wire',
        'curly-haired': 'curly',
        'smooth-haired': 'smooth',
        'rough-haired': 'rough',
        // Additional Petfinder coat variations
        'short hair': 'short',
        'medium hair': 'medium',
        'long hair': 'long',
        'wire hair': 'wire',
        'curly hair': 'curly',
        'smooth hair': 'smooth',
        'rough hair': 'rough',
        'no hair': 'short', // Hairless pets
        hairless: 'short',
      };

      const mappedCoat = coatMap[coat.toLowerCase()];
      return mappedCoat || undefined;
    };

    // Helper function to sanitize description
    const sanitizeDescription = (desc) => {
      if (!desc) return 'This pet is looking for a forever home!';
      return desc
        .replace(/&amp;#39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'");
    };

    // Helper function to validate photo
    const isValidPhoto = (photo) => {
      if (!photo?.full) return false;
      const url = photo.full.toLowerCase();

      // Reject error/replacement image patterns
      const invalidPatterns = [
        'no-image',
        'noimage',
        'image-not-available',
        'placeholder',
        'default',
        'missing',
        'error',
        '404',
        'broken',
        'unavailable',
        'not-found',
        'null',
        'undefined',
        'empty',
        'blank',
      ];
      if (invalidPatterns.some((pattern) => url.includes(pattern)))
        return false;

      // If the URL belongs to cloudfront/photos/pets or cloudfront/animal, then accept it
      if (
        url.includes('cloudfront.net/photos/pets/') ||
        url.includes('cloudfront.net/animal/')
      )
        return true;

      // You can keep the extension check if you really want, but it's not required
      // If you still want to check the extension, just reject it if the URL is not in the form cloudfront/photos/pets

      try {
        // Still try the new URL to make sure it's valid (can be skipped)
        new URL(photo.full);
        return true;
      } catch {
        return false;
      }
    };

    // Helper function to sanitize photo
    const sanitizePhoto = (photo, index) => ({
      _id: `${petData.id}_${index}`, // unique key
      url: photo.full,
      small: photo.small,
      medium: photo.medium,
      large: photo.large,
      full: photo.full,
      caption: `Photo of ${petData.name || 'Pet'}`,
    });

    // Helper function to extract goodWith array from environment data
    const extractGoodWith = (environment) => {
      const goodWith = [];
      if (environment?.dogs === 'yes') goodWith.push('dogs');
      if (environment?.cats === 'yes') goodWith.push('cats');
      if (environment?.children === 'yes') goodWith.push('children');

      // Add 'other' if pet is good with other animals
      if (environment?.dogs === 'yes' || environment?.cats === 'yes') {
        goodWith.push('other');
      }

      return goodWith;
    };

    // Helper function to extract training array from attributes
    const extractTraining = (attributes) => {
      const training = [];
      if (attributes?.leash_trained) training.push('leash-trained');
      if (attributes?.obedience_trained) training.push('obedience-trained');
      if (attributes?.house_trained) training.push('house-trained');
      if (attributes?.crate_trained) training.push('crate-trained');
      if (attributes?.potty_trained) training.push('potty-trained');
      return training;
    };

    // Helper function to extract health records from description and attributes
    const extractHealthRecords = (attributes, description) => {
      const healthRecords = [];
      const desc = (description || '').toLowerCase();

      // Extract medical conditions from description
      if (
        desc.includes('medical condition') ||
        desc.includes('requires medication')
      ) {
        healthRecords.push({
          condition: 'Medical condition',
          treatment: 'Requires medication',
          date: new Date(),
          veterinarian: 'Unknown',
          notes: 'Extracted from description',
          severity: 'medium',
        });
      }

      if (desc.includes('special needs') || attributes?.special_needs) {
        healthRecords.push({
          condition: 'Special needs',
          treatment: 'Special care required',
          date: new Date(),
          veterinarian: 'Unknown',
          notes: 'Pet has special needs',
          severity: 'medium',
        });
      }

      return healthRecords;
    };

    // Helper function to extract behavior records from description
    const extractBehaviorRecords = (description, attributes) => {
      const behaviorRecords = [];
      const desc = (description || '').toLowerCase();

      // Extract behavioral observations from description
      if (desc.includes('shy') || desc.includes('timid')) {
        behaviorRecords.push({
          behavior: 'Shy/Timid',
          description: 'Pet shows shy or timid behavior',
          date: new Date(),
          observedBy: 'Description analysis',
          notes: 'Extracted from description',
          type: 'neutral',
        });
      }

      if (desc.includes('aggressive') || desc.includes('protective')) {
        behaviorRecords.push({
          behavior: 'Protective',
          description: 'Pet shows protective behavior',
          date: new Date(),
          observedBy: 'Description analysis',
          notes: 'Extracted from description',
          type: 'positive',
        });
      }

      if (desc.includes('playful') || desc.includes('energetic')) {
        behaviorRecords.push({
          behavior: 'Playful',
          description: 'Pet shows playful and energetic behavior',
          date: new Date(),
          observedBy: 'Description analysis',
          notes: 'Extracted from description',
          type: 'positive',
        });
      }

      return behaviorRecords;
    };

    // Helper function to generate adoption fee based on pet characteristics
    const generateAdoptionFee = (petData) => {
      let baseFee = 50;

      // Adjust based on age
      if (petData.age?.toLowerCase() === 'baby') baseFee += 25;
      else if (petData.age?.toLowerCase() === 'senior') baseFee -= 15;

      // Adjust based on size
      if (petData.size?.toLowerCase() === 'large') baseFee += 10;
      else if (petData.size?.toLowerCase() === 'small') baseFee -= 5;

      // Add some randomness
      return Math.max(25, baseFee + Math.floor(Math.random() * 30));
    };

    // Helper function to extract tags from description and merge with Petfinder tags
    const extractAndMergeTags = (petData) => {
      const petfinderTags = petData.tags || [];

      // Extract potential tags from description (basic keyword matching)
      const descriptionTags = [];
      const description = (petData.description || '').toLowerCase();

      // Map common descriptive words to allowed tags
      const wordToTagMap = {
        cute: 'Cute',
        friendly: 'Friendly',
        playful: 'Playful',
        calm: 'Calm',
        energetic: 'Energetic',
        gentle: 'Gentle',
        loving: 'Loving',
        smart: 'Smart',
        quiet: 'Quiet',
        active: 'Active',
        independent: 'Independent',
        social: 'Social',
        protective: 'Protective',
        curious: 'Curious',
        affectionate: 'Affectionate',
        loyal: 'Loyal',
        patient: 'Patient',
        adventurous: 'Adventurous',
        relaxed: 'Relaxed',
        cheerful: 'Cheerful',
      };

      // Check description for tag keywords
      Object.entries(wordToTagMap).forEach(([word, tag]) => {
        if (description.includes(word) && !descriptionTags.includes(tag)) {
          descriptionTags.push(tag);
        }
      });

      // Merge Petfinder tags + enrichment tags, then filter by enum
      const mergedTags = [...petfinderTags, ...descriptionTags].filter((tag) =>
        ALLOWED_TAGS.includes(tag)
      );

      // Remove duplicates
      return [...new Set(mergedTags)];
    };

    // Enhanced field mapping helper functions
    const mapEnergyLevel = (attributes, description) => {
      const desc = (description || '').toLowerCase();
      const attrs = attributes || {};

      // Check for high energy indicators
      if (
        desc.includes('high energy') ||
        desc.includes('very active') ||
        desc.includes('energetic') ||
        desc.includes('playful') ||
        desc.includes('loves to run') ||
        desc.includes('needs exercise')
      ) {
        return 'high';
      }

      // Check for low energy indicators
      if (
        desc.includes('low energy') ||
        desc.includes('calm') ||
        desc.includes('quiet') ||
        desc.includes('relaxed') ||
        desc.includes('laid back') ||
        desc.includes('gentle')
      ) {
        return 'low';
      }

      // Default to medium
      return 'medium';
    };

    const mapIndependenceLevel = (attributes, description) => {
      const desc = (description || '').toLowerCase();
      const attrs = attributes || {};

      // Check for independent indicators
      if (
        desc.includes('independent') ||
        desc.includes('self-sufficient') ||
        desc.includes("doesn't need constant attention")
      ) {
        return 'high';
      }

      // Check for dependent indicators
      if (
        desc.includes('needs constant attention') ||
        desc.includes('clingy') ||
        desc.includes('follows everywhere')
      ) {
        return 'low';
      }

      // Default to medium
      return 'medium';
    };

    const mapSocialNeeds = (environment, description) => {
      const desc = (description || '').toLowerCase();
      const env = environment || {};

      // Check for high social needs
      if (
        desc.includes('social') ||
        desc.includes('loves people') ||
        desc.includes('needs company') ||
        desc.includes('lonely') ||
        desc.includes('seeks attention')
      ) {
        return 'high';
      }

      // Check for low social needs
      if (
        desc.includes('shy') ||
        desc.includes('timid') ||
        desc.includes('reserved') ||
        desc.includes('independent') ||
        desc.includes("doesn't like crowds")
      ) {
        return 'low';
      }

      // Default to medium
      return 'medium';
    };

    const mapApartmentFriendly = (attributes, size, type) => {
      // Large dogs are generally not apartment-friendly
      if (type === 'dog' && size === 'large') {
        return false;
      }

      // Check for apartment-friendly indicators in attributes
      if (attributes?.house_trained && !attributes?.special_needs) {
        return true;
      }

      // Default to true for most pets
      return true;
    };

    const mapRequiresYard = (attributes, size, type) => {
      // Large dogs often need yards
      if (type === 'dog' && size === 'large') {
        return true;
      }

      // Check for yard requirement indicators
      if (attributes?.special_needs && size === 'large') {
        return true;
      }

      // Default to false for most pets
      return false;
    };

    const mapGroomingNeeds = (coat, description) => {
      const desc = (description || '').toLowerCase();

      // Long-haired pets need high grooming
      if (
        coat === 'long' ||
        desc.includes('long hair') ||
        desc.includes('needs regular grooming')
      ) {
        return 'high';
      }

      // Medium-haired pets need moderate grooming
      if (coat === 'medium' || desc.includes('medium hair')) {
        return 'moderate';
      }

      // Short-haired pets need minimal grooming
      return 'minimal';
    };

    const mapExerciseNeeds = (attributes, size, type) => {
      // Large dogs need more exercise
      if (type === 'dog' && size === 'large') {
        return 'high';
      }

      // Small pets generally need less exercise
      if (size === 'small') {
        return 'low';
      }

      // Default to medium
      return 'medium';
    };

    const mapAttentionNeeds = (attributes, description) => {
      const desc = (description || '').toLowerCase();

      // Check for high attention needs
      if (
        desc.includes('needs attention') ||
        desc.includes('clingy') ||
        desc.includes('follows everywhere')
      ) {
        return 'high';
      }

      // Check for low attention needs
      if (
        desc.includes('independent') ||
        desc.includes('self-sufficient') ||
        desc.includes("doesn't need constant attention")
      ) {
        return 'low';
      }

      // Default to medium
      return 'medium';
    };

    const mapMedicalCareLevel = (attributes, description) => {
      const desc = (description || '').toLowerCase();

      // Check for advanced medical care needs
      if (
        attributes?.special_needs ||
        desc.includes('medical condition') ||
        desc.includes('requires medication')
      ) {
        return 'advanced';
      }

      // Check for moderate care needs
      if (
        desc.includes('needs regular checkups') ||
        desc.includes('health monitoring')
      ) {
        return 'moderate';
      }

      // Default to basic care
      return 'basic';
    };

    const mapSuitableForFirstTimeOwners = (age, attributes, description) => {
      const desc = (description || '').toLowerCase();

      // Senior pets are often good for first-time owners
      if (age === 'senior') {
        return true;
      }

      // Pets with special needs might not be suitable for first-time owners
      if (attributes?.special_needs) {
        return false;
      }

      // Check description for indicators
      if (
        desc.includes('easy to care for') ||
        desc.includes('low maintenance') ||
        desc.includes('good for beginners')
      ) {
        return true;
      }

      if (
        desc.includes('needs experienced owner') ||
        desc.includes('challenging') ||
        desc.includes('high maintenance')
      ) {
        return false;
      }

      // Default to true for most pets
      return true;
    };

    const mapTrainingRequired = (attributes, description) => {
      const desc = (description || '').toLowerCase();

      // Check for advanced training needs
      if (
        desc.includes('needs training') ||
        desc.includes('untrained') ||
        desc.includes('behavioral issues')
      ) {
        return 'advanced';
      }

      // Check for basic training needs
      if (
        desc.includes('basic training') ||
        desc.includes('house training') ||
        !attributes?.house_trained
      ) {
        return 'basic';
      }

      // Default to basic
      return 'basic';
    };

    const mapPatienceRequired = (age, attributes, description) => {
      const desc = (description || '').toLowerCase();

      // Young pets often need more patience
      if (age === 'baby' || age === 'young') {
        return 'high';
      }

      // Check description for patience indicators
      if (
        desc.includes('needs patience') ||
        desc.includes('slow to trust') ||
        desc.includes('shy')
      ) {
        return 'high';
      }

      if (
        desc.includes('easy going') ||
        desc.includes('adapts quickly') ||
        desc.includes('friendly')
      ) {
        return 'low';
      }

      // Default to medium
      return 'medium';
    };

    const mapHypoallergenic = (coat, breed, description) => {
      const desc = (description || '').toLowerCase();

      // Check for hypoallergenic breeds
      const hypoallergenicBreeds = [
        'poodle',
        'bichon frise',
        'maltese',
        'yorkie',
        'yorkshire terrier',
        'schnauzer',
        'portuguese water dog',
        'irish water spaniel',
        'labradoodle',
        'goldendoodle',
        'australian labradoodle',
      ];

      if (
        breed &&
        hypoallergenicBreeds.some((hypoBreed) =>
          breed.toLowerCase().includes(hypoBreed)
        )
      ) {
        return true;
      }

      // Check description for hypoallergenic indicators
      if (
        desc.includes('hypoallergenic') ||
        desc.includes('allergy friendly') ||
        desc.includes('low dander')
      ) {
        return true;
      }

      // Default to false
      return false;
    };

    const mapSheddingLevel = (coat, breed, description) => {
      const desc = (description || '').toLowerCase();

      // Long-haired pets shed more
      if (coat === 'long') {
        return 'high';
      }

      // Check for shedding indicators in description
      if (desc.includes('heavy shedding') || desc.includes('sheds a lot')) {
        return 'high';
      }

      if (desc.includes('minimal shedding') || desc.includes('hardly sheds')) {
        return 'low';
      }

      // Default to medium
      return 'medium';
    };

    const mapDanderLevel = (coat, breed, description) => {
      const desc = (description || '').toLowerCase();

      // Check for dander indicators
      if (desc.includes('low dander') || desc.includes('hypoallergenic')) {
        return 'low';
      }

      if (desc.includes('high dander') || desc.includes('produces dander')) {
        return 'high';
      }

      // Default to medium
      return 'medium';
    };

    // Create the pet document object with all the mapped data
    const petDocument = {
      // Basic information
      name: ensureString(petData.name),
      type: mapPetType(petData.type),
      species: mapSpecies(petData.species || petData.type),
      breed: ensureValidBreed(petData.breeds?.primary),
      age: mapAge(petData.age),
      gender: mapGender(petData.gender),
      size: mapSize(petData.size),
      coat: mapCoat(petData.coat),
      primaryColor: mapColor(petData.colors?.primary) || 'Unknown',
      secondaryColor: mapColor(petData.colors?.secondary),
      description: sanitizeDescription(petData.description),

      // Photos - only save valid photos
      photos: (petData.photos || [])
        .filter(isValidPhoto)
        .map((photo, index) => sanitizePhoto(photo, index)),

      // Videos - map video data for AI analysis
      videos: (petData.videos || []).map((video) => ({
        title: video.title || 'Pet Video',
        url: video.url,
        description: video.description || '',
        duration: video.duration || 0,
        thumbnail: video.thumbnail || '',
      })),

      // Tags - merge Petfinder tags with description-extracted tags
      tags: extractAndMergeTags(petData),

      // Status and shelter
      status: 'adoptable',
      shelter: shelterId,
      // Auto-approval for script-created pets
      isApproved: true,

      // Health information
      health: {
        vaccinated: petData.attributes?.shots_current || false,
        neutered: petData.attributes?.spayed_neutered || false,
        medicalHistory: [], // Initialize empty array
      },

      // Health records for AI matching
      healthRecords:
        petData.health_records ||
        extractHealthRecords(petData.attributes, petData.description),

      // Behavior records for AI matching
      behaviorRecords:
        petData.behavior_records ||
        extractBehaviorRecords(petData.description, petData.attributes),

      // Behavior information
      behavior: {
        goodWith: extractGoodWith(petData.environment),
        activityLevel: mapEnergyLevel(petData.attributes, petData.description), // Use energy level mapping
        training: extractTraining(petData.attributes),
        // Enhanced behavior fields for better AI matching
        crateTrained: petData.attributes?.crate_trained || false,
        leashTrained: petData.attributes?.leash_trained || false,
        houseTrained: petData.attributes?.house_trained || false,
        obedienceTrained: petData.attributes?.obedience_trained || false,
        pottyTrained: petData.attributes?.potty_trained || false,
        // Additional behavior insights for AI matching
        socialWithStrangers: petData.environment?.children === 'yes' || false,
        goodWithOtherPets:
          petData.environment?.dogs === 'yes' ||
          petData.environment?.cats === 'yes' ||
          false,
        needsExercise:
          mapEnergyLevel(petData.attributes, petData.description) === 'high',
        independent:
          mapIndependenceLevel(petData.attributes, petData.description) ===
          'high',
        affectionate:
          (petData.description || '').toLowerCase().includes('affectionate') ||
          false,
        protective:
          (petData.description || '').toLowerCase().includes('protective') ||
          false,
      },

      // Enhanced fields for better pet recommendations
      lifestyle: {
        energyLevel: mapEnergyLevel(petData.attributes, petData.description),
        independenceLevel: mapIndependenceLevel(
          petData.attributes,
          petData.description
        ),
        socialNeeds: mapSocialNeeds(petData.environment, petData.description),
        apartmentFriendly: mapApartmentFriendly(
          petData.attributes,
          petData.size,
          petData.type
        ),
        requiresYard: mapRequiresYard(
          petData.attributes,
          petData.size,
          petData.type
        ),
      },

      care: {
        groomingNeeds: mapGroomingNeeds(petData.coat, petData.description),
        exerciseNeeds: mapExerciseNeeds(
          petData.attributes,
          petData.size,
          petData.type
        ),
        attentionNeeds: mapAttentionNeeds(
          petData.attributes,
          petData.description
        ),
        medicalCareLevel: mapMedicalCareLevel(
          petData.attributes,
          petData.description
        ),
      },

      experience: {
        suitableForFirstTimeOwners: mapSuitableForFirstTimeOwners(
          petData.age,
          petData.attributes,
          petData.description
        ),
        trainingRequired: mapTrainingRequired(
          petData.attributes,
          petData.description
        ),
        patienceRequired: mapPatienceRequired(
          petData.age,
          petData.attributes,
          petData.description
        ),
      },

      allergies: {
        hypoallergenic: mapHypoallergenic(
          petData.coat,
          petData.breeds?.primary,
          petData.description
        ),
        sheddingLevel: mapSheddingLevel(
          petData.coat,
          petData.breeds?.primary,
          petData.description
        ),
        danderLevel: mapDanderLevel(
          petData.coat,
          petData.breeds?.primary,
          petData.description
        ),
      },

      // Attributes
      attributes: {
        houseTrained: petData.attributes?.house_trained || false,
        specialNeeds: petData.attributes?.special_needs || false,
        declawed: petData.attributes?.declawed || false,
        spayedNeutered: petData.attributes?.spayed_neutered || false,
        shotsCurrent: petData.attributes?.shots_current || false,
        // Enhanced training attributes for AI matching
        leashTrained: petData.attributes?.leash_trained || false,
        crateTrained: petData.attributes?.crate_trained || false,
        obedienceTrained: petData.attributes?.obedience_trained || false,
        pottyTrained: petData.attributes?.potty_trained || false,
        microchipped: petData.attributes?.microchipped || false,
      },

      // Adoption information
      adoptionFee: generateAdoptionFee(petData),
      views: 0, // Initialize to 0
      savedBy: [], // Initialize empty array
      adoptionRequests: [], // Initialize empty array

      // Metadata for tracking
      metadata: {
        externalId: petData.id.toString(),
        source: 'petfinder',
        organizationId: petData.organization_id,
        originalUrl: petData.url || '',
        lastUpdated: new Date(),
      },
    };

    // Apply schema filtering to ensure only valid fields are included
    const sanitizedPetDocument = sanitizePetObject(petDocument);

    // Debug: Log the fields that were included
    const originalFields = Object.keys(petDocument);
    const sanitizedFields = Object.keys(sanitizedPetDocument);
    const filteredFields = originalFields.filter(
      (field) => !sanitizedFields.includes(field)
    );

    if (filteredFields.length > 0) {
      logger.debug(
        `🔍 Schema filtering: ${filteredFields.length} fields filtered out: ${filteredFields.join(', ')}`
      );
    }

    // Debug: Log what fields are in the sanitized document
    logger.debug(`📋 Sanitized document fields: ${sanitizedFields.join(', ')}`);

    // Log enhanced data extraction summary for AI matching
    const enhancedDataSummary = {
      photos: petDocument.photos?.length || 0,
      videos: petDocument.videos?.length || 0,
      tags: petDocument.tags?.length || 0,
      healthRecords: petDocument.healthRecords?.length || 0,
      behaviorRecords: petDocument.behaviorRecords?.length || 0,
      behaviorFields: Object.keys(petDocument.behavior || {}).length,
      attributeFields: Object.keys(petDocument.attributes || {}).length,
      lifestyleFields: Object.keys(petDocument.lifestyle || {}).length,
      careFields: Object.keys(petDocument.care || {}).length,
      experienceFields: Object.keys(petDocument.experience || {}).length,
      allergyFields: Object.keys(petDocument.allergies || {}).length,
    };

    logger.info(
      `🚀 Enhanced pet document created for AI matching:`,
      enhancedDataSummary
    );

    // Check if any problematic fields are still present
    const problematicFields = [
      'editLogs',
      'complaints',
      'healthRecords',
      'behaviorRecords',
    ];
    const foundProblematicFields = problematicFields.filter((field) =>
      sanitizedFields.includes(field)
    );
    if (foundProblematicFields.length > 0) {
      logger.warn(
        `⚠️ Found problematic fields in sanitized document: ${foundProblematicFields.join(', ')}`
      );
    }

    return sanitizedPetDocument;
  }

  // Optional: Validate photo URL with HEAD request (costs extra API requests)
  // Uncomment and use this method for maximum photo validation confidence
  /*
  async validatePhotoUrl(url) {
    try {
      const response = await axios.head(url, {
        timeout: 5000,
        validateStatus: (status) => status < 400,
      });
      
      const contentType = response.headers['content-type'];
      const contentLength = response.headers['content-length'];
      
      // Check if it's an image
      if (!contentType || !contentType.startsWith('image/')) {
        return false;
      }
      
      // Check if image has reasonable size (not too small, not too large)
      if (contentLength) {
        const sizeInBytes = parseInt(contentLength);
        const sizeInKB = sizeInBytes / 1024;
        
        if (sizeInKB < 1 || sizeInKB > 5000) { // Between 1KB and 5MB
          return false;
        }
      }
      
      return true;
    } catch (error) {
      logger.debug(`Photo validation failed for ${url}: ${error.message}`);
      return false;
    }
  }
  */

  async authenticate() {
    try {
      // Check if Petfinder API is enabled
      if (process.env.USE_PETFINDER_API === 'false') {
        throw new Error('Petfinder API integration is disabled');
      }

      if (!process.env.PETFINDER_API_KEY || !process.env.PETFINDER_API_SECRET) {
        throw new Error(
          'Petfinder API credentials not found in environment variables'
        );
      }

      logger.info('Authenticating with Petfinder API...');
      logger.info('API Key length:', process.env.PETFINDER_API_KEY.length);
      logger.info(
        'API Secret length:',
        process.env.PETFINDER_API_SECRET.length
      );

      const requestData = {
        grant_type: 'client_credentials',
        client_id: process.env.PETFINDER_API_KEY,
        client_secret: process.env.PETFINDER_API_SECRET,
      };

      logger.info('Request URL:', `${this.baseUrl}/oauth2/token`);

      const response = await axios.post(
        `${this.baseUrl}/oauth2/token`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      if (!response.data.access_token) {
        throw new Error('No access token received from Petfinder API');
      }

      // Validate token expiry time
      const expiresIn = response.data.expires_in;
      if (!expiresIn || expiresIn <= 0) {
        throw new Error(
          'Invalid token expiry time received from Petfinder API'
        );
      }

      // Set token with a small buffer (5 minutes) to avoid edge cases
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      this.token = response.data.access_token;
      this.tokenExpiry = Date.now() + expiresIn * 1000 - bufferTime;

      logger.info('Successfully authenticated with Petfinder API');
      logger.debug(
        `Token expires in ${Math.round(expiresIn / 60)} minutes (with 5min buffer)`
      );
      return this.token;
    } catch (error) {
      logger.error('Failed to authenticate with Petfinder:', error.message);
      if (error.response) {
        logger.error('Response status:', error.response.status);
        logger.error('Response headers:', error.response.headers);
        logger.error(
          'Response data:',
          JSON.stringify(error.response.data, null, 2)
        );
      } else if (error.request) {
        logger.error('No response received. Request details:', error.request);
      } else {
        logger.error('Error details:', error);
      }

      // Clear any partial token state on authentication failure
      this.token = null;
      this.tokenExpiry = null;
      throw error;
    }
  }

  async getToken() {
    // Check if token is valid
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    // If token refresh is already in progress, wait for it
    if (this.tokenRefreshInProgress && this.tokenRefreshPromise) {
      logger.debug('🔄 Token refresh already in progress, waiting...');
      try {
        await this.tokenRefreshPromise;
        return this.token;
      } catch (error) {
        logger.error('❌ Token refresh failed, will retry:', error.message);
        // Reset the lock and fall through to retry
        this.tokenRefreshInProgress = false;
        this.tokenRefreshPromise = null;
      }
    }

    // Start token refresh process
    this.tokenRefreshInProgress = true;
    this.tokenRefreshPromise = this.authenticate()
      .then((token) => {
        logger.debug('✅ Token refresh completed successfully');
        return token;
      })
      .catch((error) => {
        logger.error('❌ Token refresh failed:', error.message);
        throw error;
      })
      .finally(() => {
        // Always reset the lock when done
        this.tokenRefreshInProgress = false;
        this.tokenRefreshPromise = null;
      });

    try {
      await this.tokenRefreshPromise;
      return this.token;
    } catch (error) {
      // If authentication fails, throw the error
      throw error;
    }
  }

  async fetchPets(page = 1, limit = 20) {
    if (process.env.USE_PETFINDER_API === 'false') {
      logger.warn('[DEV MODE] fetchPets skipped. Returning empty.');
      return { animals: [], pagination: { total_pages: 1 } };
    }

    return this.retryWithBackoff(async () => {
      const token = await this.getToken();
      const response = await axios.get(`${this.baseUrl}/animals`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page,
          limit,
          status: 'adoptable',
        },
      });
      return response.data;
    }, `fetchPets (page ${page}, limit ${limit})`);
  }

  async fetchPetDetails(petId) {
    if (process.env.USE_PETFINDER_API === 'false') {
      logger.warn('[DEV MODE] fetchPetDetails skipped. Returning mock data.');
      return {
        id: petId,
        name: 'Mock Pet',
        type: 'Dog',
        breeds: { primary: 'Mixed Breed' },
        age: 'Adult',
        gender: 'Male',
        size: 'Medium',
        status: 'adoptable',
        photos: [],
        attributes: {},
        environment: {},
        contact: {},
        published_at: new Date().toISOString(),
      };
    }

    return this.retryWithBackoff(async () => {
      const token = await this.getToken();
      const response = await axios.get(`${this.baseUrl}/animals/${petId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.animal;
    }, `fetchPetDetails (petId: ${petId})`);
  }

  async fetchOrganizations(
    page = 1,
    limit = 20,
    location = 'New York, NY',
    distance = 100
  ) {
    if (process.env.USE_PETFINDER_API === 'false') {
      logger.warn('[DEV MODE] fetchOrganizations skipped. Returning empty.');
      return { organizations: [], pagination: { total_pages: 1 } };
    }

    return this.retryWithBackoff(async () => {
      const token = await this.getToken();
      const response = await axios.get(`${this.baseUrl}/organizations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page,
          limit,
          location,
          distance,
        },
      });
      return response.data;
    }, `fetchOrganizations (page ${page}, location: ${location})`);
  }

  async fetchOrganizationDetails(orgId) {
    return this.retryWithBackoff(async () => {
      const token = await this.getToken();
      const response = await axios.get(
        `${this.baseUrl}/organizations/${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.organization;
    }, `fetchOrganizationDetails (orgId: ${orgId})`);
  }

  async fetchOrganizationPets(orgId, page = 1, limit = 20) {
    if (process.env.USE_PETFINDER_API === 'false') {
      logger.warn('[DEV MODE] fetchOrganizationPets skipped. Returning empty.');
      return { animals: [], pagination: { total_pages: 1 } };
    }

    return this.retryWithBackoff(async () => {
      const token = await this.getToken();
      const response = await axios.get(`${this.baseUrl}/animals`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          organization: orgId,
          page,
          limit,
          status: 'adoptable',
        },
      });
      return response.data;
    }, `fetchOrganizationPets (orgId: ${orgId}, page: ${page})`);
  }

  async saveOrganizationToDb(orgData) {
    return this.retryWithBackoff(async () => {
      if (!orgData || !orgData.id) {
        logger.warn('Invalid organization data');
        return null;
      }

      // Check if organization already exists
      const existingOrg = await User.findOne({
        'metadata.externalId': orgData.id.toString(),
      });

      if (existingOrg) {
        logger.info('Organization already exists:', orgData.id);
        return existingOrg;
      }

      // Create new organization
      const orgName = orgData.name || 'Unknown Organization';
      const orgPassword = crypto.randomBytes(8).toString('hex');

      const newOrg = new User({
        name: orgName,
        email: orgData.email || `${orgData.id}@petfinder.org`,
        password: orgPassword,
        role: UserRoleEnum.SHELTER,
        metadata: {
          externalId: orgData.id.toString(),
          type: 'petfinder',
          data: orgData,
        },
      });

      await newOrg.save();
      logger.info('New organization saved:', orgName);

      return newOrg;
    }, `saveOrganizationToDb (orgId: ${orgData?.id})`);
  }

  async savePetToDb(petData, shelterId) {
    return this.retryWithBackoff(async () => {
      if (!shelterId) {
        logger.warn('No shelter ID provided for pet');
        return null;
      }

      if (!petData || !petData.id) {
        logger.warn('Invalid pet data');
        return null;
      }

      // Check if pet already exists
      const existingPet = await Pet.findOne({
        'metadata.externalId': petData.id.toString(),
        'metadata.source': 'petfinder',
      });

      if (existingPet) {
        logger.info('Pet already exists:', petData.id);
        return existingPet;
      }

      // Create pet document using the helper method
      const newPetObj = this.createPetDocument(petData, shelterId);

      // Apply schema filtering to ensure only valid fields are included
      const sanitizedPet = sanitizePetObject(newPetObj);

      // Create and save the pet document
      const pet = new Pet(sanitizedPet);
      await pet.save();

      logger.info(`Saved pet: ${pet.name} (${pet.type})`);
      return pet;
    }, `savePetToDb (petId: ${petData?.id})`);
  }

  async importPets(options = {}) {
    const { limit = 20, type, location, checkpointData = null } = options;
    const MAX_PETS = 100; // Maximum number of pets to import
    let page = checkpointData?.currentPage || 1;
    let hasMore = true;
    let totalImported = checkpointData?.totalImported || 0;
    let totalProcessed = checkpointData?.totalProcessed || 0;
    let completedPetIds = checkpointData?.completedPetIds || [];

    // Create a cool progress bar! 😎
    const bar = new cliProgress.SingleBar(
      {
        format:
          '🚀 Pet Import Progress |{bar}| {percentage}% | {value}/{total} pets | ETA: {eta}s | Speed: {speed} pets/s | Page: {page}',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true,
        clearOnComplete: true,
      },
      cliProgress.Presets.shades_classic
    );

    // Start the progress bar
    bar.start(MAX_PETS, totalImported, { page });

    // Production-friendly logging
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      // Console: Only show essential info
      console.log('🚀 Starting pet import from Petfinder...');
      console.log(
        `📊 Target: ${MAX_PETS} pets, Batch size: ${this.BATCH_SIZE}`
      );

      // File: Detailed logging
      logger.info('Starting pet import from Petfinder...', {
        options: { limit, type, location },
        config: {
          concurrentRequests: this.CONCURRENT_REQUESTS,
          batchSize: this.BATCH_SIZE,
          maxRetries: this.MAX_RETRIES,
          retryDelays: this.RETRY_DELAYS,
        },
      });
    } else {
      // Development: Show all details
      logger.info('Starting pet import from Petfinder...');
      logger.info('Options:', { limit, type, location });
      logger.info(
        `🚀 Using parallel processing with concurrency: ${this.CONCURRENT_REQUESTS}, batch size: ${this.BATCH_SIZE}`
      );
      logger.info('🛡️ Rate limiting enabled with retry mechanism');
      logger.info(
        `📊 Retry config: ${this.MAX_RETRIES} max retries, delays: ${this.RETRY_DELAYS.join(', ')}ms`
      );
    }

    if (checkpointData) {
      logger.info('🔄 Resuming from checkpoint:', {
        page: checkpointData.currentPage,
        totalProcessed: checkpointData.totalProcessed,
        totalImported: checkpointData.totalImported,
      });
    }

    try {
      // Parallel batch processing function with bulk insert optimization
      const processBatch = async (batch, shelterId) => {
        if (isProduction) {
          // Console: Minimal info
          console.log(`📦 Processing batch of ${batch.length} pets...`);

          // File: Detailed logging
          logger.info('Processing batch', {
            batchSize: batch.length,
            shelterId,
            method: 'bulk_insert',
          });
        } else {
          logger.info(
            `🔄 Processing batch of ${batch.length} pets with bulk insert optimization...`
          );
        }

        try {
          // Use bulk insert for better performance
          const bulkResult = await this.bulkInsertPets(batch, shelterId);

          // Convert bulk result to individual results for compatibility
          const results = batch.map((pet) => {
            const petId = pet.id?.toString();
            const wasInserted = bulkResult.inserted > 0; // Simplified check
            const wasSkipped = bulkResult.skipped > 0; // Simplified check

            if (wasInserted) {
              return {
                status: 'fulfilled',
                value: { id: petId, name: pet.name },
              };
            } else if (wasSkipped) {
              return { status: 'fulfilled', value: null }; // Already exists
            } else {
              return {
                status: 'rejected',
                reason: new Error('Bulk insert failed'),
              };
            }
          });

          if (isProduction) {
            // Console: Progress update
            console.log(
              `✅ Batch: ${bulkResult.inserted} inserted, ${bulkResult.skipped} skipped`
            );

            // File: Detailed results
            logger.info('Batch completed', {
              batchSize: batch.length,
              inserted: bulkResult.inserted,
              skipped: bulkResult.skipped,
              errors: bulkResult.errors,
              method: 'bulk_insert',
            });
          } else {
            logger.info(
              `✅ Bulk batch completed: ${bulkResult.inserted} inserted, ${bulkResult.skipped} skipped, ${bulkResult.errors} errors`
            );
          }

          return results;
        } catch (error) {
          if (isProduction) {
            console.log(`⚠️ Batch failed, using individual processing...`);
            logger.error(
              'Bulk batch failed, falling back to individual processing',
              {
                error: error.message,
                batchSize: batch.length,
                shelterId,
              }
            );
          } else {
            logger.error(
              '❌ Bulk batch failed, falling back to individual processing:',
              error.message
            );
          }

          // Fall back to individual processing if bulk insert fails
          const results = await Promise.allSettled(
            batch.map((pet) =>
              this.limit(async () => {
                try {
                  return await this.savePetToDb(pet, shelterId);
                } catch (error) {
                  if (isProduction) {
                    logger.error('Failed to process pet', {
                      petId: pet.id,
                      error: error.message,
                    });
                  } else {
                    logger.error(
                      `Failed to process pet ${pet.id}:`,
                      error.message
                    );
                  }
                  return null;
                }
              })
            )
          );

          return results;
        }
      };

      while (hasMore) {
        try {
          const pets = await this.fetchPets(page, limit);

          if (!pets || !pets.animals || pets.animals.length === 0) {
            hasMore = false;
            continue;
          }

          if (isProduction) {
            // Console: Minimal page info
            console.log(`📄 Page ${page}: ${pets.animals.length} pets found`);

            // File: Detailed page info
            logger.info('Processing page', {
              page,
              totalPets: pets.animals.length,
              checkpointData: { totalProcessed, totalImported },
            });
          } else {
            logger.info(
              `\n📦 Processing ${pets.animals.length} pets from page ${page}...`
            );
          }

          // Filter out already processed pets
          const unprocessedPets = pets.animals.filter(
            (pet) => !completedPetIds.includes(pet.id)
          );

          if (unprocessedPets.length === 0) {
            if (isProduction) {
              console.log(`⏭️ Page ${page}: All pets already processed`);
              logger.info('Page skipped - all pets already processed', {
                page,
              });
            } else {
              logger.info(
                `⏭️ All pets on page ${page} already processed, skipping`
              );
            }
            page++;
            continue;
          }

          if (isProduction) {
            console.log(
              `📦 Page ${page}: Processing ${unprocessedPets.length} new pets`
            );
            logger.info('Processing unprocessed pets', {
              page,
              unprocessedCount: unprocessedPets.length,
              totalCount: pets.animals.length,
            });
          } else {
            logger.info(
              `📦 Processing ${unprocessedPets.length} unprocessed pets from page ${page}...`
            );
          }

          // Process pets in parallel batches
          for (let i = 0; i < unprocessedPets.length; i += this.BATCH_SIZE) {
            const batch = unprocessedPets.slice(i, i + this.BATCH_SIZE);

            // Use the parallel batch processing function
            const batchResults = await processBatch(
              batch,
              batch[0]?.organization_id
            );

            // Count successful imports and skips
            batchResults.forEach((result, index) => {
              const petId = batch[index].id;

              if (result.status === 'fulfilled' && result.value) {
                totalImported++;
                completedPetIds.push(petId);
                // Update the progress bar for each successful import! 😎
                bar.increment(1, { page });
              } else {
                logger.error(`Failed to process pet ${petId}:`, result.reason);
              }

              totalProcessed++;
            });

            if (isProduction) {
              // Console: Progress update
              console.log(
                `📊 Progress: ${totalImported}/${MAX_PETS} imported (${Math.round((totalImported / MAX_PETS) * 100)}%)`
              );

              // File: Detailed progress
              logger.info('Batch progress update', {
                totalProcessed,
                totalImported,
                maxPets: MAX_PETS,
                progressPercentage: Math.round(
                  (totalImported / MAX_PETS) * 100
                ),
                page,
              });
            } else {
              logger.info(
                `✅ Batch completed. Progress: ${totalImported}/${MAX_PETS} imported, ${totalProcessed} total processed`
              );
            }

            if (totalImported >= MAX_PETS) {
              if (isProduction) {
                console.log(`🎯 Reached target limit: ${MAX_PETS} pets`);
                logger.info('Import limit reached', {
                  maxPets: MAX_PETS,
                  totalImported,
                });
              } else {
                logger.info(`🎯 Reached MAX_PETS limit: ${MAX_PETS}`);
              }
              hasMore = false;
              break;
            }

            // Add a delay between batches to respect rate limits
            if (i + this.BATCH_SIZE < unprocessedPets.length) {
              const delay = Math.max(1000, this.requestCount * 50); // Progressive delay
              logger.debug(
                `⏳ Waiting ${delay}ms between batches (request count: ${this.requestCount})`
              );
              await this.delay(delay);
            }
          }

          page++;
          // Update progress bar with new page info
          bar.update(totalImported, { page });

          // Adaptive delay between pages based on request count
          const pageDelay = Math.max(2000, this.requestCount * 100);
          logger.debug(
            `⏳ Waiting ${pageDelay}ms between pages (request count: ${this.requestCount})`
          );
          await this.delay(pageDelay);
        } catch (error) {
          logger.error('Error during pet import:', error);
          hasMore = false;
        }
      }
    } finally {
      // Stop the progress bar and show completion! 🎉
      bar.stop();
    }

    // Calculate final statistics
    const finalStats = {
      totalProcessed,
      totalImported,
      totalSkipped: totalProcessed - totalImported,
      successRate:
        totalProcessed > 0
          ? Math.round((totalImported / totalProcessed) * 100)
          : 0,
      pagesProcessed: page - 1,
      batchesProcessed: Math.ceil(totalProcessed / this.BATCH_SIZE),
    };

    // Rate limiting statistics
    const rateLimitStats = this.getRateLimitStatus();
    const rateLimitSummary = {
      totalRequests: rateLimitStats.requestCount,
      averageTimeBetweenRequests:
        rateLimitStats.timeSinceLastRequest > 0
          ? Math.round(
              rateLimitStats.timeSinceLastRequest / rateLimitStats.requestCount
            )
          : 0,
      rateLimitHits: rateLimitStats.rateLimitResetTime > 0 ? 'Yes' : 'No',
    };

    if (isProduction) {
      // Console: Clean summary
      console.log('\n🎉 Pet Import Completed!');
      console.log('='.repeat(50));
      console.log(
        `🎯 Target Reached: ${finalStats.totalImported}/${MAX_PETS} pets imported`
      );
      console.log(`📊 Total Processed: ${finalStats.totalProcessed}`);
      console.log(`⏭️ Skipped (Already Exists): ${finalStats.totalSkipped}`);
      console.log(`📈 Success Rate: ${finalStats.successRate}%`);
      console.log(`📄 Pages Processed: ${finalStats.pagesProcessed}`);
      console.log(`📦 Batches Processed: ${finalStats.batchesProcessed}`);
      console.log(`🌐 API Requests: ${rateLimitSummary.totalRequests}`);
      console.log(
        `⏱️ Avg Request Time: ${rateLimitSummary.averageTimeBetweenRequests}ms`
      );
      console.log('='.repeat(50));

      // File: Detailed summary
      logger.info('Pet import completed - SUMMARY', {
        finalStats,
        rateLimitStats: rateLimitSummary,
        importSession: {
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: 'calculated', // You could add actual duration tracking
        },
      });
    } else {
      // Development: Detailed logging
      logger.info('Pet import completed');
      logger.info('Summary:', {
        totalProcessed,
        totalImported,
        updated: totalProcessed - totalImported,
      });

      logger.info('📊 Rate limiting statistics:', rateLimitSummary);
    }

    return {
      totalProcessed,
      imported: totalImported,
      updated: totalProcessed - totalImported,
      checkpointData: {
        currentPage: page,
        totalProcessed,
        totalImported,
        completedPetIds,
      },
    };
  }
}

export const petfinderService = new PetfinderService();
export default PetfinderService;
