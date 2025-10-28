import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { PetModel } from '../models/Pet';

const router = Router();
const petModel = new PetModel();

// Validation middleware
const validatePet = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Pet name must be between 1 and 100 characters'),
  body('species')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Species must be between 1 and 50 characters'),
  body('birthDate')
    .optional()
    .isISO8601()
    .withMessage('Birth date must be a valid ISO 8601 date')
];

const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Pet ID must be a positive integer')
];

// Helper function to handle validation errors
const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      }
    });
    return true;
  }
  return false;
};

// GET /api/pets - Get all pets
router.get('/', (req: Request, res: Response) => {
  try {
    const pets = petModel.findAll();
    return res.json(pets);
  } catch (error) {
    console.error('Error fetching pets:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to fetch pets',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// GET /api/pets/:id - Get pet by ID
router.get('/:id', validateId, (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const id = parseInt(req.params.id);
    const pet = petModel.findById(id);
    
    if (!pet) {
      return res.status(404).json({
        error: {
          message: 'Pet not found',
          code: 'PET_NOT_FOUND'
        }
      });
    }
    
    return res.json(pet);
  } catch (error) {
    console.error('Error fetching pet:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to fetch pet',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// POST /api/pets - Create new pet
router.post('/', validatePet, (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const { name, species, birthDate } = req.body;
    const pet = petModel.create({ name, species, birthDate });
    return res.status(201).json(pet);
  } catch (error) {
    console.error('Error creating pet:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to create pet',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// PUT /api/pets/:id - Update pet
router.put('/:id', [...validateId, ...validatePet], (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const id = parseInt(req.params.id);
    const { name, species, birthDate } = req.body;
    
    const updatedPet = petModel.update(id, { name, species, birthDate });
    
    if (!updatedPet) {
      return res.status(404).json({
        error: {
          message: 'Pet not found',
          code: 'PET_NOT_FOUND'
        }
      });
    }
    
    return res.json(updatedPet);
  } catch (error) {
    console.error('Error updating pet:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to update pet',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// DELETE /api/pets/:id - Delete pet
router.delete('/:id', validateId, (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const id = parseInt(req.params.id);
    const deleted = petModel.delete(id);
    
    if (!deleted) {
      return res.status(404).json({
        error: {
          message: 'Pet not found',
          code: 'PET_NOT_FOUND'
        }
      });
    }
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting pet:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to delete pet',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

export default router;