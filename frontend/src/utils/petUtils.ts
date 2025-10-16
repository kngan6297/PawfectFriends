/**
 * Safe utility function to extract goodWith types from pet behavior data
 * Handles cases where goodWith might be undefined, null, or contain invalid items
 */
export const getGoodWithTypes = (goodWith: any[] | undefined): string[] => {
    if (!goodWith || !Array.isArray(goodWith)) {
        return [];
    }

    return goodWith
        .filter((item) => item && typeof item === 'object' && item.type)
        .map((item) => item.type)
        .filter((type) => type && typeof type === 'string');
};

/**
 * Safe utility function to get goodWith types as a formatted string
 */
export const getGoodWithTypesString = (goodWith: any[] | undefined): string => {
    const types = getGoodWithTypes(goodWith);
    return types.length > 0 ? types.join(", ") : "Not specified";
};

/**
 * Get the best available photo URL from a pet's photos array
 * Prioritizes different photo sizes based on context
 */
export const getBestPetPhotoUrl = (
    photos: any[] | undefined,
    index: number = 0,
    size: 'small' | 'medium' | 'large' | 'full' = 'medium'
): string => {
    if (!photos || photos.length === 0) {
        return '';
    }

    const photo = photos[index] || photos[0];

    if (!photo) {
        return '';
    }

    // Check if photo is a string (legacy format)
    if (typeof photo === 'string') {
        return proxyPetImageUrl(photo);
    }

    // Check if photo has a url property
    if (photo.url) {
        // Prioritize based on requested size
        let url = '';
        switch (size) {
            case 'small':
                url = photo.small || photo.medium || photo.url || photo.large || photo.full;
                break;
            case 'medium':
                url = photo.medium || photo.url || photo.large || photo.small || photo.full;
                break;
            case 'large':
                url = photo.large || photo.full || photo.url || photo.medium || photo.small;
                break;
            case 'full':
                url = photo.full || photo.large || photo.url || photo.medium || photo.small;
                break;
            default:
                url = photo.url || photo.medium || photo.large || photo.small || photo.full;
        }
        return proxyPetImageUrl(url);
    }

    // If no url property, try other possible properties
    const possibleUrls = [
        photo.full,
        photo.large,
        photo.medium,
        photo.small,
        photo.url
    ].filter(url => url && typeof url === 'string');

    if (possibleUrls.length > 0) {
        return proxyPetImageUrl(possibleUrls[0]);
    }

    return '';
};

/**
 * Get a fallback placeholder URL for a pet
 */
export const getPetPlaceholderUrl = (
    petName: string = 'Pet',
    petType: string = 'pet',
    size: { width: number; height: number } = { width: 400, height: 300 }
): string => {
    const encodedName = encodeURIComponent(petName);
    const encodedType = encodeURIComponent(petType);
    return `https://placehold.co/${size.width}x${size.height}?text=${encodedName}+(${encodedType})`;
};

/**
 * Get all available photo URLs for a pet
 */
export const getAllPetPhotoUrls = (photos: any[] | undefined): string[] => {
    if (!photos || photos.length === 0) {
        return [];
    }

    return photos
        .map(photo => {
            const url = photo.url || photo.medium || photo.large || photo.small || photo.full;
            return url ? proxyPetImageUrl(url) : '';
        })
        .filter(url => url && url.trim() !== '');
};

/**
 * Proxy a pet image URL through our backend to avoid CORS issues
 */
export const proxyPetImageUrl = (originalUrl: string): string => {
    console.log('proxyPetImageUrl called with:', originalUrl);

    if (!originalUrl) {
        console.log('No original URL provided');
        return '';
    }

    // If it's already a proxy URL, return as is
    if (originalUrl.includes('/api/pets/proxy/image')) {
        console.log('URL is already a proxy URL, returning as is');
        return originalUrl;
    }

    // If it's a Petfinder URL, proxy it through our backend
    if (originalUrl.includes('cloudfront.net/photos/pets/')) {
        const encodedUrl = encodeURIComponent(originalUrl);
        const proxyUrl = `/api/pets/proxy/image?imageUrl=${encodedUrl}`;
        console.log('Proxying Petfinder URL:', proxyUrl);
        return proxyUrl;
    }

    // For other URLs, return as is
    console.log('Returning original URL as is:', originalUrl);
    return originalUrl;
}; 