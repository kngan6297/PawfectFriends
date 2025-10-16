import mongoose from 'mongoose';
import logger from './logger.js';

/**
 * Query Builder for Pet Queries
 *
 * This utility provides a fluent interface for building complex pet queries
 * with pagination, filtering, sorting, and population options.
 *
 * @example
 * const queryBuilder = new PetQueryBuilder();
 * const result = await queryBuilder
 *   .where('status', 'adoptable')
 *   .where('type', 'dog')
 *   .search('golden retriever')
 *   .priceRange(0, 500)
 *   .ageRange(1, 5)
 *   .sortBy('createdAt', 'desc')
 *   .paginate(1, 10)
 *   .populateShelter()
 *   .execute();
 */
export class PetQueryBuilder {
  constructor() {
    this.query = {};
    this.options = {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      populateShelter: true,
      populateFields: 'name location phone website bio rating',
    };
    this.populateOptions = [];
  }

  /**
   * Add a basic where condition
   * @param {string} field - Field name
   * @param {any} value - Field value
   * @returns {PetQueryBuilder} - This instance for chaining
   */
  where(field, value) {
    if (value !== undefined && value !== null) {
      this.query[field] = value;
    }
    return this;
  }

  /**
   * Add multiple where conditions
   * @param {Object} conditions - Object with field-value pairs
   * @returns {PetQueryBuilder} - This instance for chaining
   */
  whereIn(conditions) {
    Object.assign(this.query, conditions);
    return this;
  }

  /**
   * Add text search across multiple fields
   * @param {string} searchTerm - Search term
   * @param {Array} fields - Fields to search in (default: ['name', 'description', 'breed'])
   * @returns {PetQueryBuilder} - This instance for chaining
   */
  search(searchTerm, fields = ['name', 'description', 'breed']) {
    if (searchTerm && searchTerm.trim()) {
      const searchConditions = fields.map((field) => ({
        [field]: { $regex: searchTerm.trim(), $options: 'i' },
      }));

      if (this.query.$or) {
        this.query.$or.push(...searchConditions);
      } else {
        this.query.$or = searchConditions;
      }
    }
    return this;
  }

  /**
   * Add price range filter
   * @param {number} min - Minimum price
   * @param {number} max - Maximum price
   * @returns {PetQueryBuilder} - This instance for chaining
   */
  priceRange(min, max) {
    if (min !== undefined || max !== undefined) {
      this.query.adoptionFee = {};
      if (min !== undefined) this.query.adoptionFee.$gte = min;
      if (max !== undefined) this.query.adoptionFee.$lte = max;
    }
    return this;
  }

  /**
   * Add age range filter
   * @param {number} min - Minimum age
   * @param {number} max - Maximum age
   * @returns {PetQueryBuilder} - This instance for chaining
   */
  ageRange(min, max) {
    if (min !== undefined || max !== undefined) {
      this.query.age = {};
      if (min !== undefined) this.query.age.$gte = min;
      if (max !== undefined) this.query.age.$lte = max;
    }
    return this;
  }

  /**
   * Add health filter
   * @param {string} healthField - Health field name
   * @param {boolean} value - Health value
   * @returns {PetQueryBuilder} - This instance for chaining
   */
  healthFilter(healthField, value) {
    if (value !== undefined) {
      this.query[`health.${healthField}`] = value;
    }
    return this;
  }

