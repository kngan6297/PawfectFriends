import { ApiError } from '../../utils/errors.js';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from '../../utils/cloudinary.js';
import logger from '../../utils/logger.js';
import { User } from '../user/user.model.js';
import { Pet } from './pet.model.js';
import { AdoptionRequest } from '../adoption/adoption.model.js';
import {
  sanitizePetObject,
  sanitizePetUpdateData,
} from '../../utils/petSanitizer.js';
import {
  isShelter,
  getShelterData,
  validatePetShelterRelationship,
} from '../../utils/shelterUtils.js';
import { PetQueryBuilder, quickPetSearch } from '../../utils/queryBuilder.js';

/**
 * Validates status changes based on user role
 *
 * Role-based status permissions:
 * - Admin: Can set any status including 'flagged' and 'rejected'
 * - Shelter: Can set most statuses except admin-only ones
 * - User: Limited status changes (typically none for pet management)
 *
 * @param {string} newStatus - The new status to set
 * @param {string} userRole - The role of the user making the change
 * @throws {ApiError} - If status change is not allowed for the user role
 *
 * @example
 * validateStatusChange('flagged', 'admin') // ✅ Allowed
 * validateStatusChange('flagged', 'shelter') // ❌ Throws error
 * validateStatusChange('hidden', 'shelter') // ✅ Allowed
 * validateStatusChange('hidden', 'user') // ❌ Throws error
 */
const validateStatusChange = async (newStatus, userRole) => {
  // Admin-only statuses that require special permissions
  const adminOnlyStatuses = ['flagged', 'rejected'];

  if (adminOnlyStatuses.includes(newStatus) && userRole !== 'admin') {
    throw new ApiError(
      `Status '${newStatus}' can only be set by administrators`,
      403
    );
  }

  // Additional role-based restrictions can be added here
  const shelterOnlyStatuses = ['hidden', 'in_treatment'];
  if (
    shelterOnlyStatuses.includes(newStatus) &&
    !['shelter', 'admin'].includes(userRole)
  ) {
    throw new ApiError(
      `Status '${newStatus}' can only be set by shelter staff or administrators`,
      403
    );
  }
};

// Transform function to map _id to id
const transformPet = (pet) => {
  if (!pet) return null;
  const petObj = pet.toObject ? pet.toObject() : pet;

  // Transform photos to include size variants for frontend compatibility
  let transformedPhotos = petObj.photos || [];
  if (Array.isArray(transformedPhotos)) {
    transformedPhotos = transformedPhotos.map((photo) => {
      if (typeof photo === 'string') {
        // Handle legacy string format
        return {
          url: photo,
          small: photo,
          medium: photo,
          large: photo,
          full: photo,
        };
      } else if (photo && photo.url) {
        // Handle old object format with only url
        if (!photo.small && !photo.medium && !photo.large && !photo.full) {
          return {
            ...photo,
            small: photo.url,
            medium: photo.url,
            large: photo.url,
            full: photo.url,
          };
        }
      }
      return photo;
    });
  }

  return {
    ...petObj,
    id: petObj._id,
    _id: undefined,
    photos: transformedPhotos,
    // Create breeds object for frontend compatibility
    breeds: {
      primary: petObj.breed || 'Unknown Breed',
      secondary: null,
      mixed: false,
      unknown: false,
    },
  };
};

