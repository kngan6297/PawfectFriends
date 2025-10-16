import { Shelter } from '../../user/user.model.js';
import { Pet } from '../../pet/pet.model.js';
import { Review } from '../../review/review.model.js';
import logger from '../../../utils/logger.js';

export const adminShelterService = {
  /**
   * Get all shelters
   */
  getAll: async (filters = {}) => {
    try {
      const query = {};
      if (filters.status) query.status = filters.status;
      if (filters.isApproved !== undefined)
        query.isApproved = filters.isApproved;

      // Use aggregation to include pet count and review count
      const shelters = await Shelter.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'pets',
            localField: '_id',
            foreignField: 'shelter',
            as: 'pets',
          },
        },
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'shelter',
            as: 'reviews',
          },
        },
        {
          $addFields: {
            petCount: { $size: '$pets' },
            reviewCount: { $size: '$reviews' },
            rating: {
              $cond: {
                if: { $gt: [{ $size: '$reviews' }, 0] },
                then: {
                  average: { $avg: '$reviews.rating' },
                  count: { $size: '$reviews' },
                },
                else: {
                  average: 0,
                  count: 0,
                },
              },
            },
          },
        },
        {
          $project: {
            password: 0,
            emailVerificationToken: 0,
            resetPasswordToken: 0,
            pets: 0,
            reviews: 0,
          },
        },
        {
          $addFields: {
            // Map location to address for frontend compatibility
            address: {
              city: '$location.district.name',
              state: '$location.province.name',
              formatted: '$location.formatted',
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      return shelters;
    } catch (error) {
      logger.error('Get all shelters service error:', error);
      throw error;
    }
  },

  /**
   * Update shelter
   */
  update: async (shelterId, shelterData) => {
    try {
      const shelter = await Shelter.findByIdAndUpdate(shelterId, shelterData, {
        new: true,
        runValidators: true,
      }).select('-password -emailVerificationToken -resetPasswordToken');
      return shelter;
    } catch (error) {
      logger.error('Update shelter service error:', error);
      throw error;
    }
  },

  /**
   * Delete shelter
   */
  delete: async (shelterId) => {
    try {
      await Shelter.findByIdAndDelete(shelterId);
    } catch (error) {
      logger.error('Delete shelter service error:', error);
      throw error;
    }
  },

  /**
   * Ban shelter
   */
  ban: async (shelterId, reason) => {
    try {
      const shelter = await Shelter.findByIdAndUpdate(
        shelterId,
        {
          isBanned: true,
          status: 'banned',
          banReason: reason,
          bannedAt: new Date(),
        },
        { new: true }
      ).select('-password -emailVerificationToken -resetPasswordToken');
      return shelter;
    } catch (error) {
      logger.error('Ban shelter service error:', error);
      throw error;
    }
  },

  /**
   * Unban shelter
   */
  unban: async (shelterId) => {
    try {
      const shelter = await Shelter.findByIdAndUpdate(
        shelterId,
        {
          isBanned: false,
          status: 'active',
          banReason: null,
          bannedAt: null,
        },
        { new: true }
      ).select('-password -emailVerificationToken -resetPasswordToken');
      return shelter;
    } catch (error) {
      logger.error('Unban shelter service error:', error);
      throw error;
    }
  },
};
