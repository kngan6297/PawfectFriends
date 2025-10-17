import { catchAsync } from '../../middleware/async.js';
import logger from '../../utils/logger.js';
import { User } from '../user/user.model.js';
import { Pet } from '../pet/pet.model.js';
import { sanitizePetObject } from '../../utils/petSanitizer.js';

const favoritePet = catchAsync(async (req, res) => {
  try {
    const { petId } = req.params;
    const userId = req.user._id;

    // Check if pet exists
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        status: 'error',
        message: 'Pet not found',
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Check if pet is already favorited
    if (user.favoritePets.includes(petId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Pet is already favorited',
      });
    }

    // Add pet to user's favorite pets
    user.favoritePets.push(petId);
    await user.save();

    // Increment pet's favorites count
    pet.favorites += 1;

    // Sanitize pet data before saving to ensure only valid fields are included
    const sanitizedPetData = sanitizePetObject(pet.toObject());
    Object.assign(pet, sanitizedPetData);

    await pet.save();

    res.status(200).json({
      success: true,
      message: 'Pet favorited successfully',
    });
  } catch (error) {
    logger.error('Error favoriting pet:', error);
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
});

const unfavoritePet = catchAsync(async (req, res) => {
  try {
    const { petId } = req.params;
    const userId = req.user._id;

    // Check if pet exists
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        status: 'error',
        message: 'Pet not found',
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Check if pet is favorited
    if (!user.favoritePets.includes(petId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Pet is not favorited',
      });
    }

    // Remove pet from user's favorite pets
    user.favoritePets = user.favoritePets.filter(
      (id) => id.toString() !== petId
    );
    await user.save();

    // Decrement pet's favorites count
    pet.favorites = Math.max(0, pet.favorites - 1);

    // Sanitize pet data before saving to ensure only valid fields are included
    const sanitizedPetData = sanitizePetObject(pet.toObject());
    Object.assign(pet, sanitizedPetData);

    await pet.save();

    res.status(200).json({
      success: true,
      message: 'Pet unfavorited successfully',
    });
  } catch (error) {
    logger.error('Error unfavoriting pet:', error);
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
});

// Transform function to map _id to id and create breeds object for frontend compatibility
const transformPet = (pet) => {
  if (!pet) return null;
  const petObj = pet.toObject ? pet.toObject() : pet;
  return {
    ...petObj,
    id: petObj._id,
    _id: undefined,
    // Create breeds object for frontend compatibility
    breeds: {
      primary: petObj.breed || 'Unknown Breed',
      secondary: null,
      mixed: false,
      unknown: false,
    },
  };
};

const getFavoritePets = catchAsync(async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user with populated favorite pets
    const user = await User.findById(userId).populate('favoritePets');
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Transform pets to include breeds object
    const transformedPets = user.favoritePets.map(transformPet);

    res.status(200).json({
      success: true,
      data: transformedPets,
    });
  } catch (error) {
    logger.error('Error getting favorite pets:', error);
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
});

const checkFavoriteStatus = catchAsync(async (req, res) => {
  try {
    const { petId } = req.params;
    const userId = req.user._id;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    const isFavorited = user.favoritePets.includes(petId);

    res.status(200).json({
      success: true,
      data: { isFavorited },
    });
  } catch (error) {
    logger.error('Error checking favorite status:', error);
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
});

const toggleFavorite = catchAsync(async (req, res) => {
  try {
    const { petId } = req.params;
    const userId = req.user._id;

    // Check if pet exists
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        status: 'error',
        message: 'Pet not found',
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Check if pet is already favorited
    const isFavorited = user.favoritePets.includes(petId);

    if (isFavorited) {
      // Remove from favorites
      user.favoritePets = user.favoritePets.filter(
        (id) => id.toString() !== petId
      );
      pet.favorites = Math.max(0, pet.favorites - 1);
    } else {
      // Add to favorites
      user.favoritePets.push(petId);
      pet.favorites += 1;
    }

    // Save user changes
    await user.save();

    // Sanitize pet data before saving to ensure only valid fields are included
    const sanitizedPetData = sanitizePetObject(pet.toObject());
    Object.assign(pet, sanitizedPetData);
    await pet.save();

    res.status(200).json({
      success: true,
      message: isFavorited
        ? 'Pet removed from favorites'
        : 'Pet added to favorites',
      data: { isFavorited: !isFavorited },
    });
  } catch (error) {
    logger.error('Error toggling favorite:', error);
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
});

const favoriteController = {
  favoritePet,
  unfavoritePet,
  getFavoritePets,
  checkFavoriteStatus,
  toggleFavorite,
};

export {
  favoritePet,
  unfavoritePet,
  getFavoritePets,
  checkFavoriteStatus,
  toggleFavorite,
  favoriteController,
};
