import { api, endpoints } from './api';
import { Pet } from "@/types/pet";

export const petService = {
    addFavorite: (petId: string) => api.post(endpoints.user.toggleFavorite(petId)),
    removeFavorite: (petId: string) => api.delete(endpoints.user.toggleFavorite(petId)),
    getPetActivityLogs: (petId: string, params?: any) =>
        api.get(`/activities/pet/${petId}`, { params }),
}; 