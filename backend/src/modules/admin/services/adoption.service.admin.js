import { AdoptionRequest } from '../../adoption/adoption.model.js';
import logger from '../../../utils/logger.js';

export const adminAdoptionService = {
  /**
   * Get all adoptions
   */
  getAll: async (filters = {}) => {
    try {
      const query = {};
      if (filters.status) query.status = filters.status;
      if (filters.userId) query.user = filters.userId;
      if (filters.shelterId) query.shelter = filters.shelterId;
      if (filters.petId) query.pet = filters.petId;

      const adoptions = await AdoptionRequest.find(query)
        .populate('user', 'name email')
        .populate('shelter', 'name email')
        .populate('pet', 'name breed age')
        .sort({ createdAt: -1 });
      return adoptions;
    } catch (error) {
      logger.error('Get all adoptions service error:', error);
      throw error;
    }
  },

  /**
   * Update adoption
   */
  update: async (adoptionId, adoptionData) => {
    try {
      const adoption = await AdoptionRequest.findByIdAndUpdate(
        adoptionId,
        adoptionData,
        {
          new: true,
          runValidators: true,
        }
      )
        .populate('user', 'name email')
        .populate('shelter', 'name email')
        .populate('pet', 'name breed age');
      return adoption;
    } catch (error) {
      logger.error('Update adoption service error:', error);
      throw error;
    }
  },

  /**
   * Approve adoption
   */
  approve: async (adoptionId, adminId) => {
    try {
      const adoption = await AdoptionRequest.findByIdAndUpdate(
        adoptionId,
        {
          status: 'approved',
          approvedBy: adminId,
          approvedAt: new Date(),
        },
        {
          new: true,
          runValidators: true,
        }
      )
        .populate('user', 'name email')
        .populate('shelter', 'name email')
        .populate('pet', 'name breed age');
      return adoption;
    } catch (error) {
      logger.error('Approve adoption service error:', error);
      throw error;
    }
  },

  /**
   * Reject adoption
   */
  reject: async (adoptionId, reason, adminId) => {
    try {
      const adoption = await AdoptionRequest.findByIdAndUpdate(
        adoptionId,
        {
          status: 'rejected',
          rejectionReason: reason,
          rejectedBy: adminId,
          rejectedAt: new Date(),
        },
        {
          new: true,
          runValidators: true,
        }
      )
        .populate('user', 'name email')
        .populate('shelter', 'name email')
        .populate('pet', 'name breed age');
      return adoption;
    } catch (error) {
      logger.error('Reject adoption service error:', error);
      throw error;
    }
  },
};
