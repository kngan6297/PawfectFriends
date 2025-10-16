import { Content } from '../../content/content.model.js';
import logger from '../../../utils/logger.js';

export const adminContentService = {
  /**
   * Get all content
   */
  getAll: async (filters = {}) => {
    try {
      const query = {};
      if (filters.type) query.type = filters.type;
      if (filters.status) query.status = filters.status;
      if (filters.authorId) query.author = filters.authorId;

      const content = await Content.find(query)
        .populate('author', 'name email')
        .populate('editor', 'name email')
        .sort({ createdAt: -1 });
      return content;
    } catch (error) {
      logger.error('Get all content service error:', error);
      throw error;
    }
  },

  /**
   * Create content
   */
  create: async (contentData, authorId) => {
    try {
      const content = new Content({
        ...contentData,
        author: authorId,
        status: 'draft',
      });
      await content.save();
      return content;
    } catch (error) {
      logger.error('Create content service error:', error);
      throw error;
    }
  },

  /**
   * Update content
   */
  update: async (contentId, updateData, editorId) => {
    try {
      const content = await Content.findByIdAndUpdate(
        contentId,
        {
          ...updateData,
          editor: editorId,
          lastEditedAt: new Date(),
        },
        {
          new: true,
          runValidators: true,
        }
      ).populate('author', 'name email');
      return content;
    } catch (error) {
      logger.error('Update content service error:', error);
      throw error;
    }
  },

  /**
   * Delete content
   */
  delete: async (contentId) => {
    try {
      await Content.findByIdAndDelete(contentId);
    } catch (error) {
      logger.error('Delete content service error:', error);
      throw error;
    }
  },

  /**
   * Publish content
   */
  publish: async (contentId, publisherId) => {
    try {
      const content = await Content.findByIdAndUpdate(
        contentId,
        {
          status: 'published',
          publishedBy: publisherId,
          publishedAt: new Date(),
        },
        {
          new: true,
          runValidators: true,
        }
      ).populate('author', 'name email');
      return content;
    } catch (error) {
      logger.error('Publish content service error:', error);
      throw error;
    }
  },

  /**
   * Get content stats
   */
  getStats: async () => {
    try {
      const totalContent = await Content.countDocuments();
      const publishedContent = await Content.countDocuments({
        status: 'published',
      });
      const draftContent = await Content.countDocuments({ status: 'draft' });
      const articleContent = await Content.countDocuments({ type: 'article' });
      const guideContent = await Content.countDocuments({ type: 'guide' });

      const recentContent = await Content.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('author', 'name email')
        .populate('editor', 'name email');

      return {
        total: totalContent,
        published: publishedContent,
        draft: draftContent,
        articles: articleContent,
        guides: guideContent,
        recent: recentContent,
      };
    } catch (error) {
      logger.error('Get content stats service error:', error);
      throw error;
    }
  },

  /**
   * Bulk delete content
   */
  deleteBulk: async (contentIds) => {
    try {
      await Content.deleteMany({ _id: { $in: contentIds } });
      return { deletedCount: contentIds.length };
    } catch (error) {
      logger.error('Bulk delete content service error:', error);
      throw error;
    }
  },
};
