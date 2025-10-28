import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { getDatabase } from './database/connection';
import petsRouter from './routes/pets';
import foodTypesRouter from './routes/foodTypes';
import feedingSchedulesRouter from './routes/feedingSchedules';
import feedingRecordsRouter from './routes/feedingRecords';
import weightRecordsRouter from './routes/weightRecords';
import maintenanceRecordsRouter from './routes/maintenanceRecords';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/pets', petsRouter);
app.use('/api/food-types', foodTypesRouter);
app.use('/api/feeding-schedules', feedingSchedulesRouter);
app.use('/api/feeding-records', feedingRecordsRouter);
app.use('/api/weight-records', weightRecordsRouter);
app.use('/api/maintenance-records', maintenanceRecordsRouter);

// Catch-all for undefined API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Error handling middleware
app.use(errorHandler);

// Initialize database
try {
  getDatabase();
  console.log('Database initialized successfully');
} catch (error) {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;