import { petfinderService } from '../../integrations/petfinder.service.js';
import { catchAsync } from '../../middleware/async.js';
import logger from '../../utils/logger.js';
import { AdoptionRequest } from '../adoption/adoption.model.js';
import { Pet } from './pet.model.js';
import { User } from '../user/user.model.js';
import * as petService from './pet.service.js';
import { ApiError } from '../../utils/errors.js';
import {
  logSecurityEvent,
  SecurityEventType,
} from '../../utils/securityLogger.js';
import { logPetActivity } from '../../utils/activityLogger.js';
import { validateAndThrow } from '../../middleware/validateRequest.js';
import fileUploadService from '../../services/fileUpload.service.js';
import searchService from '../../services/search.service.js';
import { getShelterId } from '../../middleware/shelterAccess.js';
import axios from 'axios';

export const createPet = async (req, res) => {
  try {
    // Process uploaded files using the file upload service
    let photos = [];
    if (req.files && req.files.length > 0) {
      const processedFiles = await fileUploadService.processUploadedFiles(
        req.files,
        {
          generateUrl: true,
          addCaption: true,
        }
      );

      // Transform file upload service output to match Pet model schema
      photos = processedFiles.map((file) => ({
        _id: file.id,
        url: file.url,
        caption: file.caption || '',
        // Add other photo sizes if needed
        small: file.url,
        medium: file.url,
        large: file.url,
        full: file.url,
      }));
    }

    // Get shelter ID using the new shelter access logic
    const shelterId = getShelterId(req);

    const pet = await petService.createPet(shelterId, {
      ...req.body,
      photos,
      shelter: shelterId,
    });

    logSecurityEvent(SecurityEventType.PET.CREATE, {
      userId: req.user._id,
      petId: pet._id,
      shelterId: shelterId,
    });

    // Log activity
    await logPetActivity(req.user, 'pet_created', pet, req);

    res.status(201).json({
      success: true,
      data: pet,
      message: 'Pet created successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to create pet');
  }
};

export const getPets = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort, ...filters } = req.query;

    // Convert sort string to sort object
    let sortObj = { createdAt: -1 }; // default sort
    if (sort) {
      switch (sort) {
        case 'newest':
          sortObj = { createdAt: -1 };
          break;
        case 'oldest':
          sortObj = { createdAt: 1 };
          break;
        case 'name_asc':
          sortObj = { name: 1 };
          break;
        case 'name_desc':
          sortObj = { name: -1 };
          break;
        case 'popular':
          sortObj = { views: -1 };
          break;
        default:
          sortObj = { createdAt: -1 };
      }
    }

    const pets = await petService.getPets(filters, {
      page,
      limit,
      sort: sortObj,
    });
    res.json({
      success: true,
      data: pets,
      message: 'Pets retrieved successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get pets');
  }
};

