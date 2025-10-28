import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { PetModel } from '../models/Pet';
import { sendSuccess, sendError } from '../utils/response';

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
    sendError(res, 'Validation failed', 'VALIDATION_ERROR', 400, errors.array());
    return true;
  }
  return false;
};

// GET /api/pets - Get all pets
router.get('/', (req: Request, res: Response) => {
  try {
    const pets = petModel.findAll();
    return sendSuccess(res, pets);
  } catch (error) {
    console.error('Error fetching pets:', error);
    return sendError(res, 'Failed to fetch pets', 'INTERNAL_ERROR', 500);
  }
});

// GET /api/pets/:id - Get pet by ID
router.get('/:id', validateId, (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const id = parseInt(req.params.id);
    const pet = petModel.findById(id);
    
    if (!pet) {
      return sendError(res, 'Pet not found', 'PET_NOT_FOUND', 404);
    }
    
    return sendSuccess(res, pet);
  } catch (error) {
    console.error('Error fetching pet:', error);
    return sendError(res, 'Failed to fetch pet', 'INTERNAL_ERROR', 500);
  }
});

// POST /api/pets - Create new pet
router.post('/', validatePet, (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const { name, species, birthDate } = req.body;
    const pet = petModel.create({ name, species, birthDate });
    return sendSuccess(res, pet, 'Pet created successfully', 201);
  } catch (error) {
    console.error('Error creating pet:', error);
    return sendError(res, 'Failed to create pet', 'INTERNAL_ERROR', 500);
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
      return sendError(res, 'Pet not found', 'PET_NOT_FOUND', 404);
    }
    
    return sendSuccess(res, updatedPet, 'Pet updated successfully');
  } catch (error) {
    console.error('Error updating pet:', error);
    return sendError(res, 'Failed to update pet', 'INTERNAL_ERROR', 500);
  }
});

// DELETE /api/pets/:id - Delete pet
router.delete('/:id', validateId, (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const id = parseInt(req.params.id);
    const deleted = petModel.delete(id);
    
    if (!deleted) {
      return sendError(res, 'Pet not found', 'PET_NOT_FOUND', 404);
    }
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting pet:', error);
    return sendError(res, 'Failed to delete pet', 'INTERNAL_ERROR', 500);
  }
});

export default router;