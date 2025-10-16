import { useState, useEffect, useCallback } from 'react';
import { vietnamProvincesApi, Province, District, Ward } from '../services/vietnamProvincesApi';

export interface AddressData {
    province: Province | null;
    district: District | null;
    ward: Ward | null;
}

export interface UseVietnamAddressReturn {
    // Data
    provinces: Province[];
    districts: District[];
    wards: Ward[];
    selectedAddress: AddressData;

    // Loading states
    loadingProvinces: boolean;
    loadingDistricts: boolean;
    loadingWards: boolean;

    // Error states
    error: string | null;

    // Actions
    setProvince: (province: Province | null) => void;
    setDistrict: (district: District | null) => void;
    setWard: (ward: Ward | null) => void;
    resetAddress: () => void;

    // Search functions
    searchProvinces: (query: string) => Promise<Province[]>;
    searchDistricts: (query: string) => Promise<District[]>;
    searchWards: (query: string) => Promise<Ward[]>;
}

export const useVietnamAddress = (): UseVietnamAddressReturn => {
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<AddressData>({
        province: null,
        district: null,
        ward: null,
    });

    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingWards, setLoadingWards] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load provinces on mount
    useEffect(() => {
        const loadProvinces = async () => {
            setLoadingProvinces(true);
            setError(null);

            try {
                const data = await vietnamProvincesApi.getProvinces();
                console.log('Provinces loaded:', data);
                setProvinces(Array.isArray(data) ? data : []);
            } catch (err) {
                setError('Failed to load provinces');
                console.error('Error loading provinces:', err);
                setProvinces([]);
            } finally {
                setLoadingProvinces(false);
            }
        };

        loadProvinces();
    }, []);

    // Load districts when province changes
    const setProvince = useCallback((province: Province | null) => {
        setSelectedAddress(prev => ({
            ...prev,
            province,
            district: null,
            ward: null,
        }));

        if (province) {
            setLoadingDistricts(true);
            setError(null);

            vietnamProvincesApi.getDistrictsByProvince(province.code)
                .then(data => {
                    console.log('Districts loaded:', data);
                    // The API returns a province object with districts array
                    const districts = data?.districts || [];
                    setDistricts(Array.isArray(districts) ? districts : []);
                    setWards([]);
                })
                .catch(err => {
                    setError('Failed to load districts');
                    console.error('Error loading districts:', err);
                    setDistricts([]);
                })
                .finally(() => {
                    setLoadingDistricts(false);
                });
        } else {
            setDistricts([]);
            setWards([]);
        }
    }, []);

    // Load wards when district changes
    const setDistrict = useCallback((district: District | null) => {
        setSelectedAddress(prev => ({
            ...prev,
            district,
            ward: null,
        }));

        if (district) {
            setLoadingWards(true);
            setError(null);

            vietnamProvincesApi.getWardsByDistrict(district.code)
                .then(data => {
                    console.log('Wards loaded:', data);
                    // The API returns a district object with wards array
                    const wards = data?.wards || [];
                    setWards(Array.isArray(wards) ? wards : []);
                })
                .catch(err => {
                    setError('Failed to load wards');
                    console.error('Error loading wards:', err);
                    setWards([]);
                })
                .finally(() => {
                    setLoadingWards(false);
                });
        } else {
            setWards([]);
        }
    }, []);

    const setWard = useCallback((ward: Ward | null) => {
        setSelectedAddress(prev => ({
            ...prev,
            ward,
        }));
    }, []);

    const resetAddress = useCallback(() => {
        setSelectedAddress({
            province: null,
            district: null,
            ward: null,
        });
        setDistricts([]);
        setWards([]);
    }, []);

    // Search functions
    const searchProvinces = useCallback(async (query: string): Promise<Province[]> => {
        if (!query.trim()) return provinces;

        try {
            return await vietnamProvincesApi.searchProvinces(query);
        } catch (err) {
            console.error('Error searching provinces:', err);
            return [];
        }
    }, [provinces]);

    const searchDistricts = useCallback(async (query: string): Promise<District[]> => {
        if (!query.trim()) return districts;

        try {
            return await vietnamProvincesApi.searchDistricts(query);
        } catch (err) {
            console.error('Error searching districts:', err);
            return [];
        }
    }, [districts]);

    const searchWards = useCallback(async (query: string): Promise<Ward[]> => {
        if (!query.trim()) return wards;

        try {
            return await vietnamProvincesApi.searchWards(query);
        } catch (err) {
            console.error('Error searching wards:', err);
            return [];
        }
    }, [wards]);

    return {
        provinces,
        districts,
        wards,
        selectedAddress,
        loadingProvinces,
        loadingDistricts,
        loadingWards,
        error,
        setProvince,
        setDistrict,
        setWard,
        resetAddress,
        searchProvinces,
        searchDistricts,
        searchWards,
    };
};