export const createPet = async (shelterId, petData) => {
  try {
    // Validate that shelterId is actually a shelter
    const isValidShelter = await isShelter(shelterId);
    if (!isValidShelter) {
      throw new ApiError(
        'Invalid shelter ID. Must reference a valid shelter user.',
        400
      );
    }

    // Get shelter data for validation
    const shelterData = await getShelterData(shelterId);
    if (!shelterData) {
      throw new ApiError('Shelter not found or invalid', 404);
    }

    // Sanitize pet data before creating to ensure only valid fields are included
    const sanitizedPetData = sanitizePetObject(petData);

    // Convert age to appropriate type for validation
    if (sanitizedPetData.age) {
      const ageValue = sanitizedPetData.age;

      // If age is a string that represents a number, convert it to number
      if (
        typeof ageValue === 'string' &&
        !isNaN(ageValue) &&
        ageValue.trim() !== ''
      ) {
        const numericAge = parseInt(ageValue, 10);
        if (numericAge >= 0 && numericAge <= 30) {
          sanitizedPetData.age = numericAge;
        }
      }
      // If age is a string that matches the allowed string values, keep it as is
      else if (
        typeof ageValue === 'string' &&
        ['baby', 'young', 'adult', 'senior'].includes(ageValue.toLowerCase())
      ) {
        sanitizedPetData.age = ageValue.toLowerCase();
      }
    }

    // Handle photo uploads - check if photos are already processed
    let photoUrls = [];
    if (petData.photos && petData.photos.length > 0) {
      // Check if photos are already processed (have url property)
      if (petData.photos[0] && petData.photos[0].url) {
        // Photos are already processed by fileUploadService
        photoUrls = petData.photos.map((photo) => ({
          _id: photo.id || photo._id,
          url: photo.url,
          small: photo.url, // Use same URL for all sizes for now
          medium: photo.url,
          large: photo.url,
          full: photo.url,
          caption: photo.caption || null,
        }));
      } else {
        // Photos are raw file objects, process them
        const validPhotos = petData.photos.filter(
          (photo) => photo && photo.size > 0
        );
        if (validPhotos.length > 0) {
          // Upload each photo individually to get size variants
          const uploadPromises = validPhotos.map(async (photo) => {
            const result = await uploadToCloudinary(photo, { folder: 'pets' });
            return {
              _id: result.public_id,
              url: result.url,
              small: result.small,
              medium: result.medium,
              large: result.large,
              full: result.full,
              caption: photo.caption || null,
            };
          });
          photoUrls = await Promise.all(uploadPromises);
        }
      }
    }

    // Only include photos if we have uploaded URLs
    let finalPetData = {
      ...sanitizedPetData,
      shelter: shelterId,
    };

    // Remove the original photos field to avoid validation issues
    delete finalPetData.photos;

    // Generate a unique externalId for manually created pets if not provided
    if (!finalPetData.metadata || !finalPetData.metadata.externalId) {
      if (!finalPetData.metadata) {
        finalPetData.metadata = {};
      }
      finalPetData.metadata.externalId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Ensure slug is generated if not provided
    if (!finalPetData.slug && finalPetData.name) {
      const { generateUniqueSlug } = await import(
        '../../utils/slugGenerator.js'
      );
      finalPetData.slug = await generateUniqueSlug(finalPetData.name, {
        modelName: 'Pet',
        strategy: 'counter',
      });
    }

    if (photoUrls.length > 0) {
      finalPetData.photos = photoUrls;
    } else {
      // Set empty array if no photos to satisfy schema requirements
      finalPetData.photos = [];
    }

    const pet = await Pet.create(finalPetData);
    return transformPet(pet);
  } catch (error) {
    logger.error('Error creating pet:', error);
    throw error;
  }
};

export const getPets = async (query = {}, options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = { createdAt: -1 },
      populate = true,
    } = options;

    const filter = {};
    const skip = (page - 1) * limit;

    // Build filter query
    if (query.type && query.type !== 'all') {
      filter.type = query.type;
    }
    if (query.breed) {
      filter.breed = { $regex: query.breed, $options: 'i' };
    }
    if (query.size && query.size !== 'all') filter.size = query.size;
    if (query.status) filter.status = query.status;
    if (query.gender && query.gender !== 'all') filter.gender = query.gender;
    if (query.age && query.age !== 'all') filter.age = query.age;

    // Location-based search
    if (query.location) {
      filter['contact.address.city'] = {
        $regex: query.location,
        $options: 'i',
      };
    }

    // Text search
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { breed: { $regex: query.search, $options: 'i' } },
      ];
    }

    logger.debug('Final filter:', filter);
    const total = await Pet.countDocuments(filter);
    const pets = await Pet.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate(populate ? 'shelter' : '');
    logger.info('Found pets:', pets.length);

    return {
      pets: pets.map(transformPet),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting pets:', error);
    throw error;
  }
};

export const getPetById = async (petId, userId = null) => {
  try {
    // Validate that petId is a valid ObjectId
    const mongoose = await import('mongoose');
    if (!mongoose.Types.ObjectId.isValid(petId)) {
      throw new ApiError('Invalid pet ID format', 400);
    }

    const pet = await Pet.findById(petId).populate('shelter');
    if (!pet) {
      throw new ApiError('Pet not found', 404);
    }

    // Increment views without triggering validation
    await Pet.findByIdAndUpdate(
      petId,
      { $inc: { views: 1 } },
      { new: false, runValidators: false }
    );

    // Set default value for isFavorite
    pet.isFavorite = false;

    // If userId is provided, check if the pet is in user's favorites
    if (userId) {
      const userProfile = await User.findById(userId);
      if (
        userProfile &&
        userProfile.favoritePets &&
        Array.isArray(userProfile.favoritePets)
      ) {
        pet.isFavorite = userProfile.favoritePets.includes(petId);
      }
    }

    return transformPet(pet);
  } catch (error) {
    logger.error('Error getting pet by ID:', error);
    throw error;
  }
};

