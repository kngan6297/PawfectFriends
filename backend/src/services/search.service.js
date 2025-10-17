import { Pet } from '../modules/pet/pet.model.js';
import { ApiError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Search Service
 * Provides efficient text search with pagination and filtering
 */
class SearchService {
  /**
   * Search pets with text search and filters
   * @param {Object} searchParams - Search parameters
   * @param {string} searchParams.query - Text search query
   * @param {string} searchParams.type - Pet type filter
   * @param {string} searchParams.breed - Breed filter
   * @param {string} searchParams.size - Size filter
   * @param {string} searchParams.status - Status filter
   * @param {string} searchParams.location - Location filter
   * @param {number} searchParams.page - Page number (default: 1)
   * @param {number} searchParams.limit - Items per page (default: 10)
   * @param {string} searchParams.sortBy - Sort field (default: 'createdAt')
   * @param {string} searchParams.sortOrder - Sort order ('asc' or 'desc', default: 'desc')
   * @returns {Promise<Object>} Search results with pagination
   */
  async searchPets(searchParams) {
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
      } = searchParams;

      // Build search query
      const searchQuery = this.buildSearchQuery({
        query,
        type,
        breed,
        size,
        status,
        location,
      });

      // Build sort object
      const sortObject = this.buildSortObject(sortBy, sortOrder);

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute search with pagination
      const [pets, total] = await Promise.all([
        Pet.find(searchQuery).sort(sortObject).skip(skip).limit(limit).lean(),
        Pet.countDocuments(searchQuery),
      ]);

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        pets,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? page + 1 : null,
          prevPage: hasPrevPage ? page - 1 : null,
        },
      };
    } catch (error) {
      logger.error('Error in searchPets:', error);
      throw ApiError.internal('Failed to search pets');
    }
  }

  /**
   * Build search query with text search and filters
   * @param {Object} filters - Search filters
   * @returns {Object} MongoDB query object
   */
  buildSearchQuery(filters) {
    const { query, type, breed, size, status, location } = filters;
    const searchQuery = {};

    // Default to only showing adoptable pets if no status is specified
    if (!status) {
      searchQuery.status = 'adoptable';
    }

    // Text search using regex for partial matching
    if (query && query.trim()) {
      const trimmedQuery = query.trim();
      searchQuery.$or = [
        { name: { $regex: trimmedQuery, $options: 'i' } },
        { description: { $regex: trimmedQuery, $options: 'i' } },
        { breed: { $regex: trimmedQuery, $options: 'i' } },
      ];
    }

    // Apply filters
    if (type) {
      searchQuery.type = type;
    }

    if (breed) {
      searchQuery.breed = { $regex: breed, $options: 'i' };
    }

    if (size) {
      searchQuery.size = size;
    }

    if (status) {
      searchQuery.status = status;
    }

    if (location) {
      searchQuery.location = { $regex: location, $options: 'i' };
    }

    return searchQuery;
  }

  /**
   * Build sort object for MongoDB
   * @param {string} sortBy - Field to sort by
   * @param {string} sortOrder - Sort order ('asc' or 'desc')
   * @returns {Object} Sort object
   */
  buildSortObject(sortBy, sortOrder) {
    const order = sortOrder === 'asc' ? 1 : -1;

    // If using text search, add text score to sort
    if (sortBy === 'relevance') {
      return { score: { $meta: 'textScore' } };
    }

    return { [sortBy]: order };
  }

  /**
   * Get search suggestions based on query
   * @param {string} query - Search query
   * @param {number} limit - Number of suggestions to return
   * @returns {Promise<Array>} Search suggestions
   */
  async getSearchSuggestions(query, limit = 5) {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const suggestions = await Pet.aggregate([
        {
          $match: {
            $text: { $search: query },
          },
        },
        {
          $project: {
            name: 1,
            breed: 1,
            type: 1,
            score: { $meta: 'textScore' },
          },
        },
        {
          $sort: { score: { $meta: 'textScore' } },
        },
        {
          $limit: limit,
        },
      ]);

      return suggestions;
    } catch (error) {
      logger.error('Error getting search suggestions:', error);
      return [];
    }
  }

  /**
   * Get advanced search filters
   * @returns {Promise<Object>} Available filters
   */
  async getSearchFilters() {
    try {
      const [types, breeds, sizes, statuses] = await Promise.all([
        Pet.distinct('type'),
        Pet.distinct('breed'),
        Pet.distinct('size'),
        Pet.distinct('status'),
      ]);

      return {
        types: types.sort(),
        breeds: breeds.sort(),
        sizes: sizes.sort(),
        statuses: statuses.sort(),
      };
    } catch (error) {
      logger.error('Error getting search filters:', error);
      throw ApiError.internal('Failed to get search filters');
    }
  }

  /**
   * Get search analytics
   * @param {string} query - Search query
   * @returns {Promise<Object>} Search analytics
   */
  async getSearchAnalytics(query) {
    try {
      const searchQuery = query ? { $text: { $search: query } } : {};

      const [totalPets, adoptablePets, recentPets] = await Promise.all([
        Pet.countDocuments(searchQuery),
        Pet.countDocuments({ ...searchQuery, status: 'adoptable' }),
        Pet.countDocuments({
          ...searchQuery,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        }),
      ]);

      return {
        totalPets,
        adoptablePets,
        recentPets,
        adoptionRate:
          totalPets > 0
            ? (((totalPets - adoptablePets) / totalPets) * 100).toFixed(1)
            : 0,
      };
    } catch (error) {
      logger.error('Error getting search analytics:', error);
      throw ApiError.internal('Failed to get search analytics');
    }
  }

  /**
   * Perform faceted search with aggregations
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<Object>} Faceted search results
   */
  async facetedSearch(searchParams) {
    try {
      const { query, type, breed, size, status, location } = searchParams;
      const searchQuery = this.buildSearchQuery({
        query,
        type,
        breed,
        size,
        status,
        location,
      });

      const facets = await Pet.aggregate([
        { $match: searchQuery },
        {
          $facet: {
            types: [
              { $group: { _id: '$type', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ],
            breeds: [
              { $group: { _id: '$breed', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 },
            ],
            sizes: [
              { $group: { _id: '$size', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ],
            statuses: [
              { $group: { _id: '$status', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ],
          },
        },
      ]);

      return facets[0];
    } catch (error) {
      logger.error('Error in faceted search:', error);
      throw ApiError.internal('Failed to perform faceted search');
    }
  }
}

// Create singleton instance
const searchService = new SearchService();

export default searchService;
