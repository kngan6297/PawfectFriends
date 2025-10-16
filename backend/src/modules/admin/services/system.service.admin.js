import { User, Shelter } from '../../user/user.model.js';
import { Pet } from '../../pet/pet.model.js';
import { AdoptionRequest } from '../../adoption/adoption.model.js';
import { Review } from '../../review/review.model.js';
import { Notification } from '../../notification/notification.model.js';
import logger from '../../../utils/logger.js';

export const adminSystemService = {
  /**
   * Get system stats
   */
  getStats: async () => {
    try {
      // User stats
      const totalUsers = await User.countDocuments({ role: 'user' });
      const totalAdmins = await User.countDocuments({ role: 'admin' });
      const activeUsers = await User.countDocuments({
        role: 'user',
        status: 'active',
        isLocked: { $ne: true },
      });
      const lockedUsers = await User.countDocuments({
        role: 'user',
        isLocked: true,
      });

      // Shelter stats
      const totalShelters = await Shelter.countDocuments();
      const approvedShelters = await Shelter.countDocuments({
        isApproved: true,
        status: 'active',
      });
      const pendingShelters = await Shelter.countDocuments({
        isApproved: false,
      });
      const bannedShelters = await Shelter.countDocuments({
        isBanned: true,
      });

      // Pet stats
      const totalPets = await Pet.countDocuments();
      const approvedPets = await Pet.countDocuments({
        status: 'approved',
      });
      const pendingPets = await Pet.countDocuments({
        status: 'pending',
      });
      const rejectedPets = await Pet.countDocuments({
        status: 'rejected',
      });

      // Adoption stats
      const totalAdoptions = await AdoptionRequest.countDocuments();
      const approvedAdoptions = await AdoptionRequest.countDocuments({
        status: 'approved',
      });
      const pendingAdoptions = await AdoptionRequest.countDocuments({
        status: 'pending',
      });
      const rejectedAdoptions = await AdoptionRequest.countDocuments({
        status: 'rejected',
      });

      // Review stats
      const totalReviews = await Review.countDocuments();
      const averageRating = await Review.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$rating' } } },
      ]);

      // Notification stats
      const totalNotifications = await Notification.countDocuments();
      const sentNotifications = await Notification.countDocuments({
        status: 'sent',
      });
      const readNotifications = await Notification.countDocuments({
        status: 'read',
      });

      // Recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentUsers = await User.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
      });
      const recentPets = await Pet.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
      });
      const recentAdoptions = await AdoptionRequest.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
      });

      // Get recent users and shelters data for dashboard (latest 10 regardless of date)
      const recentUsersData = await User.find({
        role: 'user',
      })
        .select('name email createdAt')
        .sort({ createdAt: -1 })
        .limit(10);

      const recentSheltersData = await Shelter.find({})
        .select('name email createdAt')
        .sort({ createdAt: -1 })
        .limit(10);

      return {
        // Flat structure for frontend compatibility
        totalUsers: totalUsers,
        totalShelters: totalShelters,
        totalPets: totalPets,
        totalAdoptions: totalAdoptions,
        totalReviews: totalReviews,
        recentUsers: recentUsersData,
        recentShelters: recentSheltersData,

        // Additional detailed stats for admin use
        users: {
          total: totalUsers,
          admins: totalAdmins,
          active: activeUsers,
          locked: lockedUsers,
          recent: recentUsers,
        },
        shelters: {
          total: totalShelters,
          approved: approvedShelters,
          pending: pendingShelters,
          banned: bannedShelters,
        },
        pets: {
          total: totalPets,
          approved: approvedPets,
          pending: pendingPets,
          rejected: rejectedPets,
          recent: recentPets,
        },
        adoptions: {
          total: totalAdoptions,
          approved: approvedAdoptions,
          pending: pendingAdoptions,
          rejected: rejectedAdoptions,
          recent: recentAdoptions,
        },
        reviews: {
          total: totalReviews,
          averageRating: averageRating[0]?.avgRating || 0,
        },
        notifications: {
          total: totalNotifications,
          sent: sentNotifications,
          read: readNotifications,
        },
      };
    } catch (error) {
      logger.error('Get system stats service error:', error);
      throw error;
    }
  },
};
