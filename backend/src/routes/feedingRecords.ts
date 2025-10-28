import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { FeedingRecordModel } from '../models/FeedingRecord';

const router = Router();
const feedingRecordModel = new FeedingRecordModel();

// Validation middleware
const validateFeedingRecord = [
  body('feedingScheduleId')
    .isInt({ min: 1 })
    .withMessage('Feeding schedule ID must be a positive integer'),
  body('actualTime')
    .isISO8601()
    .withMessage('Actual time must be a valid ISO 8601 datetime'),
  body('completed')
    .isBoolean()
    .withMessage('Completed must be a boolean value'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be at most 500 characters')
];

const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Feeding record ID must be a positive integer')
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

// GET /api/feeding-records - Get all feeding records
router.get('/', validateDateRange, (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const { startDate, endDate, limit, offset } = req.query;
    
    let records;
    if (startDate && endDate) {
      records = feedingRecordModel.findByDateRange(
        startDate as string, 
        endDate as string
      );
    } else {
      const limitNum = limit ? parseInt(limit as string) : undefined;
      const offsetNum = offset ? parseInt(offset as string) : undefined;
      records = feedingRecordModel.findAll(limitNum, offsetNum);
    }
    
    return res.json(records);
  } catch (error) {
    console.error('Error fetching feeding records:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to fetch feeding records',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// GET /api/feeding-records/stats - Get completion statistics
router.get('/stats', validateDateRange, (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      res.status(400).json({
        error: {
          message: 'Both startDate and endDate are required for statistics',
          code: 'MISSING_DATE_RANGE'
        }
      });
    }
    
    const stats = feedingRecordModel.getCompletionRate(
      startDate as string, 
      endDate as string
    );
    
    return res.json(stats);
  } catch (error) {
    console.error('Error fetching feeding statistics:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to fetch feeding statistics',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// GET /api/feeding-records/export - Export feeding records as CSV
router.get('/export', validateDateRange, (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const { startDate, endDate } = req.query;
    
    let records;
    if (startDate && endDate) {
      records = feedingRecordModel.findByDateRange(
        startDate as string, 
        endDate as string
      );
    } else {
      records = feedingRecordModel.findAll();
    }
    
    // Generate CSV content
    const csvHeader = 'ID,給餌日時,予定時刻,餌の種類,完食状況,メモ,登録日時\n';
    const csvRows = records.map(record => {
      const scheduleTime = record.feedingSchedule?.time || '不明';
      const foodTypeName = record.feedingSchedule?.foodType?.name || '不明な餌';
      const completedText = record.completed ? '完食' : '残した';
      const notes = record.notes ? `"${record.notes.replace(/"/g, '""')}"` : '';
      
      return [
        record.id,
        `"${record.actualTime}"`,
        `"${scheduleTime}"`,
        `"${foodTypeName}"`,
        `"${completedText}"`,
        notes,
        `"${record.createdAt}"`
      ].join(',');
    }).join('\n');
    
    const csvContent = csvHeader + csvRows;
    
    // Set headers for file download
    const filename = `feeding_records_${startDate || 'all'}_${endDate || 'all'}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Add BOM for proper UTF-8 encoding in Excel
    res.write('\uFEFF');
    res.write(csvContent);
    return res.end();
  } catch (error) {
    console.error('Error exporting feeding records:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to export feeding records',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// GET /api/feeding-records/:id - Get feeding record by ID
router.get('/:id', validateId, (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const id = parseInt(req.params.id);
    const record = feedingRecordModel.findById(id);
    
    if (!record) {
      return res.status(404).json({
        error: {
          message: 'Feeding record not found',
          code: 'FEEDING_RECORD_NOT_FOUND'
        }
      });
    }
    
    return res.json(record);
  } catch (error) {
    console.error('Error fetching feeding record:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to fetch feeding record',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// POST /api/feeding-records - Create new feeding record
router.post('/', validateFeedingRecord, (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const { feedingScheduleId, actualTime, completed, notes } = req.body;
    const record = feedingRecordModel.create({ 
      feedingScheduleId, 
      actualTime, 
      completed, 
      notes 
    });
    return res.status(201).json(record);
  } catch (error) {
    console.error('Error creating feeding record:', error);
    
    // Handle foreign key constraint error
    if (error instanceof Error && error.message.includes('FOREIGN KEY constraint failed')) {
      res.status(400).json({
        error: {
          message: 'Invalid feeding schedule ID',
          code: 'INVALID_FEEDING_SCHEDULE'
        }
      });
    }
    
    return res.status(500).json({
      error: {
        message: 'Failed to create feeding record',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// PUT /api/feeding-records/:id - Update feeding record
router.put('/:id', [...validateId, ...validateFeedingRecord], (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const id = parseInt(req.params.id);
    const { feedingScheduleId, actualTime, completed, notes } = req.body;
    
    const updatedRecord = feedingRecordModel.update(id, { 
      feedingScheduleId, 
      actualTime, 
      completed, 
      notes 
    });
    
    if (!updatedRecord) {
      return res.status(404).json({
        error: {
          message: 'Feeding record not found',
          code: 'FEEDING_RECORD_NOT_FOUND'
        }
      });
    }
    
    return res.json(updatedRecord);
  } catch (error) {
    console.error('Error updating feeding record:', error);
    
    // Handle foreign key constraint error
    if (error instanceof Error && error.message.includes('FOREIGN KEY constraint failed')) {
      res.status(400).json({
        error: {
          message: 'Invalid feeding schedule ID',
          code: 'INVALID_FEEDING_SCHEDULE'
        }
      });
    }
    
    return res.status(500).json({
      error: {
        message: 'Failed to update feeding record',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// DELETE /api/feeding-records/:id - Delete feeding record
router.delete('/:id', validateId, (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const id = parseInt(req.params.id);
    const deleted = feedingRecordModel.delete(id);
    
    if (!deleted) {
      return res.status(404).json({
        error: {
          message: 'Feeding record not found',
          code: 'FEEDING_RECORD_NOT_FOUND'
        }
      });
    }
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting feeding record:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to delete feeding record',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

export default router;