import { FeedingRecordModel } from '../../models/FeedingRecord';
import { FoodTypeModel } from '../../models/FoodType';
import { FeedingScheduleModel } from '../../models/FeedingSchedule';
import { setupTestDatabase, cleanupTestDatabase } from '../setup';

describe('FeedingRecordModel', () => {
  let feedingRecordModel: FeedingRecordModel;
  let foodTypeModel: FoodTypeModel;
  let feedingScheduleModel: FeedingScheduleModel;
  let testFoodTypeId: number;
  let testScheduleId: number;

  beforeAll(() => {
    setupTestDatabase();
    feedingRecordModel = new FeedingRecordModel();
    foodTypeModel = new FoodTypeModel();
    feedingScheduleModel = new FeedingScheduleModel();
  });

  afterAll(() => {
    cleanupTestDatabase();
  });

  beforeEach(() => {
    // Clear tables before each test in reverse order due to foreign keys
    const db = require('../../database/connection').getDatabase();
    db.prepare('DELETE FROM feeding_records').run();
    db.prepare('DELETE FROM feeding_schedules').run();
    db.prepare('DELETE FROM food_types').run();

    // Create test data
    const foodType = foodTypeModel.create({
      name: 'Test Food',
      brand: 'Test Brand',
      description: 'Test Description'
    });
    testFoodTypeId = foodType.id;

    const schedule = feedingScheduleModel.create({
      time: '08:00',
      foodTypeId: testFoodTypeId,
      isActive: true
    });
    testScheduleId = schedule.id;
  });

  describe('create', () => {
    it('should create a new feeding record', () => {
      const recordData = {
        feedingScheduleId: testScheduleId,
        actualTime: '2023-10-28T08:15:00Z',
        completed: true,
        notes: 'Ate everything'
      };

      const record = feedingRecordModel.create(recordData);

      expect(record).toMatchObject({
        id: expect.any(Number),
        feedingScheduleId: testScheduleId,
        actualTime: '2023-10-28T08:15:00Z',
        completed: true,
        notes: 'Ate everything',
        createdAt: expect.any(String)
      });
    });

    it('should create a record without notes', () => {
      const recordData = {
        feedingScheduleId: testScheduleId,
        actualTime: '2023-10-28T08:15:00Z',
        completed: false
      };

      const record = feedingRecordModel.create(recordData);

      expect(record.notes).toBeUndefined();
      expect(record.completed).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should return empty array when no records exist', () => {
      const records = feedingRecordModel.findAll();
      expect(records).toEqual([]);
    });

    it('should return records with schedule and food type information', () => {
      feedingRecordModel.create({
        feedingScheduleId: testScheduleId,
        actualTime: '2023-10-28T08:15:00Z',
        completed: true
      });

      const records = feedingRecordModel.findAll();

      expect(records).toHaveLength(1);
      expect(records[0]).toMatchObject({
        feedingScheduleId: testScheduleId,
        feedingSchedule: {
          id: testScheduleId,
          time: '08:00',
          foodTypeId: testFoodTypeId,
          foodType: {
            id: testFoodTypeId,
            name: 'Test Food',
            brand: 'Test Brand'
          }
        }
      });
    });
  });

  describe('findByDateRange', () => {
    beforeEach(() => {
      // Create test records with different dates
      feedingRecordModel.create({
        feedingScheduleId: testScheduleId,
        actualTime: '2023-10-25T08:00:00Z',
        completed: true
      });
      feedingRecordModel.create({
        feedingScheduleId: testScheduleId,
        actualTime: '2023-10-28T08:00:00Z',
        completed: false
      });
      feedingRecordModel.create({
        feedingScheduleId: testScheduleId,
        actualTime: '2023-10-30T08:00:00Z',
        completed: true
      });
    });

    it('should return records within date range', () => {
      const records = feedingRecordModel.findByDateRange('2023-10-27', '2023-10-29');
      
      expect(records).toHaveLength(1);
      expect(records[0].actualTime).toBe('2023-10-28T08:00:00Z');
    });

    it('should return empty array when no records in range', () => {
      const records = feedingRecordModel.findByDateRange('2023-11-01', '2023-11-02');
      expect(records).toEqual([]);
    });
  });

  describe('getCompletionRate', () => {
    beforeEach(() => {
      // Create test records: 3 completed, 2 not completed
      feedingRecordModel.create({
        feedingScheduleId: testScheduleId,
        actualTime: '2023-10-28T08:00:00Z',
        completed: true
      });
      feedingRecordModel.create({
        feedingScheduleId: testScheduleId,
        actualTime: '2023-10-28T12:00:00Z',
        completed: true
      });
      feedingRecordModel.create({
        feedingScheduleId: testScheduleId,
        actualTime: '2023-10-28T18:00:00Z',
        completed: false
      });
      feedingRecordModel.create({
        feedingScheduleId: testScheduleId,
        actualTime: '2023-10-29T08:00:00Z',
        completed: true
      });
      feedingRecordModel.create({
        feedingScheduleId: testScheduleId,
        actualTime: '2023-10-29T18:00:00Z',
        completed: false
      });
    });

    it('should calculate completion rate correctly', () => {
      const stats = feedingRecordModel.getCompletionRate('2023-10-28', '2023-10-29');
      
      expect(stats).toEqual({
        total: 5,
        completed: 3,
        rate: 60
      });
    });

    it('should return zero rate when no records', () => {
      const stats = feedingRecordModel.getCompletionRate('2023-11-01', '2023-11-02');
      
      expect(stats.total).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.rate).toBe(0);
    });
  });

  describe('update', () => {
    it('should update feeding record', () => {
      const created = feedingRecordModel.create({
        feedingScheduleId: testScheduleId,
        actualTime: '2023-10-28T08:00:00Z',
        completed: false
      });

      const updated = feedingRecordModel.update(created.id, {
        completed: true,
        notes: 'Updated notes'
      });

      expect(updated).toMatchObject({
        id: created.id,
        completed: true,
        notes: 'Updated notes'
      });
    });

    it('should return null when record not found', () => {
      const updated = feedingRecordModel.update(999, { completed: true });
      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete existing record', () => {
      const created = feedingRecordModel.create({
        feedingScheduleId: testScheduleId,
        actualTime: '2023-10-28T08:00:00Z',
        completed: true
      });

      const deleted = feedingRecordModel.delete(created.id);
      expect(deleted).toBe(true);

      const found = feedingRecordModel.findById(created.id);
      expect(found).toBeNull();
    });

    it('should return false when record not found', () => {
      const deleted = feedingRecordModel.delete(999);
      expect(deleted).toBe(false);
    });
  });
});