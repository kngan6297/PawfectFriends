import axios from 'axios';

const BASE = 'https://provinces.open-api.vn/api';

// Type definitions
export interface Province {
    code: number;
    name: string;
    codename: string;
    division_type: string;
    phone_code: number;
}

export interface District {
    code: number;
    name: string;
    codename: string;
    division_type: string;
    province_code: number;
}

export interface Ward {
    code: number;
    name: string;
    codename: string;
    division_type: string;
    district_code: number;
}

export interface AddressDetail {
    street?: string;
    note?: string;
}

export interface AddressFromCodesInput {
    version?: 'v1' | 'v2';
    province: Province;
    district: District;
    ward: Ward;
    detail?: AddressDetail;
    postalCode?: string;
}

export interface BuildAddressInput {
    provinceCode: number;
    districtCode: number;
    wardCode: number;
    street?: string;
    note?: string;
    postalCode?: string;
    version?: 'v1' | 'v2';
}

export interface ValidateAddressInput {
    provinceCode: number;
    districtCode: number;
    wardCode: number;
    version?: 'v1' | 'v2';
}

export interface ValidateAddressResult {
    valid: boolean;
    error?: string;
    province?: Province;
    district?: District;
    ward?: Ward;
}

export const ProvincesAPI = {
    // Get list of provinces (depth=1 or 2 if needed)
    async getProvinces(version: 'v1' | 'v2' = 'v1', depth: number = 1): Promise<Province[]> {
        const url = `${BASE}/${version}/?depth=${depth}`;
        const { data } = await axios.get<Province[]>(url);
        return data;
    },

    // Find district by province code
    async getDistrictsByProvince(code: number, version: 'v1' | 'v2' = 'v1'): Promise<District[]> {
        const { data } = await axios.get<{ districts: District[] }>(`${BASE}/${version}/p/${code}?depth=2`);
        return data?.districts ?? [];
    },

    // Find wards by district code
    async getWardsByDistrict(code: number, version: 'v1' | 'v2' = 'v1'): Promise<Ward[]> {
        const { data } = await axios.get<{ wards: Ward[] }>(`${BASE}/${version}/d/${code}?depth=2`);
        return data?.wards ?? [];
    },

    // Search (d/p/w): for example, search for district
    async searchDistrict(q: string, version: 'v1' | 'v2' = 'v1'): Promise<District[]> {
        const { data } = await axios.get<District[]>(`${BASE}/${version}/d/search/?q=${encodeURIComponent(q)}`);
        return data;
    },

    // Search provinces
    async searchProvince(q: string, version: 'v1' | 'v2' = 'v1'): Promise<Province[]> {
        const { data } = await axios.get<Province[]>(`${BASE}/${version}/p/search/?q=${encodeURIComponent(q)}`);
        return data;
    },

    // Search wards
    async searchWard(q: string, version: 'v1' | 'v2' = 'v1'): Promise<Ward[]> {
        const { data } = await axios.get<Ward[]>(`${BASE}/${version}/w/search/?q=${encodeURIComponent(q)}`);
        return data;
    },

    // Get specific province by code
    async getProvinceByCode(code: number, version: 'v1' | 'v2' = 'v1'): Promise<Province> {
        const { data } = await axios.get<Province>(`${BASE}/${version}/p/${code}`);
        return data;
    },

    // Get specific district by code
    async getDistrictByCode(code: number, version: 'v1' | 'v2' = 'v1'): Promise<District> {
        const { data } = await axios.get<District>(`${BASE}/${version}/d/${code}`);
        return data;
    },

    // Get specific ward by code
    async getWardByCode(code: number, version: 'v1' | 'v2' = 'v1'): Promise<Ward> {
        const { data } = await axios.get<Ward>(`${BASE}/${version}/w/${code}`);
        return data;
    }
};

// Map response → AddressSchema input
export function toAddressFromCodes({
    version = 'v1',
    province,
    district,
    ward,
    detail,
    postalCode
}: AddressFromCodesInput) {
    return {
        version,
        province: {
            code: province.code,
            name: province.name,
            codename: province.codename,
            division_type: province.division_type,
            phone_code: province.phone_code
        },
        district: {
            code: district.code,
            name: district.name,
            codename: district.codename,
            division_type: district.division_type,
            province_code: district.province_code
        },
        ward: {
            code: ward.code,
            name: ward.name,
            codename: ward.codename,
            division_type: ward.division_type,
            district_code: ward.district_code
        },
        details: detail,
        postalCode,
        country: 'VN'
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
    version = 'v1'
}: BuildAddressInput) {
    try {
        const [province, district, ward] = await Promise.all([
            ProvincesAPI.getProvinceByCode(provinceCode, version),
            ProvincesAPI.getDistrictByCode(districtCode, version),
            ProvincesAPI.getWardByCode(wardCode, version)
        ]);

        return toAddressFromCodes({
            version,
            province,
            district,
            ward,
            detail: { street, note },
            postalCode
        });
    } catch (error) {
        throw new Error(`Failed to build address from codes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Helper function to validate address codes
export async function validateAddressCodes({
    provinceCode,
    districtCode,
    wardCode,
    version = 'v1'
}: ValidateAddressInput): Promise<ValidateAddressResult> {
    try {
        const [province, district, ward] = await Promise.all([
            ProvincesAPI.getProvinceByCode(provinceCode, version),
            ProvincesAPI.getDistrictByCode(districtCode, version),
            ProvincesAPI.getWardByCode(wardCode, version)
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
        return {
            valid: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// Helper function to get full address hierarchy
export async function getAddressHierarchy(wardCode: number, version: 'v1' | 'v2' = 'v1') {
    try {
        const ward = await ProvincesAPI.getWardByCode(wardCode, version);
        const district = await ProvincesAPI.getDistrictByCode(ward.district_code, version);
        const province = await ProvincesAPI.getProvinceByCode(district.province_code, version);

        return { province, district, ward };
    } catch (error) {
        throw new Error(`Failed to get address hierarchy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export default ProvincesAPI;
