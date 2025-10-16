// Vietnam Provinces API service
// Documentation: https://provinces.open-api.vn/

export interface Province {
    name: string;
    code: number;
    division_type: string;
    phone_code: number;
    codename: string;
    districts?: District[];
}

export interface District {
    name: string;
    code: number;
    codename: string;
    division_type: string;
    province_code: number;
    wards?: Ward[];
}

export interface Ward {
    name: string;
    code: number;
    codename: string;
    division_type: string;
    district_code: number;
}

const API_BASE_URL = 'https://provinces.open-api.vn/api/v1';

class VietnamProvincesApi {
    private async fetchData<T>(endpoint: string): Promise<T> {
        try {
            console.log(`Fetching: ${API_BASE_URL}${endpoint}`);
            const response = await fetch(`${API_BASE_URL}${endpoint}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(`API Response for ${endpoint}:`, data);
            return data;
        } catch (error) {
            console.error('Vietnam Provinces API error:', error);
            throw error;
        }
    }

    // Get all provinces with districts and wards
    async getProvincesWithDistrictsAndWards(): Promise<Province[]> {
        return this.fetchData<Province[]>('/?depth=3');
    }

    // Get all provinces with districts only
    async getProvincesWithDistricts(): Promise<Province[]> {
        return this.fetchData<Province[]>('/?depth=2');
    }

    // Get all provinces only
    async getProvinces(): Promise<Province[]> {
        return this.fetchData<Province[]>('/?depth=1');
    }

    // Get districts by province code
    async getDistrictsByProvince(provinceCode: number): Promise<District[]> {
        return this.fetchData<District[]>(`/p/${provinceCode}?depth=2`);
    }

    // Get wards by district code
    async getWardsByDistrict(districtCode: number): Promise<Ward[]> {
        return this.fetchData<Ward[]>(`/d/${districtCode}?depth=2`);
    }

    // Search provinces
    async searchProvinces(query: string): Promise<Province[]> {
        return this.fetchData<Province[]>(`/p/search/?q=${encodeURIComponent(query)}`);
    }

    // Search districts
    async searchDistricts(query: string): Promise<District[]> {
        return this.fetchData<District[]>(`/d/search/?q=${encodeURIComponent(query)}`);
    }

    // Search wards
    async searchWards(query: string): Promise<Ward[]> {
        return this.fetchData<Ward[]>(`/w/search/?q=${encodeURIComponent(query)}`);
    }

    // Get province by code
    async getProvinceByCode(code: number): Promise<Province> {
        return this.fetchData<Province>(`/p/${code}`);
    }

    // Get district by code
    async getDistrictByCode(code: number): Promise<District> {
        return this.fetchData<District>(`/d/${code}`);
    }

    // Get ward by code
    async getWardByCode(code: number): Promise<Ward> {
        return this.fetchData<Ward>(`/w/${code}`);
    }
}

export const vietnamProvincesApi = new VietnamProvincesApi();