export const updatePet = async (
  petId,
  shelterId,
  updateData,
  editorId,
  editorRole = 'shelter'
) => {
  try {
    // Validate that petId is a valid ObjectId
    const mongoose = await import('mongoose');
    if (!mongoose.Types.ObjectId.isValid(petId)) {
      throw new ApiError('Invalid pet ID format', 400);
    }

    // Validate pet-shelter relationship
    const validation = await validatePetShelterRelationship(petId, shelterId);
    if (!validation.valid) {
      throw new ApiError(validation.error, 403);
    }

    // Sanitize update data before updating to ensure only valid fields are included
    const sanitizedUpdateData = sanitizePetUpdateData(updateData);

    // Convert age to appropriate type for validation
    if (sanitizedUpdateData.age !== undefined) {
      const ageValue = sanitizedUpdateData.age;

      // If age is a string that represents a number, convert it to number
      if (
        typeof ageValue === 'string' &&
        !isNaN(ageValue) &&
        ageValue.trim() !== ''
      ) {
        const numericAge = parseInt(ageValue, 10);
        if (numericAge >= 0 && numericAge <= 30) {
          sanitizedUpdateData.age = numericAge;
        }
      }
      // If age is a string that matches the allowed string values, keep it as is
      else if (
        typeof ageValue === 'string' &&
        ['baby', 'young', 'adult', 'senior'].includes(ageValue.toLowerCase())
      ) {
        sanitizedUpdateData.age = ageValue.toLowerCase();
      }
      // If age is empty string, remove it from the update data
      else if (ageValue === '') {
        delete sanitizedUpdateData.age;
      }
    }

    // Validate status changes based on role
    if (sanitizedUpdateData.status) {
      await validateStatusChange(sanitizedUpdateData.status, editorRole);
    }

    // Create edit log entry with role information
    const editLogEntry = {
      date: new Date(),
      editor: editorId,
      editorRole: editorRole,
      changes: sanitizedUpdateData,
      reason: updateData.reason || null,
    };

    const pet = await Pet.findOneAndUpdate(
      { _id: petId, shelter: shelterId },
      {
        $set: sanitizedUpdateData,
        $push: { editLogs: editLogEntry },
      },
      { new: true, runValidators: true }
    );

    if (!pet) {
      throw new ApiError('Pet not found or unauthorized', 403);
    }

    return transformPet(pet);
  } catch (error) {
    logger.error('Error updating pet:', error);
    throw error;
  }
};

export const deletePet = async (petId, shelterId) => {
  try {
    // Validate that petId is a valid ObjectId
    const mongoose = await import('mongoose');
    if (!mongoose.Types.ObjectId.isValid(petId)) {
      throw new ApiError('Invalid pet ID format', 400);
    }

    // First, find the pet to get its data
    const pet = await Pet.findOne({
      _id: petId,
      shelter: shelterId,
    });

    if (!pet) {
      throw new ApiError('Pet not found or unauthorized', 403);
    }

    // Clean up related data in a transaction
    const session = await Pet.startSession();
    await session.withTransaction(async () => {
      // 1. Delete all adoption requests for this pet
      await AdoptionRequest.deleteMany({ pet: petId });

      // 2. Remove pet from all users' favoritePets arrays
      await User.updateMany(
        { favoritePets: petId },
        { $pull: { favoritePets: petId } }
      );

      // 3. Remove pet from all users' viewedPets arrays
      await User.updateMany(
        { viewedPets: petId },
        { $pull: { viewedPets: petId } }
      );

      // 4. Delete pet images from Cloudinary if they exist
      if (pet.photos && pet.photos.length > 0) {
        for (const photo of pet.photos) {
          if (photo.public_id) {
            try {
              await deleteFromCloudinary(photo.public_id);
            } catch (cloudinaryError) {
              logger.warn(
                `Failed to delete image from Cloudinary: ${cloudinaryError.message}`
              );
            }
          }
        }
      }

      // 5. Finally, delete the pet
      await Pet.findByIdAndDelete(petId);
    });

    await session.endSession();

    return transformPet(pet);
  } catch (error) {
    logger.error('Error deleting pet:', error);
    throw error;
  }
};

export const searchPets = async (searchQuery) => {
  try {
    const pets = await Pet.find(
      {
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
          { breed: { $regex: searchQuery, $options: 'i' } },
        ],
      },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .populate('shelter');

    return pets.map(transformPet);
  } catch (error) {
    logger.error('Error searching pets:', error);
    throw error;
  }
};

export const getSimilarPets = async (petId) => {
  try {
    // Validate that petId is a valid ObjectId
    const mongoose = await import('mongoose');
    if (!mongoose.Types.ObjectId.isValid(petId)) {
      throw new ApiError('Invalid pet ID format', 400);
    }

    const pet = await Pet.findById(petId);
    if (!pet) {
      throw new ApiError('Pet not found', 404);
    }

    const similarPets = await Pet.find({
      _id: { $ne: petId },
      type: pet.type,
      breed: pet.breed,
      status: 'adoptable',
    })
      .limit(6)
      .populate('shelter');

    return similarPets.map(transformPet);
  } catch (error) {
    logger.error('Error getting similar pets:', error);
    throw error;
  }
};

