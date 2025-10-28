import Database from 'better-sqlite3';
import { getDatabase } from '../database/connection';
import { FeedingRecord, FeedingRecordRow, FeedingSchedule, FeedingScheduleRow, FoodType, FoodTypeRow } from '../types';

export class FeedingRecordModel {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  // Convert database row to FeedingRecord interface
  private rowToFeedingRecord(
    row: FeedingRecordRow, 
    scheduleRow?: FeedingScheduleRow, 
    foodTypeRow?: FoodTypeRow
  ): FeedingRecord {
    const feedingRecord: FeedingRecord = {
      id: row.id,
      feedingScheduleId: row.feeding_schedule_id,
      actualTime: row.actual_time,
      completed: Boolean(row.completed),
      notes: row.notes || undefined,
      createdAt: row.created_at
    };

    if (scheduleRow) {
      feedingRecord.feedingSchedule = {
        id: scheduleRow.id,
        time: scheduleRow.time,
        foodTypeId: scheduleRow.food_type_id,
        isActive: Boolean(scheduleRow.is_active),
        createdAt: scheduleRow.created_at,
        updatedAt: scheduleRow.updated_at
      };

      if (foodTypeRow) {
        feedingRecord.feedingSchedule.foodType = {
          id: foodTypeRow.id,
          name: foodTypeRow.name,
          brand: foodTypeRow.brand || undefined,
          description: foodTypeRow.description || undefined,
          createdAt: foodTypeRow.created_at,
          updatedAt: foodTypeRow.updated_at
        };
      }
    }

    return feedingRecord;
  }

