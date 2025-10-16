import Joi from 'joi';

// Address validation schemas for Vietnam administrative structure

// Basic address validation (for optional user profiles)
export const addressOptionalSchema = Joi.object({
  version: Joi.string().valid('v1', 'v2').default('v1'),
  province: Joi.object({
    code: Joi.number().required(),
    name: Joi.string().required(),
    codename: Joi.string().allow(''),
    division_type: Joi.string().allow(''),
    phone_code: Joi.number().optional(),
  }).required(),
  district: Joi.object({
    code: Joi.number().required(),
    name: Joi.string().required(),
    codename: Joi.string().allow(''),
    division_type: Joi.string().allow(''),
    province_code: Joi.number().required(),
  }).required(),
  ward: Joi.object({
    code: Joi.number().required(),
    name: Joi.string().required(),
    codename: Joi.string().allow(''),
    division_type: Joi.string().allow(''),
    district_code: Joi.number().required(),
  }).required(),
  details: Joi.object({
    street: Joi.string().allow(''),
    note: Joi.string().allow(''),
  }).default({}),
  postalCode: Joi.string().allow(''),
  country: Joi.string().valid('VN').default('VN'),
  formatted: Joi.string().allow(''),
})
  .optional()
  .custom((v, helpers) => {
    if (!v) return v; // Allow undefined/null for optional addresses

    if (v.district.province_code !== v.province.code) {
      return helpers.error('any.invalid', {
        message: 'district.province_code mismatch',
      });
    }
    if (v.ward.district_code !== v.district.code) {
      return helpers.error('any.invalid', {
        message: 'ward.district_code mismatch',
      });
    }
    return v;
  });

// Required address validation (for shelters)
export const addressRequiredSchema = Joi.object({
  version: Joi.string().valid('v1', 'v2').default('v1'),
  province: Joi.object({
    code: Joi.number().required(),
    name: Joi.string().required(),
    codename: Joi.string().allow(''),
    division_type: Joi.string().allow(''),
    phone_code: Joi.number().optional(),
  }).required(),
  district: Joi.object({
    code: Joi.number().required(),
    name: Joi.string().required(),
    codename: Joi.string().allow(''),
    division_type: Joi.string().allow(''),
    province_code: Joi.number().required(),
  }).required(),
  ward: Joi.object({
    code: Joi.number().required(),
    name: Joi.string().required(),
    codename: Joi.string().allow(''),
    division_type: Joi.string().allow(''),
    district_code: Joi.number().required(),
  }).required(),
  details: Joi.object({
    street: Joi.string().allow(''),
    note: Joi.string().allow(''),
  }).default({}),
  postalCode: Joi.string().allow(''),
  country: Joi.string().valid('VN').default('VN'),
  formatted: Joi.string().allow(''),
})
  .required()
  .custom((v, helpers) => {
    if (v.district.province_code !== v.province.code) {
      return helpers.error('any.invalid', {
        message: 'district.province_code mismatch',
      });
    }
    if (v.ward.district_code !== v.district.code) {
      return helpers.error('any.invalid', {
        message: 'ward.district_code mismatch',
      });
    }
    return v;
  });

// Address codes validation (for API input)
export const addressCodesSchema = Joi.object({
  provinceCode: Joi.number().required(),
  districtCode: Joi.number().required(),
  wardCode: Joi.number().required(),
  street: Joi.string().allow('').optional(),
  note: Joi.string().allow('').optional(),
  postalCode: Joi.string().allow('').optional(),
  version: Joi.string().valid('v1', 'v2').default('v1').optional(),
});

// Address search validation
export const addressSearchSchema = Joi.object({
  query: Joi.string().min(1).max(100).required(),
  type: Joi.string().valid('province', 'district', 'ward').required(),
  version: Joi.string().valid('v1', 'v2').default('v1').optional(),
});

// Address hierarchy validation
export const addressHierarchySchema = Joi.object({
  wardCode: Joi.number().required(),
  version: Joi.string().valid('v1', 'v2').default('v1').optional(),
});

// Address update validation (for partial updates)
export const addressUpdateSchema = Joi.object({
  version: Joi.string().valid('v1', 'v2').optional(),
  province: Joi.object({
    code: Joi.number().optional(),
    name: Joi.string().optional(),
    codename: Joi.string().allow('').optional(),
    division_type: Joi.string().allow('').optional(),
    phone_code: Joi.number().optional(),
  }).optional(),
  district: Joi.object({
    code: Joi.number().optional(),
    name: Joi.string().optional(),
    codename: Joi.string().allow('').optional(),
    division_type: Joi.string().allow('').optional(),
    province_code: Joi.number().optional(),
  }).optional(),
  ward: Joi.object({
    code: Joi.number().optional(),
    name: Joi.string().optional(),
    codename: Joi.string().allow('').optional(),
    division_type: Joi.string().allow('').optional(),
    district_code: Joi.number().optional(),
  }).optional(),
  details: Joi.object({
    street: Joi.string().allow('').optional(),
    note: Joi.string().allow('').optional(),
  }).optional(),
  postalCode: Joi.string().allow('').optional(),
  country: Joi.string().valid('VN').optional(),
  formatted: Joi.string().allow('').optional(),
})
  .min(1)
  .custom((v, helpers) => {
    // Only validate relationships if all three levels are provided
    if (v.province && v.district && v.ward) {
      if (v.district.province_code !== v.province.code) {
        return helpers.error('any.invalid', {
          message: 'district.province_code mismatch',
        });
      }
      if (v.ward.district_code !== v.district.code) {
        return helpers.error('any.invalid', {
          message: 'ward.district_code mismatch',
        });
      }
    }
    return v;
  });

// Export all schemas
export const addressValidationSchemas = {
  addressOptionalSchema,
  addressRequiredSchema,
  addressCodesSchema,
  addressSearchSchema,
  addressHierarchySchema,
  addressUpdateSchema,
};

export default addressValidationSchemas;
