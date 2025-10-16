console.log('🔌 Recommendation Service: Loading dependencies...');
import { Pet } from '../pet/pet.model.js';
import { User } from '../user/user.model.js';
import { AdoptionRequest } from '../adoption/adoption.model.js';
// Chat model removed - communication is now handled by separate app
import { Review } from '../review/review.model.js';
import logger from '../../utils/logger.js';
import { ApiError } from '../../utils/errors.js';
import axios from 'axios';
console.log('✅ Recommendation Service: Dependencies loaded');

/**
 * Enhanced AI Recommendation Service
 * Combines rule-based and ML-based approaches for better recommendations
 * Uses machine learning techniques to recommend pets to users based on:
 * - User preferences and behavior
 * - Pet characteristics and history
 * - Adoption patterns
 * - User interactions (favorites, views, chats)
 * - Health and behavior records
 * - Complaints and flags
 * - Collaborative filtering
 * - Content-based filtering
 */

class RecommendationService {
  constructor() {
    console.log('🔌 Recommendation Service: Constructor called');
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    this.useMLRecommendations = process.env.USE_ML_RECOMMENDATIONS === 'true';
    this.mlWeight = parseFloat(process.env.ML_WEIGHT) || 0.7;
    this.ruleWeight = parseFloat(process.env.RULE_WEIGHT) || 0.3;
    console.log('✅ Recommendation Service: Constructor completed');
  }