export const getPetById = async (req, res) => {
  try {
    // Validate petId parameter
    validateAndThrow(req.params.petId, 'pet ID');

    const pet = await petService.getPetById(req.params.petId, req.user?._id);
    res.json({
      success: true,
      data: pet,
      message: 'Pet retrieved successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get pet');
  }
};

export const updatePet = async (req, res) => {
  try {
    // Validate petId parameter
    validateAndThrow(req.params.petId, 'pet ID');

    // Process uploaded files using the file upload service
    let photos = [];
    if (req.files && req.files.length > 0) {
      const processedFiles = await fileUploadService.processUploadedFiles(
        req.files,
        {
          generateUrl: true,
          addCaption: true,
        }
      );

      // Transform file upload service output to match Pet model schema
      photos = processedFiles.map((file) => ({
        _id: file.id,
        url: file.url,
        caption: file.caption || '',
        // Add other photo sizes if needed
        small: file.url,
        medium: file.url,
        large: file.url,
        full: file.url,
      }));
    }

    // Get shelter ID using the new shelter access logic
    const shelterId = getShelterId(req);

    // Prepare update data with photos if any were uploaded
    const updateData = {
      ...req.body,
      ...(photos.length > 0 && { photos }),
    };

    const pet = await petService.updatePet(
      req.params.petId,
      shelterId,
      updateData,
      req.user._id,
      req.user.role
    );

    logSecurityEvent(SecurityEventType.PET.UPDATE, {
      userId: req.user._id,
      petId: pet._id,
      shelterId: shelterId,
    });

    // Log activity
    await logPetActivity(req.user, 'pet_updated', pet, req, {
      changes: Object.keys(req.body),
    });

    res.json({
      success: true,
      data: pet,
      message: 'Pet updated successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to update pet');
  }
};

export const deletePet = async (req, res) => {
  try {
    // Validate petId parameter
    validateAndThrow(req.params.petId, 'pet ID');

    // Get pet info before deletion for logging
    const pet = await Pet.findById(req.params.petId);

    await petService.deletePet(req.params.petId, req.user._id);

    logSecurityEvent(SecurityEventType.PET.DELETE, {
      userId: req.user._id,
      petId: req.params.petId,
      shelterId: req.user.shelter,
    });

    // Log activity
    if (pet) {
      await logPetActivity(req.user, 'pet_deleted', pet, req);
    }

    res.json({
      success: true,
      data: null,
      message: 'Pet deleted successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to delete pet');
  }
};

export const addHealthRecord = async (req, res) => {
  try {
    // Validate petId parameter
    validateAndThrow(req.params.petId, 'pet ID');

    const pet = await petService.addHealthRecord(
      req.params.petId,
      req.body,
      req.user
    );

    logSecurityEvent(SecurityEventType.PET.HEALTH_RECORD_ADDED, {
      userId: req.user._id,
      petId: pet._id,
      shelterId: req.user.shelter,
    });

    // Log activity
    await logPetActivity(req.user, 'health_record_added', pet, req, {
      recordType: 'health',
      recordId: req.body._id,
    });

    res.json({
      success: true,
      data: pet,
      message: 'Health record added successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to add health record');
  }
};

export const addBehaviorRecord = async (req, res) => {
  try {
    // Validate petId parameter
    validateAndThrow(req.params.petId, 'pet ID');

    const pet = await petService.addBehaviorRecord(
      req.params.petId,
      req.body,
      req.user
    );

    logSecurityEvent(SecurityEventType.PET.BEHAVIOR_RECORD_ADDED, {
      userId: req.user._id,
      petId: pet._id,
      shelterId: req.user.shelter,
    });

    // Log activity
    await logPetActivity(req.user, 'behavior_record_added', pet, req, {
      recordType: 'behavior',
      recordId: req.body._id,
    });

    res.json({
      success: true,
      data: pet,
      message: 'Behavior record added successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to add behavior record');
  }
};

export const updatePetStatus = async (req, res) => {
  try {
    // Validate petId parameter
    validateAndThrow(req.params.petId, 'pet ID');

    const { status, reason } = req.body;

    // Get current pet status before update
    const currentPet = await Pet.findById(req.params.petId);
    const oldStatus = currentPet?.status;

    // Get shelter ID using the new shelter access logic
    const shelterId = getShelterId(req);

    const pet = await petService.updateStatus(
      req.params.petId,
      shelterId,
      status,
      req.user._id,
      req.user.role,
      reason
    );

    logSecurityEvent(SecurityEventType.PET.STATUS_UPDATED, {
      userId: req.user._id,
      petId: pet._id,
      status,
      shelterId: shelterId,
    });

    // Log activity
    await logPetActivity(req.user, 'pet_status_changed', pet, req, {
      oldStatus: oldStatus,
      newStatus: status,
      reason: reason,
    });

    res.json({
      success: true,
      data: pet,
      message: 'Pet status updated successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to update pet status');
  }
};

export const uploadPetImages = async (req, res) => {
  try {
    // Validate petId parameter
    validateAndThrow(req.params.petId, 'pet ID');

    // Process uploaded files using the file upload service
    let processedFiles = [];
    if (req.files && req.files.length > 0) {
      processedFiles = await fileUploadService.processUploadedFiles(req.files, {
        generateUrl: true,
        addCaption: true,
      });
    }

    const pet = await petService.uploadPetImages(
      req.params.petId,
      processedFiles,
      req.user
    );

    logSecurityEvent(SecurityEventType.PET.IMAGES_UPLOADED, {
      userId: req.user._id,
      petId: pet._id,
      shelterId: req.user.shelter,
      imageCount: processedFiles.length,
    });

    res.json({
      success: true,
      data: pet,
      message: 'Pet images uploaded successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to upload pet images');
  }
};

export const deletePetImage = async (req, res) => {
  try {
    // Validate petId and imageId parameters
    validateAndThrow(req.params.petId, 'pet ID');
    validateAndThrow(req.params.imageId, 'image ID');

    const pet = await petService.deletePetImage(
      req.params.petId,
      req.params.imageId,
      req.user
    );

    logSecurityEvent(SecurityEventType.PET.IMAGE_DELETED, {
      userId: req.user._id,
      petId: pet._id,
      imageId: req.params.imageId,
      shelterId: req.user.shelter,
    });

    res.json({
      success: true,
      data: pet,
      message: 'Pet image deleted successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to delete pet image');
  }
};

export const setPrimaryImage = async (req, res) => {
  try {
    // Validate petId and imageId parameters
    validateAndThrow(req.params.petId, 'pet ID');
    validateAndThrow(req.params.imageId, 'image ID');

    const pet = await petService.setPrimaryImage(
      req.params.petId,
      req.params.imageId,
      req.user
    );

    logSecurityEvent(SecurityEventType.PET.PRIMARY_IMAGE_SET, {
      userId: req.user._id,
      petId: pet._id,
      imageId: req.params.imageId,
      shelterId: req.user.shelter,
    });

    res.json({
      success: true,
      data: pet,
      message: 'Primary image set successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to set primary image');
  }
};

export const getLatestPets = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const pets = await petService.getLatestPets(limit);
    res.json({
      success: true,
      data: pets,
      message: 'Latest pets retrieved successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get latest pets');
  }
};

export const searchPets = catchAsync(async (req, res) => {
  try {
    const {
      query,
      type,
      breed,
      size,
      status,
      location,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Use the search service for efficient text search with pagination
    const searchResult = await searchService.searchPets({
      query,
      type,
      breed,
      size,
      status,
      location,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
    });

    res.status(200).json({
      success: true,
      data: {
        pets: searchResult.pets,
        pagination: searchResult.pagination,
      },
      message: 'Pets search completed successfully',
    });
  } catch (error) {
    logger.error('Error searching pets:', error);
    res.status(400).json({
      success: false,
      data: null,
      message: error.message,
    });
  }
});

export const getSearchSuggestions = catchAsync(async (req, res) => {
  try {
    const { query, limit = 5 } = req.query;

    const suggestions = await searchService.getSearchSuggestions(
      query,
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: suggestions,
      message: 'Search suggestions retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting search suggestions:', error);
    res.status(400).json({
      success: false,
      data: null,
      message: error.message,
    });
  }
});

export const getSearchFilters = catchAsync(async (req, res) => {
  try {
    const filters = await searchService.getSearchFilters();

    res.status(200).json({
      success: true,
      data: filters,
      message: 'Search filters retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting search filters:', error);
    res.status(400).json({
      success: false,
      data: null,
      message: error.message,
    });
  }
});

export const getSearchAnalytics = catchAsync(async (req, res) => {
  try {
    const { query } = req.query;

    const analytics = await searchService.getSearchAnalytics(query);

    res.status(200).json({
      success: true,
      data: analytics,
      message: 'Search analytics retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting search analytics:', error);
    res.status(400).json({
      success: false,
      data: null,
      message: error.message,
    });
  }
});

export const getFacetedSearch = catchAsync(async (req, res) => {
  try {
    const { query, type, breed, size, status, location } = req.query;

    const facets = await searchService.facetedSearch({
      query,
      type,
      breed,
      size,
      status,
      location,
    });

    res.status(200).json({
      success: true,
      data: facets,
      message: 'Faceted search results retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting faceted search:', error);
    res.status(400).json({
      success: false,
      data: null,
      message: error.message,
    });
  }
});

export const getSimilarPets = catchAsync(async (req, res) => {
  try {
    // Validate id parameter
    validateAndThrow(req.params.id, 'pet ID');

    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Pet not found',
      });
    }

    const similarPets = await Pet.find({
      _id: { $ne: pet._id },
      type: pet.type,
      breed: pet.breed,
      status: 'adoptable',
    }).limit(5);

    res.status(200).json({
      success: true,
      data: similarPets,
      message: 'Similar pets retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting similar pets:', error);
    res.status(400).json({
      success: false,
      data: null,
      message: error.message,
    });
  }
});

export const updatePhotos = catchAsync(async (req, res) => {
  try {
    // Validate id parameter
    validateAndThrow(req.params.id, 'pet ID');

    const { photos } = req.body;

    // Process photos if they are in legacy format
    let processedPhotos = photos;
    if (Array.isArray(photos)) {
      processedPhotos = await Promise.all(
        photos.map(async (photo) => {
          if (typeof photo === 'string') {
            return fileUploadService.convertLegacyFormat(photo);
          }
          return photo;
        })
      );
    }

    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      { photos: processedPhotos },
      { new: true, runValidators: true }
    );

    if (!pet) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Pet not found',
      });
    }

    res.status(200).json({
      success: true,
      data: pet,
      message: 'Pet photos updated successfully',
    });
  } catch (error) {
    logger.error('Error updating pet photos:', error);
    res.status(400).json({
      success: false,
      data: null,
      message: error.message,
    });
  }
});

export const getShelterPets = catchAsync(async (req, res) => {
  try {
    // Get shelter ID using the new shelter access logic
    const shelterId = getShelterId(req);

    // Ensure shelterId is an ObjectId
    const mongoose = await import('mongoose');
    if (!mongoose.Types.ObjectId.isValid(shelterId)) {
      throw new ApiError('Invalid shelter ID format', 400);
    }

    const { page = 1, limit = 100, ...filters } = req.query;
    const pets = await petService.getShelterPets(shelterId, {
      page: parseInt(page),
      limit: parseInt(limit),
      filters,
    });

    res.json({
      success: true,
      data: pets,
      message: 'Shelter pets retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting shelter pets:', error);
    res.status(400).json({
      success: false,
      data: null,
      message: error.message,
    });
  }
});

// Proxy endpoint for pet images to avoid CORS issues
export const proxyPetImage = catchAsync(async (req, res) => {
  try {
    const { imageUrl } = req.query;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required',
      });
    }

    // Validate that it's a Petfinder URL
    if (!imageUrl.includes('cloudfront.net/photos/pets/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image URL',
      });
    }

    // Fetch the image from Petfinder
    const response = await axios.get(imageUrl, {
      responseType: 'stream',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    // Set appropriate headers
    res.setHeader(
      'Content-Type',
      response.headers['content-type'] || 'image/jpeg'
    );
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Pipe the image data to the response
    response.data.pipe(res);
  } catch (error) {
    logger.error('Error proxying pet image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load image',
    });
  }
});

/**
 * @desc    Import pets from Petfinder
 * @route   POST /api/pets/import/petfinder
 * @access  Private/Admin
 */
export const importPetfinderData = catchAsync(async (req, res) => {
  const options = {
    limit: req.body.limit,
    type: req.body.type,
    location: req.body.location,
  };

  const result = await petfinderService.importPets(options);
  res.status(200).json({
    success: true,
    data: {
      totalProcessed: result.totalProcessed,
      imported: result.imported,
      updated: result.totalProcessed - result.imported,
    },
    message: 'Pets imported successfully from Petfinder',
  });
});

// Get shelter statistics
export const getShelterStats = async (req, res) => {
  try {
    // Get shelter ID using the new shelter access logic
    const shelterId = getShelterId(req);

    // Ensure shelterId is an ObjectId
    const mongoose = await import('mongoose');
    const objectIdShelterId = mongoose.Types.ObjectId.isValid(shelterId)
      ? new mongoose.Types.ObjectId(shelterId)
      : shelterId;

    const stats = await Pet.aggregate([
      { $match: { shelter: objectIdShelterId } },
      {
        $facet: {
          totalPets: [{ $count: 'count' }],
          availablePets: [
            { $match: { status: 'adoptable' } },
            { $count: 'count' },
          ],
          pendingRequests: [
            { $match: { status: 'pending' } },
            { $count: 'count' },
          ],
          approvedRequests: [
            { $match: { status: 'adopted' } },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const formattedStats = {
      totalPets: stats[0].totalPets[0]?.count || 0,
      availablePets: stats[0].availablePets[0]?.count || 0,
      pendingRequests: stats[0].pendingRequests[0]?.count || 0,
      approvedRequests: stats[0].approvedRequests[0]?.count || 0,
    };

    res.json({
      success: true,
      data: formattedStats,
      message: 'Shelter statistics retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: 'Error fetching shelter stats',
      error: error.message,
    });
  }
};

// Get shelter adoption requests
export const getShelterAdoptionRequests = async (req, res) => {
  try {
    // Get shelter ID using the new shelter access logic
    const shelterId = getShelterId(req);

    const adoptionRequests =
      await petService.getShelterAdoptionRequests(shelterId);
    res.json({
      success: true,
      data: adoptionRequests,
      message: 'Shelter adoption requests retrieved successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get shelter adoption requests');
  }
};

export const getPetEditLogs = async (req, res) => {
  try {
    // Validate petId parameter
    validateAndThrow(req.params.petId, 'pet ID');

    const editLogs = await petService.getPetEditLogs(req.params.petId);
    res.json({
      success: true,
      data: editLogs,
      message: 'Pet edit logs retrieved successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get pet edit logs');
  }
};

export const addComplaint = async (req, res) => {
  try {
    // Validate petId parameter
    validateAndThrow(req.params.petId, 'pet ID');

    const pet = await petService.addComplaint(
      req.params.petId,
      req.body,
      req.user._id
    );

    logSecurityEvent(SecurityEventType.PET.COMPLAINT_ADDED, {
      userId: req.user._id,
      petId: pet._id,
      reason: req.body.reason,
    });

    // Log activity
    await logPetActivity(req.user, 'complaint_added', pet, req, {
      complaintId: req.body._id,
      complaintType: req.body.type,
    });

    res.status(201).json({
      success: true,
      data: pet,
      message: 'Complaint submitted successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to add complaint');
  }
};

export const getPetComplaints = async (req, res) => {
  try {
    // Validate petId parameter
    validateAndThrow(req.params.petId, 'pet ID');

    const complaints = await petService.getPetComplaints(req.params.petId);
    res.json({
      success: true,
      data: complaints,
      message: 'Pet complaints retrieved successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get pet complaints');
  }
};

export const updateComplaintStatus = async (req, res) => {
  try {
    // Validate petId and complaintId parameters
    validateAndThrow(req.params.petId, 'pet ID');
    validateAndThrow(req.params.complaintId, 'complaint ID');

    const { status, adminNotes } = req.body;
    const pet = await petService.updateComplaintStatus(
      req.params.petId,
      req.params.complaintId,
      status,
      req.user._id,
      adminNotes
    );

    logSecurityEvent(SecurityEventType.PET.COMPLAINT_UPDATED, {
      userId: req.user._id,
      petId: pet._id,
      complaintId: req.params.complaintId,
      status,
    });

    // Log activity
    await logPetActivity(req.user, 'complaint_status_updated', pet, req, {
      complaintId: req.params.complaintId,
      status,
      adminNotes,
    });

    res.json({
      success: true,
      data: pet,
      message: 'Complaint status updated successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to update complaint status');
  }
};

export const getFlaggedPets = async (req, res) => {
  try {
    const filters = req.query;
    const pets = await petService.getFlaggedPets(filters);
    res.json({
      success: true,
      data: pets,
      message: 'Flagged pets retrieved successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get flagged pets');
  }
};

export const getComplaintStats = async (req, res) => {
  try {
    const stats = await petService.getComplaintStats();
    res.json({
      success: true,
      data: stats,
      message: 'Complaint statistics retrieved successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get complaint statistics');
  }
};

export const getPetsWithHighComplaints = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 3;
    const pets = await petService.getPetsWithHighComplaints(threshold);
    res.json({
      success: true,
      data: pets,
      message: 'Pets with high complaints retrieved successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get pets with high complaints');
  }
};

export const getPetBySlug = async (req, res) => {
  try {
    const pet = await petService.getPetBySlug(req.params.slug, req.user?._id);
    res.json({
      success: true,
      data: pet,
      message: 'Pet retrieved successfully',
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internal('Failed to get pet');
  }
};

// Move the petController object to the end of the file
export const petController = {
  createPet,
  getPets,
  getPetById,
  updatePet,
  deletePet,
  searchPets,
  getSearchSuggestions,
  getSearchFilters,
  getSearchAnalytics,
  getFacetedSearch,
  getSimilarPets,
  updatePhotos,
  updateStatus: updatePetStatus,
  getShelterPets,
  getLatestPets,
  importPetfinderData,
  getShelterStats,
  getShelterAdoptionRequests,
  addHealthRecord,
  addBehaviorRecord,
  uploadPetImages,
  deletePetImage,
  setPrimaryImage,
  getPetEditLogs,
  addComplaint,
  getPetComplaints,
  updateComplaintStatus,
  getFlaggedPets,
  getComplaintStats,
  getPetsWithHighComplaints,
  getPetBySlug,
};