export const updatePhotos = async (petId, shelterId, photos) => {
  try {
    // Validate that petId is a valid ObjectId
    const mongoose = await import('mongoose');
    if (!mongoose.Types.ObjectId.isValid(petId)) {
      throw new ApiError('Invalid pet ID format', 400);
    }

    // Upload new photos to Cloudinary with size variants
    const uploadPromises = photos.map(async (photo) => {
      const result = await uploadToCloudinary(photo, { folder: 'pets' });
      return {
        _id: result.public_id,
        url: result.url,
        small: result.small,
        medium: result.medium,
        large: result.large,
        full: result.full,
        caption: photo.caption || null,
      };
    });
    const photoUrls = await Promise.all(uploadPromises);

    const pet = await Pet.findOneAndUpdate(
      { _id: petId, shelter: shelterId },
      { $set: { photos: photoUrls } },
      { new: true }
    );

    if (!pet) {
      throw new ApiError('Pet not found or unauthorized', 403);
    }

    return transformPet(pet);
  } catch (error) {
    logger.error('Error updating pet photos:', error);
    throw error;
  }
};

export const updateStatus = async (
  petId,
  shelterId,
  status,
  editorId,
  editorRole = 'shelter',
  reason = null
) => {
  try {
    // Validate that petId is a valid ObjectId
    const mongoose = await import('mongoose');
    if (!mongoose.Types.ObjectId.isValid(petId)) {
      throw new ApiError('Invalid pet ID format', 400);
    }

    // Validate status change based on role
    await validateStatusChange(status, editorRole);

    // Create edit log entry with role information
    const editLogEntry = {
      date: new Date(),
      editor: editorId,
      editorRole: editorRole,
      changes: { status },
      reason: reason,
    };

    const pet = await Pet.findOneAndUpdate(
      { _id: petId, shelter: shelterId },
      {
        $set: { status },
        $push: { editLogs: editLogEntry },
      },
      { new: true, runValidators: true }
    );

    if (!pet) {
      throw new ApiError('Pet not found or unauthorized', 403);
    }

    return transformPet(pet);
  } catch (error) {
    logger.error('Error updating pet status:', error);
    throw error;
  }
};

export const getShelterPets = async (shelterId, options = {}) => {
  try {
    // Ensure shelterId is an ObjectId
    const mongoose = await import('mongoose');
    const objectIdShelterId = mongoose.Types.ObjectId.isValid(shelterId)
      ? new mongoose.Types.ObjectId(shelterId)
      : shelterId;

    const { page = 1, limit = 100, filters = {} } = options;

    // Build filter object
    const filter = { shelter: objectIdShelterId };

    // Add filters from query parameters
    if (filters.status) {
      filter.status = filters.status;
    }
    if (filters.type) {
      filter.type = filters.type;
    }
    if (filters.age) {
      filter.age = filters.age;
    }
    if (filters.size) {
      filter.size = filters.size;
    }
    if (filters.gender) {
      filter.gender = filters.gender;
    }
    if (filters.search) {
      filter.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { breed: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = Pet.find(filter).populate('shelter');

    // Apply sorting
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    query = query.sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 });

    // Apply pagination
    query = query.skip(skip).limit(parseInt(limit));

    const pets = await query.exec();
    return pets.map(transformPet);
  } catch (error) {
    logger.error('Error getting shelter pets:', error);
    throw error;
  }
};

