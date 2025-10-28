import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { FoodTypeModel } from '../models/FoodType';

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

// GET /api/food-types - Get all food types
router.get('/', (req: Request, res: Response) => {
  try {
    const foodTypes = foodTypeModel.findAll();
    return res.json(foodTypes);
  } catch (error) {
    console.error('Error fetching food types:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to fetch food types',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// GET /api/food-types/:id - Get food type by ID
router.get('/:id', validateId, (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const id = parseInt(req.params.id);
    const foodType = foodTypeModel.findById(id);
    
    if (!foodType) {
      return res.status(404).json({
        error: {
          message: 'Food type not found',
          code: 'FOOD_TYPE_NOT_FOUND'
        }
      });
    }
    
    return res.json(foodType);
  } catch (error) {
    console.error('Error fetching food type:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to fetch food type',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// POST /api/food-types - Create new food type
router.post('/', validateFoodType, (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const { name, brand, description } = req.body;
    const foodType = foodTypeModel.create({ name, brand, description });
    return res.status(201).json(foodType);
  } catch (error) {
    console.error('Error creating food type:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to create food type',
        code: 'INTERNAL_ERROR'
      }
    });
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
      return res.status(404).json({
        error: {
          message: 'Food type not found',
          code: 'FOOD_TYPE_NOT_FOUND'
        }
      });
    }
    
    return res.json(updatedFoodType);
  } catch (error) {
    console.error('Error updating food type:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to update food type',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// DELETE /api/food-types/:id - Delete food type
router.delete('/:id', validateId, (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const id = parseInt(req.params.id);
    const deleted = foodTypeModel.delete(id);
    
    if (!deleted) {
      return res.status(404).json({
        error: {
          message: 'Food type not found',
          code: 'FOOD_TYPE_NOT_FOUND'
        }
      });
    }
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting food type:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to delete food type',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

export default router;