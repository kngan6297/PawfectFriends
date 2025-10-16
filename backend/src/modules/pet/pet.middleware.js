import { ForbiddenError } from '../../utils/errors.js';
import logger from '../../utils/logger.js';
import { Pet } from './pet.model.js';

export const verifyPetOwnership = async (req, res, next) => {
  try {
    // Validate that petId is a valid ObjectId
    const mongoose = await import('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid pet ID format',
      });
    }

    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return next(new Error('Pet not found'));
    }

    if (pet.shelter.toString() !== req.user._id.toString()) {
      return next(new ForbiddenError('Not authorized to modify this pet'));
    }

    req.pet = pet;
    next();
  } catch (error) {
    next(error);
  }
};

export const validatePetStatus = async (req, res, next) => {
  try {
    // Validate that petId is a valid ObjectId
    const mongoose = await import('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid pet ID format',
      });
    }

    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({
        status: 'error',
        message: 'Pet not found',
      });
    }

    if (pet.status !== 'adoptable') {
      return res.status(400).json({
        status: 'error',
        message: 'This pet is not available for adoption',
      });
    }

    req.pet = pet;
    next();
  } catch (error) {
    logger.error('Error validating pet status:', error);
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};
