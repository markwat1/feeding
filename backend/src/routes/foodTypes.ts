import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { FoodTypeModel } from '../models/FoodType';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();
const foodTypeModel = new FoodTypeModel();

// Validation middleware
const validateFoodType = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Food type name must be between 1 and 100 characters'),
  body('brand')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Brand must be at most 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be at most 500 characters')
];

const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Food type ID must be a positive integer')
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

// GET /api/food-types - Get all food types
router.get('/', (req: Request, res: Response) => {
  try {
    const foodTypes = foodTypeModel.findAll();
    return sendSuccess(res, foodTypes);
  } catch (error) {
    console.error('Error fetching food types:', error);
    return sendError(res, 'Failed to fetch food types', 'INTERNAL_ERROR', 500);
  }
});

// GET /api/food-types/:id - Get food type by ID
router.get('/:id', validateId, (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const id = parseInt(req.params.id);
    const foodType = foodTypeModel.findById(id);
    
    if (!foodType) {
      return sendError(res, 'Food type not found', 'FOOD_TYPE_NOT_FOUND', 404);
    }
    
    return sendSuccess(res, foodType);
  } catch (error) {
    console.error('Error fetching food type:', error);
    return sendError(res, 'Failed to fetch food type', 'INTERNAL_ERROR', 500);
  }
});

// POST /api/food-types - Create new food type
router.post('/', validateFoodType, (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const { name, brand, description } = req.body;
    const foodType = foodTypeModel.create({ name, brand, description });
    return sendSuccess(res, foodType, 'Food type created successfully', 201);
  } catch (error) {
    console.error('Error creating food type:', error);
    return sendError(res, 'Failed to create food type', 'INTERNAL_ERROR', 500);
  }
});

// PUT /api/food-types/:id - Update food type
router.put('/:id', [...validateId, ...validateFoodType], (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const id = parseInt(req.params.id);
    const { name, brand, description } = req.body;
    
    const updatedFoodType = foodTypeModel.update(id, { name, brand, description });
    
    if (!updatedFoodType) {
      return sendError(res, 'Food type not found', 'FOOD_TYPE_NOT_FOUND', 404);
    }
    
    return sendSuccess(res, updatedFoodType, 'Food type updated successfully');
  } catch (error) {
    console.error('Error updating food type:', error);
    return sendError(res, 'Failed to update food type', 'INTERNAL_ERROR', 500);
  }
});

// DELETE /api/food-types/:id - Delete food type
router.delete('/:id', validateId, (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const id = parseInt(req.params.id);
    const deleted = foodTypeModel.delete(id);
    
    if (!deleted) {
      return sendError(res, 'Food type not found', 'FOOD_TYPE_NOT_FOUND', 404);
    }
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting food type:', error);
    
    // Check if it's a foreign key constraint error
    if (error instanceof Error && error.message.includes('FOREIGN KEY constraint failed')) {
      return sendError(res, 'この餌の種類は餌やりスケジュールで使用されているため削除できません', 'FOREIGN_KEY_CONSTRAINT', 400);
    }
    
    return sendError(res, 'Failed to delete food type', 'INTERNAL_ERROR', 500);
  }
});

export default router;