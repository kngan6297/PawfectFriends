import axios from "axios";
import { Pet } from "@/types/pet";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const petService = {
    addFavorite: (petId: string) => axios.post(`${API_URL}/api/users/favorite-pets/${petId}`),
    removeFavorite: (petId: string) => axios.delete(`${API_URL}/api/users/favorite-pets/${petId}`),
    getPetActivityLogs: (petId: string, params?: any) =>
        axios.get(`${API_URL}/api/activities/pet/${petId}`, { params }),
}; 