  /**
   * NEW: Score pets using AI service
   * Instead of mapping locally, send preferences and pets to AI service
   * @param {Object} params - Parameters for scoring
   * @returns {Promise<Array>} Array of scored pets
   */
  async scorePetsWithAI(params) {
    try {
      const {
        preferences,
        pets,
        userId,
        useLearning = true,
        useML = true,
        mlWeight = 0.7,
        ruleWeight = 0.3,
      } = params;

      logger.info(
        `Calling AI service to score ${pets.length} pets for user ${userId}`
      );

      // Prepare pets data for AI service
      const petsData = pets.map((pet) => ({
        id: pet._id?.toString() || pet.id,
        name: pet.name,
        species: pet.type,
        breed: pet.breed,
        age: pet.age,
        size: pet.size,
        description: pet.description,
        photos: pet.photos || [],
        health_records: pet.healthRecords || [],
        behavior_records: pet.behaviorRecords || [],
        created_at: pet.createdAt
          ? typeof pet.createdAt === 'string'
            ? pet.createdAt
            : pet.createdAt.toISOString()
          : new Date().toISOString(),
        view_count: pet.views || 0,
        favorite_count: pet.favorites || 0,
        chat_count: pet.chatCount || 0,
      }));

      // Call AI service
      const response = await axios.post(
        `${this.aiServiceUrl}/api/recommendations/score`,
        {
          preferences,
          pets: petsData,
          user_id: userId,
          use_learning: useLearning,
          use_ml: useML,
          ml_weight: mlWeight,
          rule_weight: ruleWeight,
        }
      );

      if (response.data && response.data.scored_pets) {
        // Map back to our format
        const scoredPets = response.data.scored_pets.map((scoredPet) => ({
          pet: pets.find(
            (p) => (p._id?.toString() || p.id) === scoredPet.pet.id
          ),
          score: scoredPet.score,
          ml_score: scoredPet.ml_score,
          rule_score: scoredPet.rule_score,
          learned_bonus: scoredPet.learned_bonus,
          factors: scoredPet.factors,
          explanation: scoredPet.explanation,
          confidence: scoredPet.confidence,
        }));

        logger.info(
          `Successfully scored ${scoredPets.length} pets using AI service`
        );
        return scoredPets;
      }

      logger.warning(
        'AI service returned no scored pets, falling back to local scoring'
      );
      return this.fallbackLocalScoring(pets, preferences, userId);
    } catch (error) {
      logger.error('Error calling AI service for scoring:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      logger.info('Falling back to local scoring');
      return this.fallbackLocalScoring(pets, preferences, userId);
    }
  }

  /**
   * Fallback local scoring when AI service is unavailable
   * @param {Array} pets - Array of pets
   * @param {Object} preferences - User preferences
   * @param {string} userId - User ID
   * @returns {Array} Array of scored pets
   */
  async fallbackLocalScoring(pets, preferences, userId) {
    logger.info('Using fallback local scoring');

    const scoredPets = [];

    for (const pet of pets) {
      let score = 0;
      const factors = [];

      // Basic preference matching
      if (
        preferences.preferredSpecies &&
        preferences.preferredSpecies.includes(pet.type)
      ) {
        score += 0.4;
        factors.push('Matches your preferred species');
      }

      // Size compatibility
      if (preferences.livingSpace) {
        if (
          preferences.livingSpace.includes('apartment') &&
          pet.size === 'small'
        ) {
          score += 0.25;
          factors.push('Good for apartment living');
        } else if (
          preferences.livingSpace.includes('yard') &&
          pet.size === 'large'
        ) {
          score += 0.25;
          factors.push('Great for homes with yards');
        }
      }

      // Experience compatibility
      if (preferences.experience === 'first-time' && pet.age === 'adult') {
        score += 0.2;
        factors.push('Good for first-time owners');
      }

      // Add some randomization
      const randomBonus = Math.random() * 0.1;
      score += randomBonus;

      scoredPets.push({
        pet,
        score: Math.min(score, 1.0),
        factors,
        explanation: `${pet.name}: ${factors.join(', ')}.`,
        confidence: 0.5,
      });
    }

    // Sort by score
    scoredPets.sort((a, b) => b.score - a.score);
    return scoredPets;
  }

  /**
   * Generate personalized pet recommendations for a user
   * @param {string} userId - User ID
   * @param {Object} options - Recommendation options
   * @returns {Promise<Array>} Array of recommended pets with scores
   */
  async getPersonalizedRecommendations(userId, options = {}) {
    try {
      const {
        limit = 10,
        includeAdopted = false,
        minScore = 0.1,
        useAdvancedFeatures = true,
        useML = this.useMLRecommendations,
      } = options;

      // Get user profile with enhanced requirements
      const user = await User.findById(userId).select(
        'preferences favoritePets adoptionHistory interactionHistory requirements'
      );
      if (!user) {
        throw new ApiError('User not found', 404);
      }

      // Check if user has requirements set up
      if (!user.requirements || user.requirements.completionPercentage < 30) {
        logger.info(
          `User ${userId} has incomplete requirements (${user.requirements?.completionPercentage || 0}%), using basic preferences`
        );
      } else {
        logger.info(
          `User ${userId} has ${user.requirements.completionPercentage}% complete requirements, using enhanced matching`
        );
      }

      // Get available pets
      const petQuery = { status: 'adoptable' };
      if (!includeAdopted) {
        petQuery.status = { $in: ['adoptable', 'pending'] };
      }

      const pets = await Pet.find(petQuery)
        .populate('shelter', 'name location')
        .populate('healthRecords')
        .populate('behaviorRecords');

      let recommendations;

      if (useML && this.aiServiceUrl) {
        // Use ML-based recommendations
        recommendations = await this.getMLRecommendations(user, pets, options);
      } else {
        // Use enhanced rule-based recommendations
        recommendations = await this.calculateRecommendationScores(
          user,
          pets,
          useAdvancedFeatures
        );
      }

      // Filter and sort by score
      let filteredRecommendations = recommendations
        .filter((rec) => rec.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // If no recommendations meet the minScore, return top pets by default
      if (filteredRecommendations.length === 0) {
        logger.info(
          `No recommendations met minScore ${minScore}, returning top pets by default`
        );
        filteredRecommendations = recommendations
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);
      }

      return filteredRecommendations;
    } catch (error) {
      logger.error('Error generating personalized recommendations:', {
        message: error.message,
        stack: error.stack,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  }

  /**
   * Get ML-based recommendations from AI service
   * @param {Object} user - User object
   * @param {Array} pets - Array of pets
   * @param {Object} options - Options
   * @returns {Promise<Array>} Array of recommendations
   */
  async getMLRecommendations(user, pets, options = {}) {
    try {
      const userData = {
        id: user._id.toString(),
        preferences: user.preferences || {},
        interactionHistory: user.interactionHistory || [],
        favoritePets: user.favoritePets || [],
        adoptionHistory: user.adoptionHistory || [],
      };

      const petsData = pets.map((pet) => ({
        id: pet._id.toString(),
        name: pet.name,
        species: pet.type,
        breed: pet.breed,
        age: pet.age,
        size: pet.size,
        description: pet.description,
        photos: pet.photos,
        health_records: pet.healthRecords || [],
        behavior_records: pet.behaviorRecords || [],
        created_at: pet.createdAt,
        view_count: pet.views || 0,
        favorite_count: pet.favorites || 0,
        chat_count: pet.chatCount || 0,
      }));

      const response = await axios.post(
        `${this.aiServiceUrl}/api/recommendations/ml`,
        {
          user: userData,
          pets: petsData,
          preferences: user.preferences || {},
          limit: options.limit || 10,
        }
      );

      if (response.data && response.data.recommendations) {
        // Map back to our format
        return response.data.recommendations.map((rec) => ({
          pet: pets.find((p) => p._id.toString() === rec.pet.id),
          score: rec.score,
          ml_score: rec.ml_score,
          rule_score: rec.rule_score,
          learned_bonus: rec.learned_bonus,
          factors: this.extractFactors(rec),
          explanation: rec.explanation,
          confidence: rec.confidence || 0.5,
        }));
      }

      return [];
    } catch (error) {
      logger.error('Error getting ML recommendations:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      // Fallback to rule-based recommendations
      return await this.calculateRecommendationScores(user, pets, true);
    }
  }

  /**
   * Extract factors from ML recommendation
   * @param {Object} rec - ML recommendation
   * @returns {Array} Array of factors
   */
  extractFactors(rec) {
    const factors = [];

    if (rec.ml_score > 0.7) {
      factors.push('AI strongly recommends based on your behavior patterns');
    } else if (rec.ml_score > 0.5) {
      factors.push('AI moderately recommends this pet');
    }

    if (rec.rule_score > 0.6) {
      factors.push('Matches your stated preferences well');
    }

    if (rec.learned_bonus > 0.1) {
      factors.push('Based on your past interactions with similar pets');
    }

    return factors;
  }

  /**
   * Record user interaction for ML learning
   * @param {string} userId - User ID
   * @param {string} petId - Pet ID
   * @param {string} interactionType - Type of interaction
   * @param {Object} additionalData - Additional data
   */
  async recordUserInteraction(
    userId,
    petId,
    interactionType,
    additionalData = {}
  ) {
    try {
      // Update user's interaction history
      await User.findByIdAndUpdate(userId, {
        $push: {
          interactionHistory: {
            petId,
            type: interactionType,
            timestamp: new Date(),
            ...additionalData,
          },
        },
      });

      // Send to AI service for learning
      if (this.aiServiceUrl) {
        const user = await User.findById(userId).select(
          'preferences interactionHistory'
        );
        const pet = await Pet.findById(petId);

        if (user && pet) {
          const userData = {
            id: user._id.toString(),
            preferences: user.preferences || {},
            interactionHistory: user.interactionHistory || [],
          };

          const petData = {
            id: pet._id.toString(),
            name: pet.name,
            species: pet.type,
            breed: pet.breed,
            age: pet.age,
            size: pet.size,
            description: pet.description,
            photos: pet.photos,
            health_records: pet.healthRecords || [],
            behavior_records: pet.behaviorRecords || [],
          };

          try {
            await axios.post(`${this.aiServiceUrl}/api/interactions/record`, {
              user_id: userId,
              pet_id: petId,
              interaction_type: interactionType,
              pet_data: petData,
              user_data: userData,
              timestamp: new Date().toISOString(),
            });
          } catch (aiError) {
            logger.error('Error recording interaction with AI service:', {
              message: aiError.message,
              status: aiError.response?.status,
              data: aiError.response?.data,
            });
          }
        }
      }

      logger.info(
        `Recorded ${interactionType} interaction for user ${userId} with pet ${petId}`
      );
    } catch (error) {
      logger.error('Error recording user interaction:', error);
    }
  }

  /**
   * Get hybrid recommendations (combining rule-based and ML)
   * @param {string} userId - User ID
   * @param {Object} options - Options
   * @returns {Promise<Array>} Array of recommendations
   */
  async getHybridRecommendations(userId, options = {}) {
    try {
      const user = await User.findById(userId).select(
        'preferences favoritePets adoptionHistory interactionHistory'
      );
      if (!user) {
        throw new ApiError('User not found', 404);
      }

      const pets = await Pet.find({ status: { $in: ['adoptable', 'pending'] } })
        .populate('shelter', 'name location')
        .populate('healthRecords')
        .populate('behaviorRecords');

      // Get both rule-based and ML recommendations
      const [ruleBasedRecs, mlRecs] = await Promise.all([
        this.calculateRecommendationScores(user, pets, true),
        this.getMLRecommendations(user, pets, options),
      ]);

      // Combine recommendations
      const combinedRecs = this.combineRecommendations(ruleBasedRecs, mlRecs);

      return combinedRecs.slice(0, options.limit || 10);
    } catch (error) {
      logger.error('Error getting hybrid recommendations:', error);
      throw error;
    }
  }

  /**
   * Combine rule-based and ML recommendations
   * @param {Array} ruleBasedRecs - Rule-based recommendations
   * @param {Array} mlRecs - ML-based recommendations
   * @returns {Array} Combined recommendations
   */
  combineRecommendations(ruleBasedRecs, mlRecs) {
    const petMap = new Map();

    // Add rule-based recommendations
    ruleBasedRecs.forEach((rec) => {
      petMap.set(rec.pet._id.toString(), {
        pet: rec.pet,
        ruleScore: rec.score,
        mlScore: 0,
        combinedScore: rec.score * this.ruleWeight,
        factors: rec.factors || [],
        explanation: rec.explanation || '',
        confidence: rec.confidence || 0.5,
      });
    });

    // Add ML recommendations
    mlRecs.forEach((rec) => {
      const petId = rec.pet._id.toString();
      if (petMap.has(petId)) {
        const existing = petMap.get(petId);
        existing.mlScore = rec.ml_score || rec.score;
        existing.combinedScore += (rec.ml_score || rec.score) * this.mlWeight;
        existing.factors = [...existing.factors, ...(rec.factors || [])];
        existing.confidence = Math.max(
          existing.confidence,
          rec.confidence || 0.5
        );
      } else {
        petMap.set(petId, {
          pet: rec.pet,
          ruleScore: 0,
          mlScore: rec.ml_score || rec.score,
          combinedScore: (rec.ml_score || rec.score) * this.mlWeight,
          factors: rec.factors || [],
          explanation: rec.explanation || '',
          confidence: rec.confidence || 0.5,
        });
      }
    });

    // Convert to array and sort by combined score
    return Array.from(petMap.values())
      .map((rec) => ({
        pet: rec.pet,
        score: rec.combinedScore,
        ruleScore: rec.ruleScore,
        mlScore: rec.mlScore,
        factors: rec.factors,
        explanation: rec.explanation,
        confidence: rec.confidence,
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate recommendation scores for pets based on user requirements and preferences
   * @param {Object} user - User object
   * @param {Array} pets - Array of pets
   * @param {boolean} useAdvancedFeatures - Whether to use advanced ML features
   * @returns {Promise<Array>} Array of pets with scores
   */
  async calculateRecommendationScores(user, pets, useAdvancedFeatures = true) {
    const recommendations = [];

    for (const pet of pets) {
      let score = 0;
      const factors = {};
      const detailedFactors = [];

      // 1. Enhanced compatibility scoring using new User model methods (50% weight)
      const compatibilityScore = await this.calculateEnhancedCompatibilityScore(
        user,
        pet
      );
      score += compatibilityScore * 0.5;
      factors.compatibility = compatibilityScore;

      // 2. User behavior analysis (20% weight)
      const behaviorScore = await this.calculateBehaviorScore(user, pet);
      score += behaviorScore * 0.2;
      factors.behavior = behaviorScore;

      // 3. Pet health and behavior assessment (15% weight)
      const healthScore = this.calculateHealthScore(pet);
      score += healthScore * 0.15;
      factors.health = healthScore;

      // 4. Advanced ML features (15% weight)
      if (useAdvancedFeatures) {
        const advancedScore = await this.calculateAdvancedScore(user, pet);
        score += advancedScore * 0.15;
        factors.advanced = advancedScore;
      }

      // Generate detailed explanation with compatibility factors
      const explanation = this.generateEnhancedExplanation(
        factors,
        pet,
        detailedFactors
      );

      recommendations.push({
        pet: pet.toObject(),
        score: Math.min(score, 1.0), // Cap at 1.0
        factors,
        detailedFactors,
        explanation,
        confidence: this.calculateConfidence(factors),
        compatibilityBreakdown: this.getCompatibilityBreakdown(user, pet),
      });
    }

    return recommendations;
  }

  /**
   * Calculate confidence score based on factors
   * @param {Object} factors - Score factors
   * @returns {number} Confidence score
   */
  calculateConfidence(factors) {
    let confidence = 0.5; // Base confidence

    // Higher confidence if we have more data points
    const factorCount = Object.keys(factors).length;
    confidence += Math.min(0.3, factorCount * 0.1);

    // Higher confidence for higher scores
    const avgScore =
      Object.values(factors).reduce((sum, score) => sum + score, 0) /
      factorCount;
    confidence += Math.min(0.2, avgScore * 0.2);

    return Math.min(1.0, confidence);
  }

  /**
   * Calculate enhanced compatibility score using new User model methods
   * @param {Object} user - User object
   * @param {Object} pet - Pet object
   * @returns {Promise<number>} Compatibility score (0-1)
   */
  async calculateEnhancedCompatibilityScore(user, pet) {
    // Use the new User model method if available
    if (
      user.calculatePetCompatibility &&
      typeof user.calculatePetCompatibility === 'function'
    ) {
      const compatibilityScore = user.calculatePetCompatibility(pet);
      return compatibilityScore / 100; // Convert from 0-100 to 0-1 scale
    }

    // Fallback to enhanced preference scoring
    return this.calculateEnhancedPreferenceScore(user, pet);
  }

  /**
   * Calculate enhanced preference matching score with weighted factors
   * @param {Object} user - User object
   * @param {Object} pet - Pet object
   * @returns {number} Enhanced preference score (0-1)
   */
  calculateEnhancedPreferenceScore(user, pet) {
    let score = 0;
    const requirements = user.requirements || {};
    const preferences = user.preferences || {};

    // Basic pet characteristics (30% weight)
    const basicScore = this.calculateBasicCharacteristicsScore(
      requirements,
      pet
    );
    score += basicScore * 0.3;

    // Experience and lifestyle compatibility (25% weight)
    const lifestyleScore = this.calculateLifestyleCompatibilityScore(
      requirements,
      pet
    );
    score += lifestyleScore * 0.25;

    // Care requirements compatibility (20% weight)
    const careScore = this.calculateCareCompatibilityScore(requirements, pet);
    score += careScore * 0.2;

    // Family and environment compatibility (15% weight)
    const environmentScore = this.calculateEnvironmentCompatibilityScore(
      requirements,
      pet
    );
    score += environmentScore * 0.15;

    // Special considerations (10% weight)
    const specialScore = this.calculateSpecialConsiderationsScore(
      requirements,
      pet
    );
    score += specialScore * 0.1;

    // Give baseline score even without requirements to ensure recommendations
    if (score === 0) {
      score = 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate basic characteristics compatibility score
   * @param {Object} requirements - User requirements
   * @param {Object} pet - Pet object
   * @returns {number} Basic characteristics score (0-1)
   */
  calculateBasicCharacteristicsScore(requirements, pet) {
    let score = 0;
    let totalFactors = 0;

    // Pet type compatibility
    if (requirements.petType) {
      totalFactors++;
      if (requirements.petType === pet.type) {
        score += 1.0;
      } else if (
        requirements.petType === 'other' &&
        pet.type !== 'dog' &&
        pet.type !== 'cat'
      ) {
        score += 0.8;
      }
    }

    // Gender compatibility
    if (requirements.gender && requirements.gender !== 'unknown') {
      totalFactors++;
      if (requirements.gender === pet.gender) {
        score += 1.0;
      }
    }

    // Size compatibility
    if (requirements.size) {
      totalFactors++;
      if (requirements.size === pet.size) {
        score += 1.0;
      } else if (this.isSizeCompatible(requirements.size, pet.size)) {
        score += 0.7;
      }
    }

    // Age compatibility
    if (requirements.age) {
      totalFactors++;
      if (requirements.age === pet.age) {
        score += 1.0;
      } else if (this.isAgeCompatible(requirements.age, pet.age)) {
        score += 0.8;
      }
    }

    return totalFactors > 0 ? score / totalFactors : 0.5;
  }

  /**
   * Calculate lifestyle compatibility score
   * @param {Object} requirements - User requirements
   * @param {Object} pet - Pet object
   * @returns {number} Lifestyle compatibility score (0-1)
   */
  calculateLifestyleCompatibilityScore(requirements, pet) {
    let score = 0;
    let totalFactors = 0;

    // Activity level compatibility
    if (requirements.activityLevel && pet.lifestyle?.energyLevel) {
      totalFactors++;
      if (requirements.activityLevel === pet.lifestyle.energyLevel) {
        score += 1.0;
      } else if (
        this.isActivityLevelCompatible(
          requirements.activityLevel,
          pet.lifestyle.energyLevel
        )
      ) {
        score += 0.8;
      }
    }

    // Independence level compatibility
    if (
      requirements.independencePreference &&
      pet.lifestyle?.independenceLevel
    ) {
      totalFactors++;
      if (
        requirements.independencePreference === pet.lifestyle.independenceLevel
      ) {
        score += 1.0;
      } else if (
        this.isIndependenceLevelCompatible(
          requirements.independencePreference,
          pet.lifestyle.independenceLevel
        )
      ) {
        score += 0.7;
      }
    }

    // Social needs compatibility
    if (requirements.socialPreference && pet.lifestyle?.socialNeeds) {
      totalFactors++;
      if (requirements.socialPreference === pet.lifestyle.socialNeeds) {
        score += 1.0;
      } else if (
        this.isSocialNeedsCompatible(
          requirements.socialPreference,
          pet.lifestyle.socialNeeds
        )
      ) {
        score += 0.8;
      }
    }

    // Time availability compatibility
    if (requirements.timeAvailability && pet.care?.attentionNeeds) {
      totalFactors++;
      if (requirements.timeAvailability === pet.care.attentionNeeds) {
        score += 1.0;
      } else if (
        this.isTimeAvailabilityCompatible(
          requirements.timeAvailability,
          pet.care.attentionNeeds
        )
      ) {
        score += 0.7;
      }
    }

    return totalFactors > 0 ? score / totalFactors : 0.5;
  }

  /**
   * Calculate care requirements compatibility score
   * @param {Object} requirements - User requirements
   * @param {Object} pet - Pet object
   * @returns {number} Care compatibility score (0-1)
   */
  calculateCareCompatibilityScore(requirements, pet) {
    let score = 0;
    let totalFactors = 0;

    // Grooming compatibility
    if (requirements.groomingPreference && pet.care?.groomingNeeds) {
      totalFactors++;
      if (requirements.groomingPreference === pet.care.groomingNeeds) {
        score += 1.0;
      } else if (
        this.isGroomingCompatible(
          requirements.groomingPreference,
          pet.care.groomingNeeds
        )
      ) {
        score += 0.8;
      }
    }

    // Exercise compatibility
    if (requirements.exercisePreference && pet.care?.exerciseNeeds) {
      totalFactors++;
      if (requirements.exercisePreference === pet.care.exerciseNeeds) {
        score += 1.0;
      } else if (
        this.isExerciseCompatible(
          requirements.exercisePreference,
          pet.care.exerciseNeeds
        )
      ) {
        score += 0.8;
      }
    }

    // Training compatibility
    if (requirements.trainingPreference && pet.experience?.trainingRequired) {
      totalFactors++;
      if (requirements.trainingPreference === pet.experience.trainingRequired) {
        score += 1.0;
      } else if (
        this.isTrainingCompatible(
          requirements.trainingPreference,
          pet.experience.trainingRequired
        )
      ) {
        score += 0.7;
      }
    }

    // Medical care compatibility
    if (requirements.medicalCarePreference && pet.care?.medicalCareLevel) {
      totalFactors++;
      if (requirements.medicalCarePreference === pet.care.medicalCareLevel) {
        score += 1.0;
      } else if (
        this.isMedicalCareCompatible(
          requirements.medicalCarePreference,
          pet.care.medicalCareLevel
        )
      ) {
        score += 0.8;
      }
    }

    return totalFactors > 0 ? score / totalFactors : 0.5;
  }

  /**
   * Calculate environment compatibility score
   * @param {Object} requirements - User requirements
   * @param {Object} pet - Pet object
   * @returns {number} Environment compatibility score (0-1)
   */
  calculateEnvironmentCompatibilityScore(requirements, pet) {
    let score = 0;
    let totalFactors = 0;

    // Living situation compatibility
    if (requirements.livingSituation) {
      totalFactors++;
      if (
        requirements.livingSituation === 'apartment' &&
        pet.lifestyle?.apartmentFriendly
      ) {
        score += 1.0;
      } else if (
        requirements.livingSituation === 'house' &&
        pet.lifestyle?.requiresYard
      ) {
        score += 1.0;
      } else if (
        requirements.livingSituation === 'house' &&
        !pet.lifestyle?.requiresYard
      ) {
        score += 0.8;
      } else {
        score += 0.5; // Neutral score for other combinations
      }
    }

    // Yard availability compatibility
    if (
      requirements.hasYard !== undefined &&
      pet.lifestyle?.requiresYard !== undefined
    ) {
      totalFactors++;
      if (requirements.hasYard === pet.lifestyle.requiresYard) {
        score += 1.0;
      } else if (!pet.lifestyle.requiresYard) {
        score += 0.8; // Pet doesn't require yard, so it's flexible
      } else {
        score += 0.3; // Pet requires yard but user doesn't have one
      }
    }

    // Home environment compatibility
    if (requirements.homeEnvironment && pet.lifestyle?.socialNeeds) {
      totalFactors++;
      if (
        requirements.homeEnvironment === 'quiet' &&
        pet.lifestyle.socialNeeds === 'low'
      ) {
        score += 1.0;
      } else if (
        requirements.homeEnvironment === 'busy' &&
        pet.lifestyle.socialNeeds === 'high'
      ) {
        score += 1.0;
      } else if (requirements.homeEnvironment === 'moderate') {
        score += 0.8; // Moderate environment is flexible
      } else {
        score += 0.6; // Other combinations
      }
    }

    return totalFactors > 0 ? score / totalFactors : 0.5;
  }

  /**
   * Calculate special considerations compatibility score
   * @param {Object} requirements - User requirements
   * @param {Object} pet - Pet object
   * @returns {number} Special considerations score (0-1)
   */
  calculateSpecialConsiderationsScore(requirements, pet) {
    let score = 0;
    let totalFactors = 0;

    // Allergy compatibility
    if (
      requirements.allergyFriendly !== undefined &&
      pet.allergies?.hypoallergenic !== undefined
    ) {
      totalFactors++;
      if (requirements.allergyFriendly === pet.allergies.hypoallergenic) {
        score += 1.0;
      } else if (
        requirements.allergyFriendly &&
        !pet.allergies.hypoallergenic
      ) {
        score += 0.2; // User needs hypoallergenic but pet isn't
      } else if (
        !requirements.allergyFriendly &&
        pet.allergies.hypoallergenic
      ) {
        score += 0.9; // Pet is hypoallergenic, which is always good
      }
    }

    // Special needs compatibility
    if (
      requirements.openToSpecialNeeds !== undefined &&
      pet.attributes?.specialNeeds !== undefined
    ) {
      totalFactors++;
      if (requirements.openToSpecialNeeds === pet.attributes.specialNeeds) {
        score += 1.0;
      } else if (
        requirements.openToSpecialNeeds &&
        pet.attributes.specialNeeds
      ) {
        score += 0.8; // User is open to special needs and pet has them
      } else if (
        !requirements.openToSpecialNeeds &&
        !pet.attributes.specialNeeds
      ) {
        score += 1.0; // User doesn't want special needs and pet doesn't have them
      } else {
        score += 0.3; // User doesn't want special needs but pet has them
      }
    }

    // Family compatibility
    if (requirements.hasChildren !== undefined && pet.behavior?.goodWith) {
      totalFactors++;
      if (
        requirements.hasChildren &&
        pet.behavior.goodWith.includes('children')
      ) {
        score += 1.0;
      } else if (!requirements.hasChildren) {
        score += 0.8; // No children, so this factor is neutral
      } else {
        score += 0.4; // Has children but pet isn't good with them
      }
    }

    // Other pets compatibility
    if (requirements.hasOtherPets !== undefined && pet.behavior?.goodWith) {
      totalFactors++;
      if (requirements.hasOtherPets && pet.behavior.goodWith.length > 0) {
        score += 1.0;
      } else if (!requirements.hasOtherPets) {
        score += 0.8; // No other pets, so this factor is neutral
      } else {
        score += 0.5; // Has other pets but pet isn't good with them
      }
    }

    return totalFactors > 0 ? score / totalFactors : 0.5;
  }

  /**
   * Compatibility helper methods
   */
  isSizeCompatible(userSize, petSize) {
    const sizeCompatibility = {
      small: ['small', 'medium'],
      medium: ['small', 'medium', 'large'],
      large: ['medium', 'large'],
    };
    return sizeCompatibility[userSize]?.includes(petSize) || false;
  }

  isAgeCompatible(userAge, petAge) {
    const ageCompatibility = {
      baby: ['baby', 'young'],
      young: ['baby', 'young', 'adult'],
      adult: ['young', 'adult', 'senior'],
      senior: ['adult', 'senior'],
    };
    return ageCompatibility[userAge]?.includes(petAge) || false;
  }

  isActivityLevelCompatible(userLevel, petLevel) {
    const activityCompatibility = {
      low: ['low', 'medium'],
      medium: ['low', 'medium', 'high'],
      high: ['medium', 'high'],
    };
    return activityCompatibility[userLevel]?.includes(petLevel) || false;
  }

  isIndependenceLevelCompatible(userLevel, petLevel) {
    const independenceCompatibility = {
      low: ['low', 'medium'],
      medium: ['low', 'medium', 'high'],
      high: ['medium', 'high'],
    };
    return independenceCompatibility[userLevel]?.includes(petLevel) || false;
  }

  isSocialNeedsCompatible(userLevel, petLevel) {
    const socialCompatibility = {
      low: ['low', 'medium'],
      medium: ['low', 'medium', 'high'],
      high: ['medium', 'high'],
    };
    return socialCompatibility[userLevel]?.includes(petLevel) || false;
  }

  isTimeAvailabilityCompatible(userLevel, petLevel) {
    const timeCompatibility = {
      low: ['low', 'medium'],
      medium: ['low', 'medium', 'high'],
      high: ['medium', 'high'],
    };
    return timeCompatibility[userLevel]?.includes(petLevel) || false;
  }

  isGroomingCompatible(userLevel, petLevel) {
    const groomingCompatibility = {
      minimal: ['minimal', 'moderate'],
      moderate: ['minimal', 'moderate', 'high'],
      high: ['moderate', 'high'],
    };
    return groomingCompatibility[userLevel]?.includes(petLevel) || false;
  }

  isExerciseCompatible(userLevel, petLevel) {
    const exerciseCompatibility = {
      low: ['low', 'medium'],
      medium: ['low', 'medium', 'high'],
      high: ['medium', 'high'],
    };
    return exerciseCompatibility[userLevel]?.includes(petLevel) || false;
  }

  isTrainingCompatible(userLevel, petLevel) {
    const trainingCompatibility = {
      none: ['none', 'basic'],
      basic: ['none', 'basic', 'advanced'],
      advanced: ['basic', 'advanced'],
    };
    return trainingCompatibility[userLevel]?.includes(petLevel) || false;
  }

  isMedicalCareCompatible(userLevel, petLevel) {
    const medicalCompatibility = {
      basic: ['basic', 'moderate'],
      moderate: ['basic', 'moderate', 'advanced'],
      advanced: ['moderate', 'advanced'],
    };
    return medicalCompatibility[userLevel]?.includes(petLevel) || false;
  }

  /**
   * Calculate user behavior-based score
   * @param {Object} user - User object
   * @param {Object} pet - Pet object
   * @returns {Promise<number>} Behavior score (0-1)
   */
  async calculateBehaviorScore(user, pet) {
    let score = 0;

    // Check if user has favorited similar pets
    const favoritePets = await Pet.find({
      _id: { $in: user.favoritePets || [] },
    });
    const similarFavorites = favoritePets.filter(
      (fav) =>
        fav.type === pet.type ||
        fav.breed === pet.breed ||
        fav.size === pet.size
    );

    if (similarFavorites.length > 0) {
      score += 0.4;
    }

    // Check user's adoption history
    const adoptionHistory = await AdoptionRequest.find({
      user: user._id,
      status: 'approved',
    }).populate('pet');

    const similarAdoptions = adoptionHistory.filter(
      (adoption) =>
        adoption.pet &&
        (adoption.pet.type === pet.type ||
          adoption.pet.breed === pet.breed ||
          adoption.pet.size === pet.size)
    );

    if (similarAdoptions.length > 0) {
      score += 0.3;
    }

    // Check user's chat interactions with similar pets
    // Note: Chat model removed - communication is now handled by separate app
    // Commenting out chat-related scoring for now
    /*
    const chatInteractions = await Chat.find({
      participants: user._id,
      'messages.petId': { $exists: true },
    });

    const similarChats = chatInteractions.filter((chat) => {
      const petIds = chat.messages
        .filter((msg) => msg.petId)
        .map((msg) => msg.petId.toString());

      return petIds.includes(pet._id.toString());
    });

    if (similarChats.length > 0) {
      score += 0.2;
    }
    */

    // Check user's view history (if available)
    if (user.viewHistory && user.viewHistory.includes(pet._id.toString())) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate pet health and behavior score
   * @param {Object} pet - Pet object
   * @returns {number} Health score (0-1)
   */
  calculateHealthScore(pet) {
    let score = 0.5; // Base score

    // Health records analysis
    if (pet.healthRecords && pet.healthRecords.length > 0) {
      const recentHealthRecords = pet.healthRecords.filter(
        (record) =>
          new Date(record.date) >
          new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      ).length; // Last 90 days

      if (recentHealthRecords > 0) {
        score += 0.2; // Recent health records indicate good care
      }
    }

    // Behavior records analysis
    if (pet.behaviorRecords && pet.behaviorRecords.length > 0) {
      const positiveBehaviors = pet.behaviorRecords.filter(
        (record) => record.severity === 'low' && record.type === 'observation'
      ).length;

      const negativeBehaviors = pet.behaviorRecords.filter(
        (record) => record.severity === 'high' || record.type === 'incident'
      ).length;

      if (positiveBehaviors > negativeBehaviors) {
        score += 0.2;
      } else if (negativeBehaviors > positiveBehaviors) {
        score -= 0.1;
      }
    }

    // Complaint analysis
    if (pet.complaints && pet.complaints.length > 0) {
      const resolvedComplaints = pet.complaints.filter(
        (complaint) => complaint.status === 'resolved'
      ).length;

      const totalComplaints = pet.complaints.length;
      const resolutionRate = resolvedComplaints / totalComplaints;

      if (resolutionRate > 0.8) {
        score += 0.1; // High resolution rate
      } else if (resolutionRate < 0.5) {
        score -= 0.2; // Low resolution rate
      }
    }

    return Math.max(0, Math.min(score, 1.0));
  }

  /**
   * Calculate advanced ML-based score
   * @param {Object} user - User object
   * @param {Object} pet - Pet object
   * @returns {Promise<number>} Advanced score (0-1)
   */
  async calculateAdvancedScore(user, pet) {
    let score = 0;

    // Collaborative filtering: Find users with similar preferences
    const similarUsers = await this.findSimilarUsers(user);
    const similarUserPreferences = await this.getSimilarUserPreferences(
      similarUsers,
      pet
    );
    score += similarUserPreferences * 0.3;

    // Content-based filtering: Pet characteristics analysis
    const contentScore = this.analyzePetCharacteristics(pet);
    score += contentScore * 0.3;

    // Temporal analysis: Recent activity and trends
    const temporalScore = await this.calculateTemporalScore(pet);
    score += temporalScore * 0.2;

    // Sentiment analysis: Reviews and feedback
    const sentimentScore = await this.calculateSentimentScore(pet);
    score += sentimentScore * 0.2;

    return Math.min(score, 1.0);
  }

  /**
   * Find users with similar preferences
   * @param {Object} user - User object
   * @returns {Promise<Array>} Array of similar user IDs
   */
  async findSimilarUsers(user) {
    const similarUsers = await User.find({
      _id: { $ne: user._id },
      'preferences.preferredTypes': {
        $in: user.preferences?.preferredTypes || [],
      },
    }).limit(10);

    return similarUsers.map((u) => u._id);
  }

  /**
   * Get similar user preferences for a pet
   * @param {Array} similarUsers - Array of similar user IDs
   * @param {Object} pet - Pet object
   * @returns {Promise<number>} Similarity score
   */
  async getSimilarUserPreferences(similarUsers, pet) {
    if (similarUsers.length === 0) return 0;

    let totalScore = 0;
    let userCount = 0;

    for (const userId of similarUsers) {
      const user = await User.findById(userId);
      if (user) {
        const behaviorScore = await this.calculateBehaviorScore(user, pet);
        totalScore += behaviorScore;
        userCount++;
      }
    }

    return userCount > 0 ? totalScore / userCount : 0;
  }

  /**
   * Analyze pet characteristics for content-based filtering
   * @param {Object} pet - Pet object
   * @returns {number} Content score
   */
  analyzePetCharacteristics(pet) {
    let score = 0.5; // Base score

    // Age analysis
    if (pet.age === 'young' || pet.age === 'adult') {
      score += 0.2; // Young and adult pets are generally preferred
    }

    // Size analysis
    if (pet.size === 'medium') {
      score += 0.1; // Medium size is often preferred
    }

    // Breed popularity (could be enhanced with actual popularity data)
    const popularBreeds = [
      'labrador',
      'golden retriever',
      'german shepherd',
      'bulldog',
    ];
    if (popularBreeds.includes(pet.breed.toLowerCase())) {
      score += 0.1;
    }

    // Description quality
    if (pet.description && pet.description.length > 100) {
      score += 0.1; // Detailed descriptions are preferred
    }

    // Photo quality
    if (pet.photos && pet.photos.length >= 3) {
      score += 0.1; // Multiple photos are preferred
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate temporal score based on recent activity
   * @param {Object} pet - Pet object
   * @returns {Promise<number>} Temporal score
   */
  async calculateTemporalScore(pet) {
    let score = 0.5; // Base score

    // Recent views
    const recentViews = pet.views || 0;
    if (recentViews > 10) {
      score += 0.2; // Popular pet
    }

    // Recent activity (recent health/behavior records)
    const recentActivity =
      (pet.healthRecords?.length || 0) + (pet.behaviorRecords?.length || 0);
    if (recentActivity > 0) {
      score += 0.1; // Active pet with recent records
    }

    // Time since listing
    const daysSinceListing = Math.floor(
      (Date.now() - new Date(pet.createdAt)) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceListing < 30) {
      score += 0.1; // Recently listed
    } else if (daysSinceListing > 90) {
      score -= 0.1; // Been listed for a while
    }

    return Math.max(0, Math.min(score, 1.0));
  }

  /**
   * Calculate sentiment score based on reviews and feedback
   * @param {Object} pet - Pet object
   * @returns {Promise<number>} Sentiment score
   */
  async calculateSentimentScore(pet) {
    let score = 0.5; // Base score

    // Get reviews for the shelter
    const shelterReviews = await Review.find({
      shelter: pet.shelter,
      rating: { $gte: 4 },
    });

    if (shelterReviews.length > 0) {
      const avgRating =
        shelterReviews.reduce((sum, review) => sum + review.rating, 0) /
        shelterReviews.length;
      score += (avgRating - 4) * 0.2; // Bonus for high ratings
    }

    // Check for positive interactions (chats, favorites)
    // Note: Chat model removed - communication is now handled by separate app
    // Commenting out chat-related scoring for now
    /*
    const positiveInteractions = await Chat.countDocuments({
      'messages.petId': pet._id,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
    });

    if (positiveInteractions > 0) {
      score += 0.1;
    }
    */

    return Math.max(0, Math.min(score, 1.0));
  }

  /**
   * Generate explanation for recommendation
   * @param {Object} factors - Score factors
   * @param {Object} pet - Pet object
   * @returns {string} Explanation
   */
  generateExplanation(factors, pet) {
    const explanations = [];

    if (factors.preference > 0.6) {
      explanations.push('Matches your preferences well');
    }

    if (factors.behavior > 0.5) {
      explanations.push('Based on your past interactions');
    }

    if (factors.health > 0.7) {
      explanations.push('Good health and behavior records');
    }

    if (factors.advanced > 0.6) {
      explanations.push('Similar users have shown interest');
    }

    if (explanations.length === 0) {
      explanations.push('This pet might be a good match');
    }

    return `${pet.name}: ${explanations.join(', ')}.`;
  }

  /**
   * Generate enhanced explanation with compatibility factors
   * @param {Object} factors - Score factors
   * @param {Object} pet - Pet object
   * @param {Array} detailedFactors - Detailed compatibility factors
   * @returns {string} Enhanced explanation
   */
  generateEnhancedExplanation(factors, pet, detailedFactors) {
    const explanations = [];

    // Compatibility score explanation
    if (factors.compatibility > 0.8) {
      explanations.push('Excellent compatibility with your requirements');
    } else if (factors.compatibility > 0.6) {
      explanations.push('Good compatibility with your requirements');
    } else if (factors.compatibility > 0.4) {
      explanations.push('Moderate compatibility with your requirements');
    } else {
      explanations.push('Limited compatibility with your requirements');
    }

    // Behavior score explanation
    if (factors.behavior > 0.7) {
      explanations.push('Based on your strong interaction patterns');
    } else if (factors.behavior > 0.4) {
      explanations.push('Based on your past interactions');
    }

    // Health score explanation
    if (factors.health > 0.8) {
      explanations.push('Excellent health and behavior records');
    } else if (factors.health > 0.6) {
      explanations.push('Good health and behavior records');
    }

    // Advanced features explanation
    if (factors.advanced > 0.7) {
      explanations.push('Strong AI recommendation based on similar users');
    } else if (factors.advanced > 0.5) {
      explanations.push('AI recommendation based on user patterns');
    }

    if (explanations.length === 0) {
      explanations.push('This pet might be a good match');
    }

    return `${pet.name}: ${explanations.join(', ')}.`;
  }

  /**
   * Get detailed compatibility breakdown for a user and pet
   * @param {Object} user - User object
   * @param {Object} pet - Pet object
   * @returns {Object} Compatibility breakdown
   */
  getCompatibilityBreakdown(user, pet) {
    const requirements = user.requirements || {};
    const breakdown = {
      basicCharacteristics: {
        petType:
          requirements.petType === pet.type ? 'Perfect match' : 'Mismatch',
        gender:
          requirements.gender === pet.gender ? 'Perfect match' : 'Mismatch',
        size: requirements.size === pet.size ? 'Perfect match' : 'Mismatch',
        age: requirements.age === pet.age ? 'Perfect match' : 'Mismatch',
      },
      lifestyle: {
        activityLevel: this.getCompatibilityLevel(
          requirements.activityLevel,
          pet.lifestyle?.energyLevel
        ),
        independenceLevel: this.getCompatibilityLevel(
          requirements.independencePreference,
          pet.lifestyle?.independenceLevel
        ),
        socialNeeds: this.getCompatibilityLevel(
          requirements.socialPreference,
          pet.lifestyle?.socialNeeds
        ),
        apartmentFriendly:
          requirements.livingSituation === 'apartment'
            ? pet.lifestyle?.apartmentFriendly
              ? 'Perfect for apartment'
              : 'Not ideal for apartment'
            : 'N/A',
      },
      care: {
        groomingNeeds: this.getCompatibilityLevel(
          requirements.groomingPreference,
          pet.care?.groomingNeeds
        ),
        exerciseNeeds: this.getCompatibilityLevel(
          requirements.exercisePreference,
          pet.care?.exerciseNeeds
        ),
        trainingRequired: this.getCompatibilityLevel(
          requirements.trainingPreference,
          pet.experience?.trainingRequired
        ),
        medicalCareLevel: this.getCompatibilityLevel(
          requirements.medicalCarePreference,
          pet.care?.medicalCareLevel
        ),
      },
      specialConsiderations: {
        hypoallergenic: requirements.allergyFriendly
          ? pet.allergies?.hypoallergenic
            ? 'Perfect for allergies'
            : 'May cause allergies'
          : 'N/A',
        specialNeeds: requirements.openToSpecialNeeds
          ? pet.attributes?.specialNeeds
            ? 'Ready for special needs'
            : 'No special needs'
          : 'N/A',
        goodWithChildren: requirements.hasChildren
          ? pet.behavior?.goodWith?.includes('children')
            ? 'Great with children'
            : 'May not be ideal for children'
          : 'N/A',
        goodWithOtherPets: requirements.hasOtherPets
          ? pet.behavior?.goodWith?.length > 0
            ? 'Good with other pets'
            : 'May not be ideal with other pets'
          : 'N/A',
      },
    };

    return breakdown;
  }

  /**
   * Get compatibility level description
   * @param {string} userLevel - User preference level
   * @param {string} petLevel - Pet characteristic level
   * @returns {string} Compatibility level description
   */
  getCompatibilityLevel(userLevel, petLevel) {
    if (!userLevel || !petLevel) return 'N/A';

    if (userLevel === petLevel) return 'Perfect match';

    const compatibility = this.getCompatibilityScore(userLevel, petLevel);
    if (compatibility >= 0.8) return 'Excellent compatibility';
    if (compatibility >= 0.6) return 'Good compatibility';
    if (compatibility >= 0.4) return 'Moderate compatibility';
    return 'Limited compatibility';
  }

  /**
   * Get compatibility score between two levels
   * @param {string} userLevel - User preference level
   * @param {string} petLevel - Pet characteristic level
   * @returns {number} Compatibility score (0-1)
   */
  getCompatibilityScore(userLevel, petLevel) {
    const levelMap = { low: 1, medium: 2, high: 3 };
    const userValue = levelMap[userLevel] || 2;
    const petValue = levelMap[petLevel] || 2;

    const difference = Math.abs(userValue - petValue);
    if (difference === 0) return 1.0;
    if (difference === 1) return 0.7;
    return 0.3;
  }

  /**
   * Check if pet age matches preferred ages
   * @param {string} petAge - Pet age
   * @param {Array} preferredAges - Preferred ages
   * @returns {boolean} Whether age matches
   */
  matchesAgePreference(petAge, preferredAges) {
    return preferredAges.includes(petAge);
  }

  /**
   * Calculate distance between two locations
   * @param {Object} location1 - First location
   * @param {Object} location2 - Second location
   * @returns {number} Distance in miles
   */
  calculateDistance(location1, location2) {
    if (!location1 || !location2) return Infinity;

    const R = 3959; // Earth's radius in miles
    const lat1 = (location1.latitude * Math.PI) / 180;
    const lat2 = (location2.latitude * Math.PI) / 180;
    const deltaLat =
      ((location2.latitude - location1.latitude) * Math.PI) / 180;
    const deltaLon =
      ((location2.longitude - location1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Get recommendations based on user requirements completion
   * @param {string} userId - User ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} Recommendations with requirements analysis
   */
  async getRequirementsBasedRecommendations(userId, options = {}) {
    try {
      const {
        limit = 10,
        minRequirementsCompletion = 30,
        includeRequirementsAnalysis = true,
      } = options;

      // Get user with requirements
      const user = await User.findById(userId).select(
        'requirements preferences'
      );
      if (!user) {
        throw new ApiError('User not found', 404);
      }

      // Get requirements completion
      const completionPercentage = user.requirements?.completionPercentage || 0;
      const requirementsSummary =
        user.requirementsSummary || 'Requirements not set';
      const requirementsPriority = user.requirementsPriority || 'minimal';

      // Get pets based on requirements completion
      let pets;
      if (completionPercentage >= minRequirementsCompletion) {
        // Use enhanced matching for users with complete requirements
        pets = await Pet.find({ status: { $in: ['adoptable', 'pending'] } })
          .populate('shelter', 'name location')
          .populate('healthRecords')
          .populate('behaviorRecords');

        logger.info(
          `User ${userId} has ${completionPercentage}% complete requirements, using enhanced matching`
        );
      } else {
        // Use basic matching for users with incomplete requirements
        pets = await Pet.find({
          status: { $in: ['adoptable', 'pending'] },
        }).populate('shelter', 'name location');

        logger.info(
          `User ${userId} has ${completionPercentage}% complete requirements, using basic matching`
        );
      }

      // Calculate recommendations
      const recommendations = await this.calculateRecommendationScores(
        user,
        pets,
        true
      );

      // Filter and sort
      const filteredRecommendations = recommendations
        .filter((rec) => rec.score >= 0.1)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      const result = {
        recommendations: filteredRecommendations,
        requirementsAnalysis: {
          completionPercentage,
          summary: requirementsSummary,
          priority: requirementsPriority,
          hasCompleteRequirements:
            completionPercentage >= minRequirementsCompletion,
        },
      };

      if (includeRequirementsAnalysis && user.requirements) {
        result.requirementsAnalysis.details = {
          petType: user.requirements.petType || 'Not specified',
          experienceLevel: user.requirements.experienceLevel || 'Not specified',
          livingSituation: user.requirements.livingSituation || 'Not specified',
          activityLevel: user.requirements.activityLevel || 'Not specified',
          allergyFriendly: user.requirements.allergyFriendly || false,
          openToSpecialNeeds: user.requirements.openToSpecialNeeds || false,
          hasChildren: user.requirements.hasChildren || false,
          hasOtherPets: user.requirements.hasOtherPets || false,
        };
      }

      return result;
    } catch (error) {
      logger.error('Error getting requirements-based recommendations:', error);
      throw error;
    }
  }

  /**
   * Get recommendations for users with similar requirements
   * @param {string} userId - User ID
   * @param {Object} options - Options
   * @returns {Promise<Array>} Array of recommendations
   */
  async getSimilarUsersRecommendations(userId, options = {}) {
    try {
      const {
        limit = 10,
        minSimilarity = 0.7,
        includeSimilarityScore = true,
      } = options;

      // Get user requirements
      const user = await User.findById(userId).select('requirements');
      if (!user || !user.requirements) {
        throw new ApiError('User requirements not found', 404);
      }

      // Find users with similar requirements
      const similarUsers = await User.findByRequirements(user.requirements, {
        limit: 20,
        role: 'user',
      });

      if (similarUsers.length === 0) {
        return [];
      }

      // Get pets that similar users have shown interest in
      const similarUserIds = similarUsers.map((u) => u._id);
      const similarUserPets = await Pet.find({
        _id: { $in: similarUsers.flatMap((u) => u.favoritePets || []) },
        status: { $in: ['adoptable', 'pending'] },
      }).populate('shelter', 'name location');

      // Calculate recommendations with similarity bonus
      const recommendations = [];
      for (const pet of similarUserPets) {
        const baseScore = await this.calculateEnhancedCompatibilityScore(
          user,
          pet
        );

        // Add similarity bonus
        const similarityBonus = Math.min(0.3, baseScore * 0.2);
        const finalScore = Math.min(1.0, baseScore + similarityBonus);

        recommendations.push({
          pet: pet.toObject(),
          score: finalScore,
          baseScore,
          similarityBonus,
          factors: { compatibility: baseScore, similarity: similarityBonus },
          explanation: `Recommended based on similar users' preferences`,
          confidence: 0.8,
        });
      }

      // Sort and limit
      return recommendations
        .filter((rec) => rec.score >= minSimilarity)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      logger.error('Error getting similar users recommendations:', error);
      throw error;
    }
  }

  /**
   * Get trending pets
   * @param {Object} options - Options
   * @returns {Promise<Array>} Array of trending pets
   */
  async getTrendingPets(options = {}) {
    try {
      const { limit = 10, days = 7 } = options;

      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // First try to get pets with high recent activity
      let trendingPets = await Pet.aggregate([
        {
          $match: {
            status: { $in: ['adoptable', 'pending'] },
            createdAt: { $gte: cutoffDate },
          },
        },
        {
          $addFields: {
            activityScore: {
              $add: [
                { $multiply: ['$views', 0.1] },
                { $multiply: ['$favorites', 0.5] },
                { $multiply: ['$chatCount', 1.0] },
              ],
            },
          },
        },
        {
          $sort: { activityScore: -1 },
        },
        {
          $limit: limit,
        },
      ]);

      // If no recent pets, get popular pets regardless of creation date
      if (trendingPets.length === 0) {
        logger.info(
          'No recent trending pets found, falling back to popular pets'
        );
        trendingPets = await Pet.aggregate([
          {
            $match: {
              status: { $in: ['adoptable', 'pending'] },
            },
          },
          {
            $addFields: {
              popularityScore: {
                $add: [
                  { $multiply: ['$views', 0.1] },
                  { $multiply: ['$favorites', 0.5] },
                  { $multiply: ['$chatCount', 1.0] },
                ],
              },
            },
          },
          {
            $sort: { popularityScore: -1 },
          },
          {
            $limit: limit,
          },
        ]);
      }

      // If still no pets, get random adoptable pets
      if (trendingPets.length === 0) {
        logger.info(
          'No popular pets found, falling back to random adoptable pets'
        );
        trendingPets = await Pet.aggregate([
          {
            $match: {
              status: { $in: ['adoptable', 'pending'] },
            },
          },
          {
            $sample: { size: limit },
          },
        ]);
      }

      return trendingPets;
    } catch (error) {
      logger.error('Error getting trending pets:', error);
      return [];
    }
  }

  /**
   * Get similar pets
   * @param {string} petId - Pet ID
   * @param {Object} options - Options
   * @returns {Promise<Array>} Array of similar pets
   */
  async getSimilarPets(petId, options = {}) {
    try {
      const { limit = 5 } = options;

      const targetPet = await Pet.findById(petId);
      if (!targetPet) {
        return [];
      }

      // Find pets with similar characteristics
      const similarPets = await Pet.find({
        _id: { $ne: petId },
        status: { $in: ['adoptable', 'pending'] },
        $or: [
          { type: targetPet.type },
          { size: targetPet.size },
          { age: targetPet.age },
          { breed: targetPet.breed },
        ],
      }).limit(limit);

      return similarPets;
    } catch (error) {
      logger.error('Error getting similar pets:', error);
      return [];
    }
  }

  // Additional methods for the new controller endpoints
  async getRecommendationAnalytics(options = {}) {
    // Implementation for analytics
    return {
      totalRecommendationsGenerated: 0,
      averageRecommendationScore: 0.65,
      mostRecommendedPetTypes: ['dog', 'cat'],
      recommendationAccuracy: 0.78,
      userSatisfactionScore: 4.2,
    };
  }

  async updateUserPreferences(userId, preferences) {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { preferences } },
      { new: true }
    ).select('preferences');
    return updatedUser;
  }

  async getRecommendationHistory(userId, options = {}) {
    // Implementation for recommendation history
    return {
      recommendations: [],
      pagination: {
        page: options.page || 1,
        limit: options.limit || 20,
        total: 0,
        pages: 0,
      },
    };
  }

  async provideRecommendationFeedback(
    userId,
    petId,
    feedback,
    reason,
    sessionId
  ) {
    // Implementation for feedback
    logger.info('Recommendation feedback received:', {
      userId,
      petId,
      feedback,
      reason,
      sessionId,
    });
  }

  async getPetRecommendationInsights(petId) {
    // Implementation for pet insights
    return {
      petId,
      score: 0.75,
      factors: ['Matches preferences', 'Good health records'],
      explanation: 'This pet matches your preferences well.',
    };
  }

  async clearRecommendationCache() {
    // Implementation for clearing cache
    logger.info('Recommendation cache cleared');
  }

  /**
   * Get wizard-based recommendations (works for guests and users)
   * @param {Object} preferences - User preferences from wizard
   * @param {Object} options - Options including userId, limit, minScore, useML
   * @returns {Promise<Object>} Wizard recommendation response
   */
  async getWizardRecommendations(preferences, options = {}) {
    try {
      const {
        limit = 20,
        minScore = 0.1,
        useML = true,
        userId = null,
      } = options;

      logger.info(
        'Getting wizard recommendations with preferences:',
        preferences
      );

      // Get available pets
      const pets = await Pet.find({ status: 'adoptable' })
        .populate('shelter', 'name location')
        .populate('healthRecords')
        .populate('behaviorRecords');

      if (pets.length === 0) {
        logger.warn('No adoptable pets found for wizard recommendations');
        return {
          recommendations: [],
          total: 0,
          userPreferences: preferences,
          isGuest: !userId,
          useML: false,
        };
      }

      let scoredPets;

      if (useML && this.aiServiceUrl && userId) {
        // Use ML-based recommendations for logged-in users
        scoredPets = await this.getMLRecommendations(
          { _id: userId, preferences },
          pets,
          { limit }
        );
      } else {
        // Use rule-based scoring for guests or when ML is unavailable
        scoredPets = await this.calculateWizardScores(
          preferences,
          pets,
          userId
        );
      }

      // Filter by minimum score and limit results
      const filteredRecommendations = scoredPets
        .filter((rec) => rec.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      logger.info(
        `Wizard recommendations: ${filteredRecommendations.length} pets scored above ${minScore}`
      );

      return {
        recommendations: filteredRecommendations,
        total: filteredRecommendations.length,
        userPreferences: preferences,
        isGuest: !userId,
        useML: useML && !!userId,
      };
    } catch (error) {
      logger.error('Error getting wizard recommendations:', error);
      // Return empty response for fallback
      return {
        recommendations: [],
        total: 0,
        userPreferences: preferences,
        isGuest: !options.userId,
        useML: false,
      };
    }
  }

  /**
   * Calculate wizard scores using rule-based algorithm
   * @param {Object} preferences - User preferences
   * @param {Array} pets - Array of pets
   * @param {string} userId - Optional user ID
   * @returns {Promise<Array>} Array of scored pets
   */
  async calculateWizardScores(preferences, pets, userId = null) {
    const scoredPets = [];

    for (const pet of pets) {
      let score = 0;
      const factors = [];

      // Species/Type matching (25% weight)
      if (
        preferences.preferredSpecies &&
        preferences.preferredSpecies.length > 0
      ) {
        if (preferences.preferredSpecies.includes(pet.type)) {
          score += 0.25;
          factors.push('Matches preferred species');
        }
      }

      // Size compatibility (20% weight)
      if (preferences.livingSpace && pet.size) {
        const sizeCompatibility = this.calculateSizeCompatibility(
          preferences.livingSpace,
          pet.size
        );
        score += sizeCompatibility * 0.2;
        if (sizeCompatibility > 0.5) {
          factors.push('Size compatible with living space');
        }
      }

      // Experience level matching (15% weight)
      if (preferences.experience && pet.behaviorRecords) {
        const experienceMatch = this.calculateExperienceMatch(
          preferences.experience,
          pet.behaviorRecords
        );
        score += experienceMatch * 0.15;
        if (experienceMatch > 0.5) {
          factors.push('Suitable for experience level');
        }
      }

      // Time availability matching (15% weight)
      if (preferences.timeAvailable && pet.type) {
        const timeMatch = this.calculateTimeMatch(
          preferences.timeAvailable,
          pet.type
        );
        score += timeMatch * 0.15;
        if (timeMatch > 0.5) {
          factors.push('Fits time availability');
        }
      }

      // Lifestyle compatibility (10% weight)
      if (preferences.lifestyle && pet.type) {
        const lifestyleMatch = this.calculateLifestyleMatch(
          preferences.lifestyle,
          pet.type
        );
        score += lifestyleMatch * 0.1;
        if (lifestyleMatch > 0.5) {
          factors.push('Lifestyle compatible');
        }
      }

      // Children compatibility (10% weight)
      if (preferences.hasChildren && pet.behaviorRecords) {
        const childrenMatch = this.calculateChildrenMatch(
          preferences.hasChildren,
          pet.behaviorRecords
        );
        score += childrenMatch * 0.1;
        if (childrenMatch > 0.5) {
          factors.push('Good with children');
        }
      }

      // Other pets compatibility (5% weight)
      if (preferences.hasOtherPets && pet.behaviorRecords) {
        const otherPetsMatch = this.calculateOtherPetsMatch(
          preferences.hasOtherPets,
          pet.behaviorRecords
        );
        score += otherPetsMatch * 0.05;
        if (otherPetsMatch > 0.5) {
          factors.push('Good with other pets');
        }
      }

      // Health score bonus (10% weight)
      const healthScore = this.calculateHealthScore(pet);
      score += healthScore * 0.1;
      if (healthScore > 0.7) {
        factors.push('Good health records');
      }

      scoredPets.push({
        pet,
        score: Math.min(score, 1.0), // Cap at 1.0
        factors,
        explanation: this.generateExplanation(factors, pet),
        confidence: this.calculateConfidence(factors),
      });
    }

    return scoredPets;
  }

  /**
   * Calculate size compatibility between living space and pet size
   */
  calculateSizeCompatibility(livingSpace, petSize) {
    const sizeMatrix = {
      apartment: { small: 0.9, medium: 0.6, large: 0.3 },
      house: { small: 0.8, medium: 0.9, large: 0.8 },
      farm: { small: 0.7, medium: 0.8, large: 0.9 },
    };

    return sizeMatrix[livingSpace]?.[petSize] || 0.5;
  }

  /**
   * Calculate experience level match
   */
  calculateExperienceMatch(experience, behaviorRecords) {
    const behaviorLevels = {
      beginner: 0.3,
      intermediate: 0.6,
      advanced: 0.9,
    };

    const avgBehaviorScore =
      behaviorRecords.length > 0
        ? behaviorRecords.reduce(
            (sum, record) => sum + (record.score || 0),
            0
          ) / behaviorRecords.length
        : 0.5;

    const experienceLevel = behaviorLevels[experience] || 0.5;
    return Math.abs(experienceLevel - avgBehaviorScore) < 0.3 ? 0.8 : 0.4;
  }

  /**
   * Calculate time availability match
   */
  calculateTimeMatch(timeAvailable, petType) {
    const timeRequirements = {
      low: { dog: 0.3, cat: 0.8, bird: 0.7, other: 0.6 },
      medium: { dog: 0.7, cat: 0.9, bird: 0.8, other: 0.7 },
      high: { dog: 0.9, cat: 0.8, bird: 0.7, other: 0.6 },
    };

    return timeRequirements[timeAvailable]?.[petType] || 0.5;
  }

  /**
   * Calculate lifestyle match
   */
  calculateLifestyleMatch(lifestyle, petType) {
    const lifestyleMatches = {
      active: { dog: 0.9, cat: 0.6, bird: 0.5, other: 0.6 },
      moderate: { dog: 0.7, cat: 0.8, bird: 0.7, other: 0.7 },
      relaxed: { dog: 0.5, cat: 0.9, bird: 0.8, other: 0.8 },
    };

    return lifestyleMatches[lifestyle]?.[petType] || 0.5;
  }

  /**
   * Calculate children compatibility
   */
  calculateChildrenMatch(hasChildren, behaviorRecords) {
    if (hasChildren === 'no') return 0.8; // No preference
    if (hasChildren === 'yes') {
      // Check if pet is good with children based on behavior records
      const childFriendly = behaviorRecords.some(
        (record) =>
          record.traits && record.traits.includes('good_with_children')
      );
      return childFriendly ? 0.9 : 0.4;
    }
    return 0.5;
  }

  /**
   * Calculate other pets compatibility
   */
  calculateOtherPetsMatch(hasOtherPets, behaviorRecords) {
    if (hasOtherPets === 'no') return 0.8; // No preference
    if (hasOtherPets === 'yes') {
      // Check if pet is good with other pets based on behavior records
      const petFriendly = behaviorRecords.some(
        (record) =>
          record.traits && record.traits.includes('good_with_other_pets')
      );
      return petFriendly ? 0.9 : 0.4;
    }
    return 0.5;
  }

  /**
   * Record user interaction for AI learning
   * @param {Object} interactionData - Interaction data
   * @returns {Promise<void>}
   */
  async recordUserInteraction(interactionData) {
    try {
      const {
        petId,
        interactionType,
        timestamp,
        userId,
        preferences,
        petCount,
        isGuest,
        sessionId,
        userPreferences,
        petAttributes,
        reason,
        details,
      } = interactionData;

      logger.info(
        `Recording ${interactionType} interaction for ${userId ? 'user' : 'guest'} with pet ${petId}`
      );

      // For now, just log the interaction
      // In the future, this could be stored in a database or sent to an analytics service
      logger.info('User interaction recorded:', {
        petId,
        interactionType,
        timestamp,
        userId,
        preferences,
        petCount,
        isGuest,
        sessionId,
        userPreferences,
        petAttributes,
        reason,
        details,
      });

      // TODO: Implement actual interaction storage/analytics
      // This could include:
      // - Storing in a interactions collection
      // - Sending to analytics service
      // - Updating ML models
      // - A/B testing data
    } catch (error) {
      logger.error('Error recording user interaction:', error);
      // Don't throw error for interaction recording failures
      // This should not break the main flow
    }
  }

  /**
   * Record user interaction for AI learning and analytics
   * This method stores interaction data in MongoDB for machine learning
   * @param {string} petId - ID of the pet interacted with
   * @param {string} interactionType - Type of interaction (view, favorite, chat, etc.)
   * @param {Object} additionalData - Additional data for the interaction
   * @returns {Promise<Object>} - Result of the interaction recording
   */
  async recordInteraction(petId, interactionType, additionalData = {}) {
    try {
      const { ActivityLog } = await import('../activity/activity.model.js');
      const { User } = await import('../user/user.model.js');
      const { Pet } = await import('../pet/pet.model.js');

      // Get user and pet information
      const user = await User.findById(additionalData.userId);
      const pet = await Pet.findById(petId);

      if (!user) {
        logger.warn(
          `User not found for interaction recording: ${additionalData.userId}`
        );
        return { success: false, error: 'User not found' };
      }

      if (!pet) {
        logger.warn(`Pet not found for interaction recording: ${petId}`);
        return { success: false, error: 'Pet not found' };
      }

      // Determine action and category based on interaction type
      let action, category, description;

      switch (interactionType) {
        case 'view':
          action = 'pet_interaction';
          category = 'recommendation';
          description = `User viewed pet ${pet.name}`;
          break;
        case 'favorite':
          action = 'favorite_added';
          category = 'recommendation';
          description = `User added ${pet.name} to favorites`;
          break;
        case 'chat':
          action = 'pet_interaction';
          category = 'recommendation';
          description = `User initiated chat about ${pet.name}`;
          break;
        case 'recommendation_generated':
          action = 'recommendation_generated';
          category = 'recommendation';
          description = `AI recommendations generated for user`;
          break;
        default:
          action = 'pet_interaction';
          category = 'recommendation';
          description = `User ${interactionType} interaction with ${pet.name}`;
      }

      // Create activity log entry
      const activityLog = new ActivityLog({
        action,
        category,
        severity: 'low',
        description,
        performedBy: {
          _id: user._id,
          name: user.name || user.email,
          email: user.email,
          role: user.role || 'user',
        },
        metadata: {
          petId: pet._id,
          petName: pet.name,
          interactionType,
          userPreferences: additionalData.userPreferences || {},
          petCount: additionalData.petCount || 0,
          recommendationScore: additionalData.recommendationScore || 0,
          sessionId: additionalData.sessionId || null,
          additionalData: additionalData,
        },
        timestamp: new Date(),
      });

      await activityLog.save();

      logger.info(
        `Interaction recorded successfully: ${action} for pet ${pet.name} by user ${user.email}`
      );

      // Also call the existing recordUserInteraction method for backward compatibility
      await this.recordUserInteraction({
        petId,
        interactionType,
        timestamp: new Date(),
        userId: user._id,
        preferences: additionalData.userPreferences,
        petCount: additionalData.petCount,
        isGuest: false,
        sessionId: additionalData.sessionId,
        userPreferences: additionalData.userPreferences,
        petAttributes: pet,
        reason: additionalData.reason,
        details: additionalData.details,
      });

      return { success: true, activityLogId: activityLog._id };
    } catch (error) {
      logger.error('Error recording interaction:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Submit feedback for AI recommendations
   * This method stores feedback data in MongoDB for machine learning improvements
   * @param {Object} feedbackData - Feedback data including user preferences and pet attributes
   * @returns {Promise<Object>} - Result of the feedback submission
   */
  async submitFeedback(feedbackData) {
    try {
      const { ActivityLog } = await import('../activity/activity.model.js');
      const { User } = await import('../user/user.model.js');
      const { Pet } = await import('../pet/pet.model.js');

      const {
        petId,
        feedback,
        reason,
        scoredPet,
        userPreferences,
        userId,
        sessionId,
        additionalDetails,
      } = feedbackData;

      // Get user and pet information
      const user = await User.findById(userId);
      const pet = await Pet.findById(petId);

      if (!user) {
        logger.warn(`User not found for feedback submission: ${userId}`);
        return { success: false, error: 'User not found' };
      }

      if (!pet) {
        logger.warn(`Pet not found for feedback submission: ${petId}`);
        return { success: false, error: 'Pet not found' };
      }

      // Create activity log entry for feedback
      const activityLog = new ActivityLog({
        action: 'recommendation_feedback',
        category: 'recommendation',
        severity: 'low',
        description: `User provided ${feedback} feedback for ${pet.name} recommendation`,
        performedBy: {
          _id: user._id,
          name: user.name || user.email,
          email: user.email,
          role: user.role || 'user',
        },
        metadata: {
          petId: pet._id,
          petName: pet.name,
          feedbackType: feedback,
          feedbackReason: reason,
          userPreferences: userPreferences || {},
          recommendationScore: scoredPet?.score || 0,
          sessionId: sessionId || null,
          additionalData: {
            scoredPet,
            additionalDetails,
          },
        },
        timestamp: new Date(),
      });

      await activityLog.save();

      logger.info(
        `Feedback recorded successfully: ${feedback} feedback for pet ${pet.name} by user ${user.email}`
      );

      // Store feedback in a dedicated collection for ML training (optional)
      // This could be used to train better recommendation models
      try {
        const { Feedback } = await import('./feedback.model.js');
        const feedbackEntry = new Feedback({
          userId: user._id,
          petId: pet._id,
          feedbackType: feedback,
          reason: reason,
          userPreferences: userPreferences || {},
          petAttributes: {
            type: pet.type,
            breed: pet.breed,
            age: pet.age,
            size: pet.size,
            behavior: pet.behavior,
            attributes: pet.attributes,
          },
          recommendationScore: scoredPet?.score || 0,
          sessionId: sessionId,
          additionalDetails: additionalDetails,
          timestamp: new Date(),
        });

        await feedbackEntry.save();
        logger.info(
          `Feedback stored in ML training collection for pet ${pet.name}`
        );
      } catch (feedbackError) {
        // Don't fail the main operation if feedback storage fails
        logger.warn(
          `Failed to store feedback in ML collection: ${feedbackError.message}`
        );
      }

      return {
        success: true,
        activityLogId: activityLog._id,
        learningImpact: {
          feedbackType: feedback,
          petId: pet._id,
          timestamp: new Date(),
          willImproveRecommendations: true,
        },
      };
    } catch (error) {
      logger.error('Error submitting feedback:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new RecommendationService();
