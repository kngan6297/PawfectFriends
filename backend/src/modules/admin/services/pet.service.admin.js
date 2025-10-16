import { Pet } from '../../pet/pet.model.js';
import logger from '../../../utils/logger.js';

// Transform function to map _id to id and create breeds object for frontend compatibility
const transformPet = (pet) => {
  if (!pet) return null;
  const petObj = pet.toObject ? pet.toObject() : pet;
  return {
    ...petObj,
    id: petObj._id,
    _id: undefined,
    // Create breeds object for frontend compatibility
    breeds: {
      primary: petObj.breed || 'Unknown Breed',
      secondary: null,
      mixed: false,
      unknown: false,
    },
  };
};

export const adminPetService = {
  /**
   * Get all pets
   */
  getAll: async (filters = {}) => {
    try {
      const query = {};
      if (filters.status) query.status = filters.status;
      if (filters.isApproved !== undefined)
        query.isApproved = filters.isApproved;
      if (filters.shelterId) query.shelter = filters.shelterId;

      const pets = await Pet.find(query)
        .populate('shelter', 'name email')
        .sort({ createdAt: -1 });
      return pets.map(transformPet);
    } catch (error) {
      logger.error('Get all pets service error:', error);
      throw error;
    }
  },

  /**
   * Update pet
   */
  update: async (petId, petData, editorId) => {
    try {
      // Create edit log entry
      const editLogEntry = {
        date: new Date(),
        editor: editorId,
        changes: petData,
      };

      const pet = await Pet.findByIdAndUpdate(
        petId,
        {
          ...petData,
          $push: { editLogs: editLogEntry },
        },
        {
          new: true,
          runValidators: true,
        }
      ).populate('shelter', 'name email');
      return transformPet(pet);
    } catch (error) {
      logger.error('Update pet service error:', error);
      throw error;
    }
  },

  /**
   * Delete pet
   */
  delete: async (petId) => {
    try {
      await Pet.findByIdAndDelete(petId);
    } catch (error) {
      logger.error('Delete pet service error:', error);
      throw error;
    }
  },

  /**
   * Reject pet
   */
  reject: async (petId, reason, editorId) => {
    try {
      // Create edit log entry
      const editLogEntry = {
        date: new Date(),
        editor: editorId,
        action: 'rejected',
        reason: reason,
      };

      const pet = await Pet.findByIdAndUpdate(
        petId,
        {
          status: 'rejected',
          rejectionReason: reason,
          rejectedAt: new Date(),
          $push: { editLogs: editLogEntry },
        },
        {
          new: true,
          runValidators: true,
        }
      ).populate('shelter', 'name email');
      return transformPet(pet);
    } catch (error) {
      logger.error('Reject pet service error:', error);
      throw error;
    }
  },

  /**
   * Approve pet
   */
  approve: async (petId, editorId) => {
    try {
      // Create edit log entry
      const editLogEntry = {
        date: new Date(),
        editor: editorId,
        action: 'approved',
      };

      const pet = await Pet.findByIdAndUpdate(
        petId,
        {
          status: 'approved',
          approvedAt: new Date(),
          $push: { editLogs: editLogEntry },
        },
        {
          new: true,
          runValidators: true,
        }
      ).populate('shelter', 'name email');
      return transformPet(pet);
    } catch (error) {
      logger.error('Approve pet service error:', error);
      throw error;
    }
  },

  /**
   * Bulk approve all pending pets
   */
  bulkApproveAll: async (editorId) => {
    try {
      // Create edit log entry for bulk action
      const editLogEntry = {
        date: new Date(),
        editor: editorId,
        action: 'bulk_approved',
        reason: 'Bulk approval of all pending pets',
      };

      // Update all pets with status 'pending' to 'adoptable'
      const result = await Pet.updateMany(
        { status: 'pending' },
        {
          status: 'adoptable',
          approvedAt: new Date(),
          $push: { editLogs: editLogEntry },
        }
      );

      logger.info(
        `Bulk approval completed: ${result.modifiedCount} pets approved`
      );

      return {
        modifiedCount: result.modifiedCount,
        message: `Successfully approved ${result.modifiedCount} pets`,
      };
    } catch (error) {
      logger.error('Bulk approve pets service error:', error);
      throw error;
    }
  },
};
