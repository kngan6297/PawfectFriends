import { useAuth } from '@/context/AuthContext';

export const useFavoritePets = () => {
    const {
        favoritePets,
        favoritePetIds,
        isFavoritesLoading,
        toggleFavoritePet,
        isPetFavorited,
        refreshFavoritePets
    } = useAuth();

    return {
        favoritePets,
        favoritePetIds,
        isFavoritesLoading,
        toggleFavoritePet,
        isPetFavorited,
        refreshFavoritePets,
    };
}; 