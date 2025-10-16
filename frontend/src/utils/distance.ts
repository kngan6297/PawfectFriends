/**
 * Calculate the distance between two geographic coordinates using the Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in miles
 */
export const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Parse location string to extract coordinates
 * @param location - Location string (e.g., "123 Main St, City, State")
 * @returns Coordinates array [latitude, longitude] or null if parsing fails
 */
export const parseLocation = (location: string): [number, number] | null => {
    // This is a simplified parser - in a real app, you'd use a geocoding service
    // For now, we'll return null to indicate we can't parse the location
    // In the future, this could integrate with Google Maps API, Mapbox, etc.
    return null;
};

/**
 * Check if a pet is within the specified distance from user location
 * @param petLocation - Pet's location string
 * @param userLocation - User's location coordinates
 * @param maxDistance - Maximum distance in miles
 * @returns true if pet is within distance, false otherwise
 */
export const isWithinDistance = (
    petLocation: string | undefined,
    userLocation: [number, number] | null,
    maxDistance: number | undefined
): boolean => {
    // If no max distance specified, allow all pets
    if (!maxDistance) return true;

    // If no user location, allow all pets
    if (!userLocation) return true;

    // If no pet location, allow the pet (can't determine distance)
    if (!petLocation) return true;

    // Try to parse pet location
    const petCoords = parseLocation(petLocation);
    if (!petCoords) return true; // If we can't parse, allow the pet

    const distance = calculateDistance(
        userLocation[0],
        userLocation[1],
        petCoords[0],
        petCoords[1]
    );

    return distance <= maxDistance;
};