export const getLatestPets = async (limit = 6) => {
  try {
    const pets = await Pet.find({ status: 'adoptable' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('shelter');

    return pets.map(transformPet);
  } catch (error) {
    logger.error('Error getting latest pets:', error);
    throw error;
  }
};

export const addHealthRecord = async (petId, recordData, user) => {
  try {
    // Validate that petId is a valid ObjectId
    const mongoose = await import('mongoose');
    if (!mongoose.Types.ObjectId.isValid(petId)) {
      throw new ApiError('Invalid pet ID format', 400);
    }

    const pet = await Pet.findById(petId);
    if (!pet) {
      throw new ApiError('Pet not found', 404);
    }

    // Verify ownership
    if (pet.shelter.toString() !== user.shelter.toString()) {
      throw new ApiError('Not authorized to add health records', 403);
    }

    // Sanitize record data before adding to ensure only valid fields are included
    const sanitizedRecordData = sanitizePetObject(recordData);

    pet.healthRecords.push({
      ...sanitizedRecordData,
      recordedBy: user._id,
    });

    await pet.save();
    return pet;
  } catch (error) {
    logger.error('Error adding health record:', error);
    throw error;
  }
};

export const addBehaviorRecord = async (petId, recordData, user) => {
  try {
    // Validate that petId is a valid ObjectId
    const mongoose = await import('mongoose');
    if (!mongoose.Types.ObjectId.isValid(petId)) {
      throw new ApiError('Invalid pet ID format', 400);
    }

    const pet = await Pet.findById(petId);
    if (!pet) {
      throw new ApiError('Pet not found', 404);
    }

    // Verify ownership
    if (pet.shelter.toString() !== user.shelter.toString()) {
      throw new ApiError('Not authorized to add behavior records', 403);
    }

    // Sanitize record data before adding to ensure only valid fields are included
    const sanitizedRecordData = sanitizePetObject(recordData);

    pet.behaviorRecords.push({
      ...sanitizedRecordData,
      recordedBy: user._id,
    });

    await pet.save();
    return pet;
  } catch (error) {
    logger.error('Error adding behavior record:', error);
    throw error;
  }
};

export const uploadPetImages = async (petId, files, user) => {
  try {
    // Validate that petId is a valid ObjectId
    const mongoose = await import('mongoose');
    if (!mongoose.Types.ObjectId.isValid(petId)) {
      throw new ApiError('Invalid pet ID format', 400);
    }

    const pet = await Pet.findById(petId);
    if (!pet) {
      throw new ApiError('Pet not found', 404);
    }

    // Verify ownership
    if (pet.shelter.toString() !== user.shelter.toString()) {
      throw new ApiError('Not authorized to upload images', 403);
    }

    // Upload each file individually to get size variants
    const uploadPromises = files.map(async (file) => {
      const result = await uploadToCloudinary(file, { folder: 'pets' });
      return {
        _id: result.public_id,
        url: result.url,
        small: result.small,
        medium: result.medium,
        large: result.large,
        full: result.full,
        caption: null,
      };
    });
    const uploadResults = await Promise.all(uploadPromises);

    // Add new images to pet's photos array
    pet.photos.push(...uploadResults);

    // Sanitize pet data before saving to ensure only valid fields are included
    const sanitizedPetData = sanitizePetObject(pet.toObject());
    Object.assign(pet, sanitizedPetData);

    await pet.save();
    return pet;
  } catch (error) {
    logger.error('Error uploading pet images:', error);
    throw error;
  }
};

export const deletePetImage = async (petId, imageId, user) => {
  try {
    // Validate that petId is a valid ObjectId
    const mongoose = await import('mongoose');
    if (!mongoose.Types.ObjectId.isValid(petId)) {
      throw new ApiError('Invalid pet ID format', 400);
    }

    const pet = await Pet.findById(petId);
    if (!pet) {
      throw new ApiError('Pet not found', 404);
    }

    // Verify ownership
    if (pet.shelter.toString() !== user.shelter.toString()) {
      throw new ApiError('Not authorized to delete images', 403);
    }

    const image = pet.images.id(imageId);
    if (!image) {
      throw new ApiError('Image not found', 404);
    }

    // Delete from cloudinary
    await deleteFromCloudinary(image.publicId);

    // Remove from pet's images array
    pet.images.pull(imageId);

    // Sanitize pet data before saving to ensure only valid fields are included
    const sanitizedPetData = sanitizePetObject(pet.toObject());
    Object.assign(pet, sanitizedPetData);

    await pet.save();
    return pet;
  } catch (error) {
    logger.error('Error deleting pet image:', error);
    throw error;
  }
};

export const setPrimaryImage = async (petId, imageId, user) => {
  try {
    // Validate that petId is a valid ObjectId
    const mongoose = await import('mongoose');
    if (!mongoose.Types.ObjectId.isValid(petId)) {
      throw new ApiError('Invalid pet ID format', 400);
    }

    const pet = await Pet.findById(petId);
    if (!pet) {
      throw new ApiError('Pet not found', 404);
    }

    // Verify ownership
    if (pet.shelter.toString() !== user.shelter.toString()) {
      throw new ApiError('Not authorized to set primary image', 403);
    }

    const image = pet.images.id(imageId);
    if (!image) {
      throw new ApiError('Image not found', 404);
    }

    // Set as primary image
    pet.primaryImage = image.url;

    // Sanitize pet data before saving to ensure only valid fields are included
    const sanitizedPetData = sanitizePetObject(pet.toObject());
    Object.assign(pet, sanitizedPetData);

    await pet.save();
    return pet;
  } catch (error) {
    logger.error('Error setting primary image:', error);
    throw error;
  }
};

export const getShelterStats = async (shelterId) => {
  // Ensure shelterId is an ObjectId
  const mongoose = await import('mongoose');
  const objectIdShelterId = mongoose.Types.ObjectId.isValid(shelterId)
    ? new mongoose.Types.ObjectId(shelterId)
    : shelterId;

  const stats = await Pet.aggregate([
    { $match: { shelter: objectIdShelterId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  return stats.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});
};

export const getShelterAdoptionRequests = async (shelterId) => {
  try {
    const adoptionRequests = await AdoptionRequest.find({
      pet: { $in: await Pet.find({ shelter: shelterId }).select('_id') },
    })
      .populate('pet', 'name photos')
      .populate('adopter', 'name email')
      .sort({ createdAt: -1 });

    return adoptionRequests;
  } catch (error) {
    logger.error('Error getting shelter adoption requests:', error);
    throw error;
  }
};

export const getPetEditLogs = async (petId) => {
  try {
    // Validate that petId is a valid ObjectId
    const mongoose = await import('mongoose');
    if (!mongoose.Types.ObjectId.isValid(petId)) {
      throw new ApiError('Invalid pet ID format', 400);
    }

    const pet = await Pet.findById(petId).populate(
      'editLogs.editor',
      'name email role'
    );
    if (!pet) {
      throw new ApiError('Pet not found', 404);
    }

    // Transform edit logs to include editor information
    const editLogs = pet.editLogs.map((log) => ({
      id: log._id,
      date: log.date,
      editor: {
        id: log.editor._id,
        name: log.editor.name,
        email: log.editor.email,
        role: log.editorRole || log.editor.role, // Use stored role or fallback to user role
      },
      changes: log.changes,
      reason: log.reason,
    }));

    return {
      petId: pet._id,
      petName: pet.name,
      editLogs: editLogs.sort((a, b) => new Date(b.date) - new Date(a.date)), // Sort by date descending
    };
  } catch (error) {
    logger.error('Error getting pet edit logs:', error);
    throw error;
  }
};

export const addComplaint = async (petId, complaintData, reporterId) => {
  try {
    // Validate that petId is a valid ObjectId
    const mongoose = await import('mongoose');
    if (!mongoose.Types.ObjectId.isValid(petId)) {
      throw new ApiError('Invalid pet ID format', 400);
    }

    const pet = await Pet.findById(petId).populate('shelter', 'name email');
    if (!pet) {
      throw new ApiError('Pet not found', 404);
    }

    // Create complaint entry
    const complaint = {
      date: new Date(),
      reporter: reporterId,
      reason: complaintData.reason,
      description: complaintData.description,
      status: 'pending',
    };

    // Get current complaint count
    const currentComplaints = pet.complaints || [];
    const newComplaints = [...currentComplaints, complaint];

    // Check if we should auto-flag the pet (threshold: 5 complaints)
    const COMPLAINT_THRESHOLD = 5;
    const shouldAutoFlag = newComplaints.length >= COMPLAINT_THRESHOLD;

    // Prepare update data
    const updateData = {
      $push: { complaints: complaint },
    };

    // Auto-flag if threshold reached and not already flagged
    if (shouldAutoFlag && pet.status !== 'flagged') {
      updateData.$set = { status: 'flagged' };
    }

    // Add complaint and potentially update status
    const updatedPet = await Pet.findByIdAndUpdate(petId, updateData, {
      new: true,
    })
      .populate('complaints.reporter', 'name email')
      .populate('shelter', 'name email');

    // Send notifications
    await sendComplaintNotifications(
      updatedPet,
      complaint,
      reporterId,
      shouldAutoFlag
    );

    return transformPet(updatedPet);
  } catch (error) {
    logger.error('Error adding complaint:', error);
    throw error;
  }
};

export const getPetComplaints = async (petId) => {
  try {
    // Validate that petId is a valid ObjectId
    const mongoose = await import('mongoose');
    if (!mongoose.Types.ObjectId.isValid(petId)) {
      throw new ApiError('Invalid pet ID format', 400);
    }

    const pet = await Pet.findById(petId)
      .populate('complaints.reporter', 'name email')
      .populate('complaints.resolvedBy', 'name email')
      .select('complaints');

    if (!pet) {
      throw new ApiError('Pet not found', 404);
    }

    return pet.complaints || [];
  } catch (error) {
    logger.error('Error getting pet complaints:', error);
    throw error;
  }
};

export const updateComplaintStatus = async (
  petId,
  complaintId,
  status,
  adminId,
  adminNotes = ''
) => {
  try {
    // Validate that petId is a valid ObjectId
    const mongoose = await import('mongoose');
    if (!mongoose.Types.ObjectId.isValid(petId)) {
      throw new ApiError('Invalid pet ID format', 400);
    }

    const updateData = {
      'complaints.$.status': status,
      'complaints.$.adminNotes': adminNotes,
    };

    if (status === 'resolved' || status === 'dismissed') {
      updateData['complaints.$.resolvedBy'] = adminId;
      updateData['complaints.$.resolvedAt'] = new Date();
    }

    const pet = await Pet.findOneAndUpdate(
      {
        _id: petId,
        'complaints._id': complaintId,
      },
      { $set: updateData },
      { new: true }
    )
      .populate('complaints.reporter', 'name email')
      .populate('complaints.resolvedBy', 'name email')
      .populate('shelter', 'name email');

    if (!pet) {
      throw new ApiError('Pet or complaint not found', 404);
    }

    // Find the specific complaint that was updated
    const updatedComplaint = pet.complaints.find(
      (c) => c._id.toString() === complaintId
    );

    // Check if all complaints are resolved and update pet status if needed
    const hasPendingComplaints = pet.complaints.some(
      (complaint) =>
        complaint.status === 'pending' || complaint.status === 'investigating'
    );

    let statusChanged = false;
    if (!hasPendingComplaints && pet.status === 'flagged') {
      await Pet.findByIdAndUpdate(petId, { status: 'adoptable' });
      statusChanged = true;
    }

    // Send notifications for complaint status update
    await sendComplaintStatusUpdateNotifications(
      pet,
      updatedComplaint,
      adminId,
      status,
      statusChanged
    );

    return transformPet(pet);
  } catch (error) {
    logger.error('Error updating complaint status:', error);
    throw error;
  }
};

export const getFlaggedPets = async (filters = {}) => {
  try {
    const query = { status: 'flagged', ...filters };

    const pets = await Pet.find(query)
      .populate('shelter', 'name email')
      .populate('complaints.reporter', 'name email')
      .sort({ 'complaints.date': -1 });

    return pets.map(transformPet);
  } catch (error) {
    logger.error('Error getting flagged pets:', error);
    throw error;
  }
};

/**
 * Get complaint statistics for admin dashboard
 */
export const getComplaintStats = async () => {
  try {
    const stats = await Pet.aggregate([
      {
        $facet: {
          totalComplaints: [{ $unwind: '$complaints' }, { $count: 'count' }],
          pendingComplaints: [
            { $unwind: '$complaints' },
            { $match: { 'complaints.status': 'pending' } },
            { $count: 'count' },
          ],
          investigatingComplaints: [
            { $unwind: '$complaints' },
            { $match: { 'complaints.status': 'investigating' } },
            { $count: 'count' },
          ],
          resolvedComplaints: [
            { $unwind: '$complaints' },
            { $match: { 'complaints.status': 'resolved' } },
            { $count: 'count' },
          ],
          dismissedComplaints: [
            { $unwind: '$complaints' },
            { $match: { 'complaints.status': 'dismissed' } },
            { $count: 'count' },
          ],
          flaggedPets: [{ $match: { status: 'flagged' } }, { $count: 'count' }],
          petsWithComplaints: [
            { $match: { 'complaints.0': { $exists: true } } },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const result = stats[0];
    return {
      totalComplaints: result.totalComplaints[0]?.count || 0,
      pendingComplaints: result.pendingComplaints[0]?.count || 0,
      investigatingComplaints: result.investigatingComplaints[0]?.count || 0,
      resolvedComplaints: result.resolvedComplaints[0]?.count || 0,
      dismissedComplaints: result.dismissedComplaints[0]?.count || 0,
      flaggedPets: result.flaggedPets[0]?.count || 0,
      petsWithComplaints: result.petsWithComplaints[0]?.count || 0,
    };
  } catch (error) {
    logger.error('Error getting complaint stats:', error);
    throw error;
  }
};

/**
 * Get pets with high complaint counts (approaching threshold)
 */
export const getPetsWithHighComplaints = async (threshold = 3) => {
  try {
    const pets = await Pet.aggregate([
      {
        $addFields: {
          complaintCount: { $size: { $ifNull: ['$complaints', []] } },
        },
      },
      {
        $match: {
          complaintCount: { $gte: threshold },
          status: { $ne: 'flagged' }, // Only pets not already flagged
        },
      },
      {
        $sort: { complaintCount: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    return pets.map(transformPet);
  } catch (error) {
    logger.error('Error getting pets with high complaints:', error);
    throw error;
  }
};

export const getPetBySlug = async (slug, userId = null) => {
  try {
    if (!slug || typeof slug !== 'string') {
      throw new ApiError('Invalid slug format', 400);
    }

    const pet = await Pet.findBySlug(slug);
    if (!pet) {
      throw new ApiError('Pet not found', 404);
    }

    // Increment views without triggering validation
    await Pet.findByIdAndUpdate(
      pet._id,
      { $inc: { views: 1 } },
      { new: false, runValidators: false }
    );

    // Set default value for isFavorite
    pet.isFavorite = false;

    // If userId is provided, check if the pet is in user's favorites
    if (userId) {
      const userProfile = await User.findById(userId);
      if (
        userProfile &&
        userProfile.favoritePets &&
        Array.isArray(userProfile.favoritePets)
      ) {
        pet.isFavorite = userProfile.favoritePets.includes(pet._id.toString());
      }
    }

    return transformPet(pet);
  } catch (error) {
    logger.error('Error getting pet by slug:', error);
    throw error;
  }
};

export const searchPetsAdvanced = async (searchCriteria, options = {}) => {
  try {
    // Use the query builder for complex searches
    const result = await quickPetSearch(searchCriteria, options);

    // Transform pets to include additional data
    const transformedPets = result.pets.map(transformPet);

    return {
      pets: transformedPets,
      pagination: result.pagination,
    };
  } catch (error) {
    logger.error('Error in advanced pet search:', error);
    throw error;
  }
};

/**
 * Send notifications for complaint-related events
 */
async function sendComplaintNotifications(
  pet,
  complaint,
  reporterId,
  wasAutoFlagged = false
) {
  try {
    // Import notification service dynamically to avoid circular dependencies
    const { default: notificationService } = await import(
      '../notification/notification.service.js'
    );

    // Get reporter info
    const reporter = await User.findById(reporterId).select('name email');

    // Create notification data
    const notificationData = {
      type: 'pet_complaint',
      title: 'New Pet Complaint Filed',
      message: `A complaint has been filed for pet "${pet.name}"`,
      data: {
        petId: pet._id,
        petName: pet.name,
        complaintId: complaint._id,
        reason: complaint.reason,
        description: complaint.description,
        wasAutoFlagged,
        actionUrl: `/admin/pets/${pet._id}/complaints`,
        actionText: 'Review Complaint',
      },
      priority: wasAutoFlagged ? 'high' : 'medium',
      sendEmail: true,
    };

    // Send notification to all admins
    const admins = await User.find({ role: 'admin' }).select('_id name email');

    for (const admin of admins) {
      await notificationService.createNotification({
        ...notificationData,
        recipient: admin._id,
        sender: reporterId,
        title: `New Complaint: ${pet.name}`,
        message: `A complaint has been filed for pet "${pet.name}" by ${reporter?.name || 'Anonymous'}. ${wasAutoFlagged ? 'Pet has been automatically flagged due to complaint threshold.' : ''}`,
      });
    }

    // Send notification to shelter owner
    if (pet.shelter && pet.shelter._id) {
      await notificationService.createNotification({
        ...notificationData,
        recipient: pet.shelter._id,
        sender: reporterId,
        title: `Complaint Filed: ${pet.name}`,
        message: `A complaint has been filed for your pet "${pet.name}" by ${reporter?.name || 'Anonymous'}. ${wasAutoFlagged ? 'Pet has been automatically flagged due to complaint threshold.' : ''}`,
      });
    }

    // If auto-flagged, send additional high-priority notification
    if (wasAutoFlagged) {
      const autoFlagNotification = {
        type: 'pet_auto_flagged',
        title: 'Pet Auto-Flagged Due to Complaints',
        message: `Pet "${pet.name}" has been automatically flagged due to reaching the complaint threshold (5+ complaints)`,
        data: {
          petId: pet._id,
          petName: pet.name,
          complaintCount: pet.complaints.length,
          actionUrl: `/admin/pets/${pet._id}/complaints`,
          actionText: 'Review All Complaints',
        },
        priority: 'high',
        sendEmail: true,
      };

      // Send to all admins
      for (const admin of admins) {
        await notificationService.createNotification({
          ...autoFlagNotification,
          recipient: admin._id,
          sender: reporterId,
        });
      }

      // Send to shelter
      if (pet.shelter && pet.shelter._id) {
        await notificationService.createNotification({
          ...autoFlagNotification,
          recipient: pet.shelter._id,
          sender: reporterId,
        });
      }
    }

    logger.info(`Complaint notifications sent for pet ${pet._id}`);
  } catch (error) {
    logger.error('Error sending complaint notifications:', error);
    // Don't throw error to avoid breaking the main complaint flow
  }
}

/**
 * Send notifications for complaint status updates
 */
async function sendComplaintStatusUpdateNotifications(
  pet,
  complaint,
  adminId,
  newStatus,
  statusChanged = false
) {
  try {
    // Import notification service dynamically to avoid circular dependencies
    const { default: notificationService } = await import(
      '../notification/notification.service.js'
    );

    // Get admin info
    const admin = await User.findById(adminId).select('name email');

    // Create notification data
    const notificationData = {
      type: 'complaint_status_update',
      title: `Complaint ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
      message: `Your complaint for pet "${pet.name}" has been ${newStatus}`,
      data: {
        petId: pet._id,
        petName: pet.name,
        complaintId: complaint._id,
        status: newStatus,
        adminNotes: complaint.adminNotes,
        actionUrl: `/pets/${pet._id}`,
        actionText: 'View Pet',
      },
      priority: 'medium',
      sendEmail: true,
    };

    // Send notification to complaint reporter
    if (complaint.reporter && complaint.reporter._id) {
      await notificationService.createNotification({
        ...notificationData,
        recipient: complaint.reporter._id,
        sender: adminId,
        title: `Complaint ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}: ${pet.name}`,
        message: `Your complaint for pet "${pet.name}" has been ${newStatus} by ${admin?.name || 'an administrator'}. ${complaint.adminNotes ? `Notes: ${complaint.adminNotes}` : ''}`,
      });
    }

    // Send notification to shelter if status changed
    if (statusChanged && pet.shelter && pet.shelter._id) {
      await notificationService.createNotification({
        type: 'pet_status_change',
        title: 'Pet Status Updated',
        message: `Pet "${pet.name}" status has been changed from 'flagged' to 'adoptable' as all complaints have been resolved.`,
        data: {
          petId: pet._id,
          petName: pet.name,
          oldStatus: 'flagged',
          newStatus: 'adoptable',
          actionUrl: `/admin/pets/${pet._id}`,
          actionText: 'View Pet',
        },
        recipient: pet.shelter._id,
        sender: adminId,
        priority: 'medium',
        sendEmail: true,
      });
    }

    logger.info(
      `Complaint status update notifications sent for pet ${pet._id}`
    );
  } catch (error) {
    logger.error('Error sending complaint status update notifications:', error);
    // Don't throw error to avoid breaking the main complaint flow
  }
}