  /**
   * Add behavior filter
   * @param {string} behaviorField - Behavior field name
   * @param {string|Array} value - Behavior value(s)
   * @returns {PetQueryBuilder} - This instance for chaining
   */
  behaviorFilter(behaviorField, value) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        this.query[`behavior.${behaviorField}`] = { $in: value };
      } else {
        this.query[`behavior.${behaviorField}`] = value;
      }
    }
    return this;
  }

  /**
   * Set pagination options
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {PetQueryBuilder} - This instance for chaining
   */
  paginate(page, limit) {
    this.options.page = page || 1;
    this.options.limit = limit || 10;
    return this;
  }

  /**
   * Set sorting options
   * @param {string} field - Sort field
   * @param {string} order - Sort order ('asc' or 'desc')
   * @returns {PetQueryBuilder} - This instance for chaining
   */
  sortBy(field, order = 'desc') {
    this.options.sortBy = field;
    this.options.sortOrder = order;
    return this;
  }

  /**
   * Configure shelter population
   * @param {boolean} populate - Whether to populate shelter
   * @param {string} fields - Fields to populate
   * @returns {PetQueryBuilder} - This instance for chaining
   */
  populateShelter(
    populate = true,
    fields = 'name location phone website bio rating'
  ) {
    this.options.populateShelter = populate;
    this.options.populateFields = fields;
    return this;
  }

  /**
   * Add custom populate options
   * @param {Object} populateOptions - Mongoose populate options
   * @returns {PetQueryBuilder} - This instance for chaining
   */
  populate(populateOptions) {
    this.populateOptions.push(populateOptions);
    return this;
  }

  /**
   * Execute the query
   * @returns {Promise<Object>} - Query result with pets and pagination
   */
  async execute() {
    try {
      const Pet = mongoose.model('Pet');
      const skip = (this.options.page - 1) * this.options.limit;
      const sort = {
        [this.options.sortBy]: this.options.sortOrder === 'desc' ? -1 : 1,
      };

      // Build the query
      let query = Pet.find(this.query);

      // Add population
      if (this.options.populateShelter) {
        query = query.populate('shelter', this.options.populateFields);
      }

      // Add custom populate options
      this.populateOptions.forEach((populateOption) => {
        query = query.populate(populateOption);
      });

      // Execute query with pagination and sorting
      const [pets, total] = await Promise.all([
        query.sort(sort).skip(skip).limit(this.options.limit),
        Pet.countDocuments(this.query),
      ]);

      return {
        pets,
        pagination: {
          page: this.options.page,
          limit: this.options.limit,
          total,
          pages: Math.ceil(total / this.options.limit),
          hasNext: this.options.page * this.options.limit < total,
          hasPrev: this.options.page > 1,
        },
      };
    } catch (error) {
      logger.error('Error executing pet query:', error);
      throw error;
    }
  }

  /**
   * Get the built query object (for debugging)
   * @returns {Object} - The current query object
   */
  getQuery() {
    return {
      query: this.query,
      options: this.options,
      populateOptions: this.populateOptions,
    };
  }
}

/**
 * Factory function to create a PetQueryBuilder
 * @returns {PetQueryBuilder} - New query builder instance
 */
export function createPetQuery() {
  return new PetQueryBuilder();
}

/**
 * Quick search function using the query builder
 * @param {Object} searchCriteria - Search criteria
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Search results
 */
export async function quickPetSearch(searchCriteria, options = {}) {
  const queryBuilder = new PetQueryBuilder();

  // Apply search criteria
  if (searchCriteria.status)
    queryBuilder.where('status', searchCriteria.status);
  if (searchCriteria.type) queryBuilder.where('type', searchCriteria.type);
  if (searchCriteria.gender)
    queryBuilder.where('gender', searchCriteria.gender);
  if (searchCriteria.size) queryBuilder.where('size', searchCriteria.size);
  if (searchCriteria.search) queryBuilder.search(searchCriteria.search);
  if (
    searchCriteria.minPrice !== undefined ||
    searchCriteria.maxPrice !== undefined
  ) {
    queryBuilder.priceRange(searchCriteria.minPrice, searchCriteria.maxPrice);
  }
  if (
    searchCriteria.minAge !== undefined ||
    searchCriteria.maxAge !== undefined
  ) {
    queryBuilder.ageRange(searchCriteria.minAge, searchCriteria.maxAge);
  }
  if (searchCriteria.vaccinated !== undefined)
    queryBuilder.healthFilter('vaccinated', searchCriteria.vaccinated);
  if (searchCriteria.neutered !== undefined)
    queryBuilder.healthFilter('neutered', searchCriteria.neutered);
  if (searchCriteria.goodWith)
    queryBuilder.behaviorFilter('goodWith', searchCriteria.goodWith);

  // Apply options
  if (options.page && options.limit)
    queryBuilder.paginate(options.page, options.limit);
  if (options.sortBy) queryBuilder.sortBy(options.sortBy, options.sortOrder);
  if (options.populateShelter !== undefined)
    queryBuilder.populateShelter(options.populateShelter);

  return await queryBuilder.execute();
}

export default {
  PetQueryBuilder,
  createPetQuery,
  quickPetSearch,
};
