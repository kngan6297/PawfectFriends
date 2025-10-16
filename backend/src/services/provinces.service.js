import axios from 'axios';

const BASE = 'https://provinces.open-api.vn/api';

export const ProvincesAPI = {
  // Get list of provinces (depth=1 or 2 if needed)
  async getProvinces(version = 'v1', depth = 1) {
    const url = `${BASE}/${version}/?depth=${depth}`;
    const { data } = await axios.get(url);
    return data;
  },

  // Find district by province code
  async getDistrictsByProvince(code, version = 'v1') {
    const { data } = await axios.get(`${BASE}/${version}/p/${code}?depth=2`);
    return data?.districts ?? [];
  },

  // Find wards by district code
  async getWardsByDistrict(code, version = 'v1') {
    const { data } = await axios.get(`${BASE}/${version}/d/${code}?depth=2`);
    return data?.wards ?? [];
  },

  // Search (d/p/w): for example, search for district
  async searchDistrict(q, version = 'v1') {
    const { data } = await axios.get(
      `${BASE}/${version}/d/search/?q=${encodeURIComponent(q)}`
    );
    return data;
  },

  // Search provinces
  async searchProvince(q, version = 'v1') {
    const { data } = await axios.get(
      `${BASE}/${version}/p/search/?q=${encodeURIComponent(q)}`
    );
    return data;
  },

  // Search wards
  async searchWard(q, version = 'v1') {
    const { data } = await axios.get(
      `${BASE}/${version}/w/search/?q=${encodeURIComponent(q)}`
    );
    return data;
  },

  // Get specific province by code
  async getProvinceByCode(code, version = 'v1') {
    const { data } = await axios.get(`${BASE}/${version}/p/${code}`);
    return data;
  },

  // Get specific district by code
  async getDistrictByCode(code, version = 'v1') {
    const { data } = await axios.get(`${BASE}/${version}/d/${code}`);
    return data;
  },

  // Get specific ward by code
  async getWardByCode(code, version = 'v1') {
    const { data } = await axios.get(`${BASE}/${version}/w/${code}`);
    return data;
  },
};

// Map response → AddressSchema input
export function toAddressFromCodes({
  version = 'v1',
  province,
  district,
  ward,
  detail,
  postalCode,
}) {
  return {
    version,
    province: {
      code: province.code,
      name: province.name,
      codename: province.codename,
      division_type: province.division_type,
      phone_code: province.phone_code,
    },
    district: {
      code: district.code,
      name: district.name,
      codename: district.codename,
      division_type: district.division_type,
      province_code: district.province_code,
    },
    ward: {
      code: ward.code,
      name: ward.name,
      codename: ward.codename,
      division_type: ward.division_type,
      district_code: ward.district_code,
    },
    details: detail,
    postalCode,
    country: 'VN',
  };
}

// Helper function to build address from codes only
export async function buildAddressFromCodes({
  provinceCode,
  districtCode,
  wardCode,
  street,
  note,
  postalCode,
  version = 'v1',
}) {
  try {
    const [province, district, ward] = await Promise.all([
      ProvincesAPI.getProvinceByCode(provinceCode, version),
      ProvincesAPI.getDistrictByCode(districtCode, version),
      ProvincesAPI.getWardByCode(wardCode, version),
    ]);

    return toAddressFromCodes({
      version,
      province,
      district,
      ward,
      detail: { street, note },
      postalCode,
    });
  } catch (error) {
    throw new Error(`Failed to build address from codes: ${error.message}`);
  }
}

// Helper function to validate address codes
export async function validateAddressCodes({
  provinceCode,
  districtCode,
  wardCode,
  version = 'v1',
}) {
  try {
    const [province, district, ward] = await Promise.all([
      ProvincesAPI.getProvinceByCode(provinceCode, version),
      ProvincesAPI.getDistrictByCode(districtCode, version),
      ProvincesAPI.getWardByCode(wardCode, version),
    ]);

    // Validate relationships
    if (district.province_code !== province.code) {
      throw new Error('District does not belong to the specified province');
    }
    if (ward.district_code !== district.code) {
      throw new Error('Ward does not belong to the specified district');
    }

    return { province, district, ward, valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Helper function to get full address hierarchy
export async function getAddressHierarchy(wardCode, version = 'v1') {
  try {
    const ward = await ProvincesAPI.getWardByCode(wardCode, version);
    const district = await ProvincesAPI.getDistrictByCode(
      ward.district_code,
      version
    );
    const province = await ProvincesAPI.getProvinceByCode(
      district.province_code,
      version
    );

    return { province, district, ward };
  } catch (error) {
    throw new Error(`Failed to get address hierarchy: ${error.message}`);
  }
}

export default ProvincesAPI;
