import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { FeedingScheduleModel } from '../models/FeedingSchedule';

const router = Router();
const feedingScheduleModel = new FeedingScheduleModel();

// Validation middleware
const validateFeedingSchedule = [
  body('time')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time must be in HH:MM format (24-hour)'),
  body('foodTypeId')
    .isInt({ min: 1 })
    .withMessage('Food type ID must be a positive integer'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Feeding schedule ID must be a positive integer')
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

// GET /api/feeding-schedules - Get all feeding schedules
router.get('/', (req: Request, res: Response) => {
  try {
    const { active } = req.query;
    
    let schedules;
    if (active === 'true') {
      schedules = feedingScheduleModel.findActive();
    } else {
      schedules = feedingScheduleModel.findAll();
    }
    
    return res.json(schedules);
  } catch (error) {
    console.error('Error fetching feeding schedules:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to fetch feeding schedules',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// GET /api/feeding-schedules/:id - Get feeding schedule by ID
router.get('/:id', validateId, (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const id = parseInt(req.params.id);
    const schedule = feedingScheduleModel.findById(id);
    
    if (!schedule) {
      return res.status(404).json({
        error: {
          message: 'Feeding schedule not found',
          code: 'FEEDING_SCHEDULE_NOT_FOUND'
        }
      });
    }
    
    return res.json(schedule);
  } catch (error) {
    console.error('Error fetching feeding schedule:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to fetch feeding schedule',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// POST /api/feeding-schedules - Create new feeding schedule
router.post('/', validateFeedingSchedule, (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const { time, foodTypeId, isActive = true } = req.body;
    const schedule = feedingScheduleModel.create({ time, foodTypeId, isActive });
    return res.status(201).json(schedule);
  } catch (error) {
    console.error('Error creating feeding schedule:', error);
    
    // Handle foreign key constraint error
    if (error instanceof Error && error.message.includes('FOREIGN KEY constraint failed')) {
      res.status(400).json({
        error: {
          message: 'Invalid food type ID',
          code: 'INVALID_FOOD_TYPE'
        }
      });
    }
    
    return res.status(500).json({
      error: {
        message: 'Failed to create feeding schedule',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// PUT /api/feeding-schedules/:id - Update feeding schedule
router.put('/:id', [...validateId, ...validateFeedingSchedule], (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const id = parseInt(req.params.id);
    const { time, foodTypeId, isActive } = req.body;
    
    const updatedSchedule = feedingScheduleModel.update(id, { time, foodTypeId, isActive });
    
    if (!updatedSchedule) {
      return res.status(404).json({
        error: {
          message: 'Feeding schedule not found',
          code: 'FEEDING_SCHEDULE_NOT_FOUND'
        }
      });
    }
    
    return res.json(updatedSchedule);
  } catch (error) {
    console.error('Error updating feeding schedule:', error);
    
    // Handle foreign key constraint error
    if (error instanceof Error && error.message.includes('FOREIGN KEY constraint failed')) {
      res.status(400).json({
        error: {
          message: 'Invalid food type ID',
          code: 'INVALID_FOOD_TYPE'
        }
      });
    }
    
    return res.status(500).json({
      error: {
        message: 'Failed to update feeding schedule',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// DELETE /api/feeding-schedules/:id - Delete feeding schedule
router.delete('/:id', validateId, (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const id = parseInt(req.params.id);
    const deleted = feedingScheduleModel.delete(id);
    
    if (!deleted) {
      return res.status(404).json({
        error: {
          message: 'Feeding schedule not found',
          code: 'FEEDING_SCHEDULE_NOT_FOUND'
        }
      });
    }
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting feeding schedule:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to delete feeding schedule',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

export default router;