  // Get all feeding records with schedule and food type information
  findAll(limit?: number, offset?: number): FeedingRecord[] {
    let query = `
      SELECT 
        fr.id, fr.feeding_schedule_id, fr.actual_time, fr.completed, fr.notes, fr.created_at,
        fs.id as fs_id, fs.time as fs_time, fs.food_type_id as fs_food_type_id, 
        fs.is_active as fs_is_active, fs.created_at as fs_created_at, fs.updated_at as fs_updated_at,
        ft.id as ft_id, ft.name as ft_name, ft.brand as ft_brand, 
        ft.description as ft_description, ft.created_at as ft_created_at, ft.updated_at as ft_updated_at
      FROM feeding_records fr
      LEFT JOIN feeding_schedules fs ON fr.feeding_schedule_id = fs.id
      LEFT JOIN food_types ft ON fs.food_type_id = ft.id
      ORDER BY fr.actual_time DESC
    `;

    if (limit) {
      query += ` LIMIT ${limit}`;
      if (offset) {
        query += ` OFFSET ${offset}`;
      }
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all() as any[];
    
    return rows.map(row => {
      const feedingRecordRow: FeedingRecordRow = {
        id: row.id,
        feeding_schedule_id: row.feeding_schedule_id,
        actual_time: row.actual_time,
        completed: row.completed,
        notes: row.notes,
        created_at: row.created_at
      };

      const scheduleRow: FeedingScheduleRow | undefined = row.fs_id ? {
        id: row.fs_id,
        time: row.fs_time,
        food_type_id: row.fs_food_type_id,
        is_active: row.fs_is_active,
        created_at: row.fs_created_at,
        updated_at: row.fs_updated_at
      } : undefined;

      const foodTypeRow: FoodTypeRow | undefined = row.ft_id ? {
        id: row.ft_id,
        name: row.ft_name,
        brand: row.ft_brand,
        description: row.ft_description,
        created_at: row.ft_created_at,
        updated_at: row.ft_updated_at
      } : undefined;

      return this.rowToFeedingRecord(feedingRecordRow, scheduleRow, foodTypeRow);
    });
  }

  // Get feeding record by ID
  findById(id: number): FeedingRecord | null {
    const stmt = this.db.prepare(`
      SELECT 
        fr.id, fr.feeding_schedule_id, fr.actual_time, fr.completed, fr.notes, fr.created_at,
        fs.id as fs_id, fs.time as fs_time, fs.food_type_id as fs_food_type_id, 
        fs.is_active as fs_is_active, fs.created_at as fs_created_at, fs.updated_at as fs_updated_at,
        ft.id as ft_id, ft.name as ft_name, ft.brand as ft_brand, 
        ft.description as ft_description, ft.created_at as ft_created_at, ft.updated_at as ft_updated_at
      FROM feeding_records fr
      LEFT JOIN feeding_schedules fs ON fr.feeding_schedule_id = fs.id
      LEFT JOIN food_types ft ON fs.food_type_id = ft.id
      WHERE fr.id = ?
    `);
    
    const row = stmt.get(id) as any;
    if (!row) return null;

    const feedingRecordRow: FeedingRecordRow = {
      id: row.id,
      feeding_schedule_id: row.feeding_schedule_id,
      actual_time: row.actual_time,
      completed: row.completed,
      notes: row.notes,
      created_at: row.created_at
    };

    const scheduleRow: FeedingScheduleRow | undefined = row.fs_id ? {
      id: row.fs_id,
      time: row.fs_time,
      food_type_id: row.fs_food_type_id,
      is_active: row.fs_is_active,
      created_at: row.fs_created_at,
      updated_at: row.fs_updated_at
    } : undefined;

    const foodTypeRow: FoodTypeRow | undefined = row.ft_id ? {
      id: row.ft_id,
      name: row.ft_name,
      brand: row.ft_brand,
      description: row.ft_description,
      created_at: row.ft_created_at,
      updated_at: row.ft_updated_at
    } : undefined;

    return this.rowToFeedingRecord(feedingRecordRow, scheduleRow, foodTypeRow);
  }

  // Create new feeding record
  create(recordData: Omit<FeedingRecord, 'id' | 'createdAt' | 'feedingSchedule'>): FeedingRecord {
    const stmt = this.db.prepare(`
      INSERT INTO feeding_records (feeding_schedule_id, actual_time, completed, notes, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);
    
    const result = stmt.run(
      recordData.feedingScheduleId,
      recordData.actualTime,
      recordData.completed ? 1 : 0,
      recordData.notes || null
    );
    
    const newRecord = this.findById(result.lastInsertRowid as number);
    if (!newRecord) {
      throw new Error('Failed to create feeding record');
    }
    
    return newRecord;
  }

  // Update feeding record
  update(id: number, recordData: Partial<Omit<FeedingRecord, 'id' | 'createdAt' | 'feedingSchedule'>>): FeedingRecord | null {
    const existingRecord = this.findById(id);
    if (!existingRecord) {
      return null;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (recordData.feedingScheduleId !== undefined) {
      updates.push('feeding_schedule_id = ?');
      values.push(recordData.feedingScheduleId);
    }
    if (recordData.actualTime !== undefined) {
      updates.push('actual_time = ?');
      values.push(recordData.actualTime);
    }
    if (recordData.completed !== undefined) {
      updates.push('completed = ?');
      values.push(recordData.completed ? 1 : 0);
    }
    if (recordData.notes !== undefined) {
      updates.push('notes = ?');
      values.push(recordData.notes || null);
    }

    if (updates.length === 0) {
      return existingRecord;
    }

    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE feeding_records 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `);
    
    stmt.run(...values);
    return this.findById(id);
  }

  // Delete feeding record
  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM feeding_records WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Get feeding records by date range
  findByDateRange(startDate: string, endDate: string): FeedingRecord[] {
    const stmt = this.db.prepare(`
      SELECT 
        fr.id, fr.feeding_schedule_id, fr.actual_time, fr.completed, fr.notes, fr.created_at,
        fs.id as fs_id, fs.time as fs_time, fs.food_type_id as fs_food_type_id, 
        fs.is_active as fs_is_active, fs.created_at as fs_created_at, fs.updated_at as fs_updated_at,
        ft.id as ft_id, ft.name as ft_name, ft.brand as ft_brand, 
        ft.description as ft_description, ft.created_at as ft_created_at, ft.updated_at as ft_updated_at
      FROM feeding_records fr
      LEFT JOIN feeding_schedules fs ON fr.feeding_schedule_id = fs.id
      LEFT JOIN food_types ft ON fs.food_type_id = ft.id
      WHERE date(fr.actual_time) BETWEEN ? AND ?
      ORDER BY fr.actual_time DESC
    `);
    
    const rows = stmt.all(startDate, endDate) as any[];
    
    return rows.map(row => {
      const feedingRecordRow: FeedingRecordRow = {
        id: row.id,
        feeding_schedule_id: row.feeding_schedule_id,
        actual_time: row.actual_time,
        completed: row.completed,
        notes: row.notes,
        created_at: row.created_at
      };

      const scheduleRow: FeedingScheduleRow | undefined = row.fs_id ? {
        id: row.fs_id,
        time: row.fs_time,
        food_type_id: row.fs_food_type_id,
        is_active: row.fs_is_active,
        created_at: row.fs_created_at,
        updated_at: row.fs_updated_at
      } : undefined;

      const foodTypeRow: FoodTypeRow | undefined = row.ft_id ? {
        id: row.ft_id,
        name: row.ft_name,
        brand: row.ft_brand,
        description: row.ft_description,
        created_at: row.ft_created_at,
        updated_at: row.ft_updated_at
      } : undefined;

      return this.rowToFeedingRecord(feedingRecordRow, scheduleRow, foodTypeRow);
    });
  }

  // Get completion rate for a date range
  getCompletionRate(startDate: string, endDate: string): { total: number; completed: number; rate: number } {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed
      FROM feeding_records 
      WHERE date(actual_time) BETWEEN ? AND ?
    `);
    
    const result = stmt.get(startDate, endDate) as { total: number; completed: number | null };
    const completed = result.completed || 0;
    const rate = result.total > 0 ? (completed / result.total) * 100 : 0;
    
    return {
      total: result.total,
      completed: completed,
      rate: Math.round(rate * 100) / 100 // Round to 2 decimal places
    };
  }
}