import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { MaintenanceRecordModel } from '../models/MaintenanceRecord';

const router = Router();
const maintenanceRecordModel = new MaintenanceRecordModel();

// Validation middleware
const validateMaintenanceRecord = [
  body('type')
    .isIn(['water', 'toilet'])
    .withMessage('Type must be either "water" or "toilet"'),
  body('performedAt')
    .isISO8601()
    .withMessage('Performed at must be a valid ISO 8601 datetime'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be at most 500 characters')
];

const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Maintenance record ID must be a positive integer')
];

const validateType = [
  query('type')
    .optional()
    .isIn(['water', 'toilet'])
    .withMessage('Type must be either "water" or "toilet"')
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

const validateDays = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be an integer between 1 and 365')
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

// GET /api/maintenance-records - Get all maintenance records
router.get('/', [...validateType, ...validateDateRange], (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const { type, startDate, endDate } = req.query;
    
    let records;
    if (startDate && endDate) {
      records = maintenanceRecordModel.findByDateRange(
        startDate as string,
        endDate as string,
        type as 'water' | 'toilet' | undefined
      );
    } else {
      records = maintenanceRecordModel.findAll(type as 'water' | 'toilet' | undefined);
    }
    
    return res.json(records);
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to fetch maintenance records',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// GET /api/maintenance-records/recent - Get recent maintenance records
router.get('/recent', [...validateType, ...validateDays], (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const { type, days } = req.query;
    const daysNum = days ? parseInt(days as string) : 7;
    
    const records = maintenanceRecordModel.findRecent(
      daysNum,
      type as 'water' | 'toilet' | undefined
    );
    
    return res.json(records);
  } catch (error) {
    console.error('Error fetching recent maintenance records:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to fetch recent maintenance records',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// GET /api/maintenance-records/stats - Get maintenance statistics
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
    
    const stats = maintenanceRecordModel.getMaintenanceStats(
      startDate as string,
      endDate as string
    );
    
    return res.json(stats);
  } catch (error) {
    console.error('Error fetching maintenance statistics:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to fetch maintenance statistics',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// GET /api/maintenance-records/export - Export maintenance records as CSV
router.get('/export', [...validateType, ...validateDateRange], (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const { type, startDate, endDate } = req.query;
    
    let records;
    if (startDate && endDate) {
      records = maintenanceRecordModel.findByDateRange(
        startDate as string,
        endDate as string,
        type as 'water' | 'toilet' | undefined
      );
    } else {
      records = maintenanceRecordModel.findAll(type as 'water' | 'toilet' | undefined);
    }
    
    // Generate CSV content
    const csvHeader = 'ID,メンテナンス種類,実施日時,内容,登録日時\n';
    const csvRows = records.map(record => {
      const typeLabel = record.type === 'water' ? '給水器' : 'トイレ';
      const description = record.description ? `"${record.description.replace(/"/g, '""')}"` : '';
      
      return [
        record.id,
        `"${typeLabel}"`,
        `"${record.performedAt}"`,
        description,
        `"${record.createdAt}"`
      ].join(',');
    }).join('\n');
    
    const csvContent = csvHeader + csvRows;
    
    // Set headers for file download
    const typeFilter = type ? `_${type}` : '';
    const filename = `maintenance_records${typeFilter}_${startDate || 'all'}_${endDate || 'all'}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Add BOM for proper UTF-8 encoding in Excel
    res.write('\uFEFF');
    res.write(csvContent);
    return res.end();
  } catch (error) {
    console.error('Error exporting maintenance records:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to export maintenance records',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// GET /api/maintenance-records/:id - Get maintenance record by ID
router.get('/:id', validateId, (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const id = parseInt(req.params.id);
    const record = maintenanceRecordModel.findById(id);
    
    if (!record) {
      return res.status(404).json({
        error: {
          message: 'Maintenance record not found',
          code: 'MAINTENANCE_RECORD_NOT_FOUND'
        }
      });
    }
    
    return res.json(record);
  } catch (error) {
    console.error('Error fetching maintenance record:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to fetch maintenance record',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// POST /api/maintenance-records - Create new maintenance record
router.post('/', validateMaintenanceRecord, (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const { type, performedAt, description } = req.body;
    const record = maintenanceRecordModel.create({ 
      type, 
      performedAt, 
      description 
    });
    return res.status(201).json(record);
  } catch (error) {
    console.error('Error creating maintenance record:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to create maintenance record',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// PUT /api/maintenance-records/:id - Update maintenance record
router.put('/:id', [...validateId, ...validateMaintenanceRecord], (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const id = parseInt(req.params.id);
    const { type, performedAt, description } = req.body;
    
    const updatedRecord = maintenanceRecordModel.update(id, { 
      type, 
      performedAt, 
      description 
    });
    
    if (!updatedRecord) {
      return res.status(404).json({
        error: {
          message: 'Maintenance record not found',
          code: 'MAINTENANCE_RECORD_NOT_FOUND'
        }
      });
    }
    
    return res.json(updatedRecord);
  } catch (error) {
    console.error('Error updating maintenance record:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to update maintenance record',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// DELETE /api/maintenance-records/:id - Delete maintenance record
router.delete('/:id', validateId, (req: Request, res: Response) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const id = parseInt(req.params.id);
    const deleted = maintenanceRecordModel.delete(id);
    
    if (!deleted) {
      return res.status(404).json({
        error: {
          message: 'Maintenance record not found',
          code: 'MAINTENANCE_RECORD_NOT_FOUND'
        }
      });
    }
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting maintenance record:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to delete maintenance record',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

export default router;