import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { WeightRecordModel } from '../models/WeightRecord';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();
const weightRecordModel = new WeightRecordModel();

// Validation middleware
const validateWeightRecord = [
  body('petId')
    .isInt({ min: 1 })
    .withMessage('Pet ID must be a positive integer'),
  body('weight')
    .isFloat({ min: 0.01, max: 999.99 })
    .withMessage('Weight must be a positive number between 0.01 and 999.99'),
  body('recordedDate')
    .isISO8601()
    .withMessage('Recorded date must be a valid ISO 8601 date'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be at most 500 characters')
];

const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Weight record ID must be a positive integer')
];

const validatePetId = [
  query('petId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Pet ID must be a positive integer')
];

const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
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

// GET /api/weight-records - Get all weight records
router.get('/', [...validatePetId, ...validateDateRange], (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const { petId, startDate, endDate } = req.query;
    
    let records;
    if (petId && startDate && endDate) {
      records = weightRecordModel.findByPetAndDateRange(
        parseInt(petId as string),
        startDate as string,
        endDate as string
      );
    } else if (petId) {
      records = weightRecordModel.findAll(parseInt(petId as string));
    } else {
      records = weightRecordModel.findAll();
    }
    
    return sendSuccess(res, records);
  } catch (error) {
    console.error('Error fetching weight records:', error);
    return sendError(res, 'Failed to fetch weight records', 'INTERNAL_ERROR', 500);
  }
});

// GET /api/weight-records/latest/:petId - Get latest weight record for a pet
router.get('/latest/:petId', [
  param('petId')
    .isInt({ min: 1 })
    .withMessage('Pet ID must be a positive integer')
], (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const petId = parseInt(req.params.petId);
    const record = weightRecordModel.findLatestByPet(petId);
    
    if (!record) {
      return res.status(404).json({
        error: {
          message: 'No weight records found for this pet',
          code: 'WEIGHT_RECORD_NOT_FOUND'
        }
      });
    }
    
    return res.json(record);
  } catch (error) {
    console.error('Error fetching latest weight record:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to fetch latest weight record',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// GET /api/weight-records/:id - Get weight record by ID
router.get('/:id', validateId, (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const id = parseInt(req.params.id);
    const record = weightRecordModel.findById(id);
    
    if (!record) {
      return res.status(404).json({
        error: {
          message: 'Weight record not found',
          code: 'WEIGHT_RECORD_NOT_FOUND'
        }
      });
    }
    
    return res.json(record);
  } catch (error) {
    console.error('Error fetching weight record:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to fetch weight record',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// POST /api/weight-records - Create new weight record
router.post('/', validateWeightRecord, (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const { petId, weight, recordedDate, notes } = req.body;
    const record = weightRecordModel.create({ 
      petId, 
      weight, 
      recordedDate, 
      notes 
    });
    return res.status(201).json(record);
  } catch (error) {
    console.error('Error creating weight record:', error);
    
    // Handle foreign key constraint error
    if (error instanceof Error && error.message.includes('FOREIGN KEY constraint failed')) {
      res.status(400).json({
        error: {
          message: 'Invalid pet ID',
          code: 'INVALID_PET'
        }
      });
    }
    
    return res.status(500).json({
      error: {
        message: 'Failed to create weight record',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// PUT /api/weight-records/:id - Update weight record
router.put('/:id', [...validateId, ...validateWeightRecord], (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const id = parseInt(req.params.id);
    const { petId, weight, recordedDate, notes } = req.body;
    
    const updatedRecord = weightRecordModel.update(id, { 
      petId, 
      weight, 
      recordedDate, 
      notes 
    });
    
    if (!updatedRecord) {
      return res.status(404).json({
        error: {
          message: 'Weight record not found',
          code: 'WEIGHT_RECORD_NOT_FOUND'
        }
      });
    }
    
    return res.json(updatedRecord);
  } catch (error) {
    console.error('Error updating weight record:', error);
    
    // Handle foreign key constraint error
    if (error instanceof Error && error.message.includes('FOREIGN KEY constraint failed')) {
      res.status(400).json({
        error: {
          message: 'Invalid pet ID',
          code: 'INVALID_PET'
        }
      });
    }
    
    return res.status(500).json({
      error: {
        message: 'Failed to update weight record',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// DELETE /api/weight-records/:id - Delete weight record
router.delete('/:id', validateId, (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const id = parseInt(req.params.id);
    const deleted = weightRecordModel.delete(id);
    
    if (!deleted) {
      return res.status(404).json({
        error: {
          message: 'Weight record not found',
          code: 'WEIGHT_RECORD_NOT_FOUND'
        }
      });
    }
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting weight record:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to delete weight record',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

export default router;