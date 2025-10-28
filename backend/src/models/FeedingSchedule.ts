import Database from 'better-sqlite3';
import { getDatabase } from '../database/connection';
import { FeedingSchedule, FeedingScheduleRow, FoodType, FoodTypeRow } from '../types';

export class FeedingScheduleModel {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  // Convert database row to FeedingSchedule interface
  private rowToFeedingSchedule(row: FeedingScheduleRow, foodTypeRow?: FoodTypeRow): FeedingSchedule {
    const feedingSchedule: FeedingSchedule = {
      id: row.id,
      time: row.time,
      foodTypeId: row.food_type_id,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    if (foodTypeRow) {
      feedingSchedule.foodType = {
        id: foodTypeRow.id,
        name: foodTypeRow.name,
        brand: foodTypeRow.brand || undefined,
        description: foodTypeRow.description || undefined,
        createdAt: foodTypeRow.created_at,
        updatedAt: foodTypeRow.updated_at
      };
    }

    return feedingSchedule;
  }

  // Get all feeding schedules with food type information
  findAll(): FeedingSchedule[] {
    const stmt = this.db.prepare(`
      SELECT 
        fs.id, fs.time, fs.food_type_id, fs.is_active, fs.created_at, fs.updated_at,
        ft.id as ft_id, ft.name as ft_name, ft.brand as ft_brand, 
        ft.description as ft_description, ft.created_at as ft_created_at, ft.updated_at as ft_updated_at
      FROM feeding_schedules fs
      LEFT JOIN food_types ft ON fs.food_type_id = ft.id
      ORDER BY fs.time ASC
    `);
    
    const rows = stmt.all() as any[];
    return rows.map(row => {
      const feedingScheduleRow: FeedingScheduleRow = {
        id: row.id,
        time: row.time,
        food_type_id: row.food_type_id,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at
      };

      const foodTypeRow: FoodTypeRow | undefined = row.ft_id ? {
        id: row.ft_id,
        name: row.ft_name,
        brand: row.ft_brand,
        description: row.ft_description,
        created_at: row.ft_created_at,
        updated_at: row.ft_updated_at
      } : undefined;

      return this.rowToFeedingSchedule(feedingScheduleRow, foodTypeRow);
    });
  }

  // Get feeding schedule by ID
  findById(id: number): FeedingSchedule | null {
    const stmt = this.db.prepare(`
      SELECT 
        fs.id, fs.time, fs.food_type_id, fs.is_active, fs.created_at, fs.updated_at,
        ft.id as ft_id, ft.name as ft_name, ft.brand as ft_brand, 
        ft.description as ft_description, ft.created_at as ft_created_at, ft.updated_at as ft_updated_at
      FROM feeding_schedules fs
      LEFT JOIN food_types ft ON fs.food_type_id = ft.id
      WHERE fs.id = ?
    `);
    
    const row = stmt.get(id) as any;
    if (!row) return null;

    const feedingScheduleRow: FeedingScheduleRow = {
      id: row.id,
      time: row.time,
      food_type_id: row.food_type_id,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at
    };

    const foodTypeRow: FoodTypeRow | undefined = row.ft_id ? {
      id: row.ft_id,
      name: row.ft_name,
      brand: row.ft_brand,
      description: row.ft_description,
      created_at: row.ft_created_at,
      updated_at: row.ft_updated_at
    } : undefined;

    return this.rowToFeedingSchedule(feedingScheduleRow, foodTypeRow);
  }

  // Create new feeding schedule
  create(scheduleData: Omit<FeedingSchedule, 'id' | 'createdAt' | 'updatedAt' | 'foodType'>): FeedingSchedule {
    const stmt = this.db.prepare(`
      INSERT INTO feeding_schedules (time, food_type_id, is_active, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    const result = stmt.run(
      scheduleData.time, 
      scheduleData.foodTypeId, 
      scheduleData.isActive ? 1 : 0
    );
    
    const newSchedule = this.findById(result.lastInsertRowid as number);
    if (!newSchedule) {
      throw new Error('Failed to create feeding schedule');
    }
    
    return newSchedule;
  }

  // Update feeding schedule
  update(id: number, scheduleData: Partial<Omit<FeedingSchedule, 'id' | 'createdAt' | 'updatedAt' | 'foodType'>>): FeedingSchedule | null {
    const existingSchedule = this.findById(id);
    if (!existingSchedule) {
      return null;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (scheduleData.time !== undefined) {
      updates.push('time = ?');
      values.push(scheduleData.time);
    }
    if (scheduleData.foodTypeId !== undefined) {
      updates.push('food_type_id = ?');
      values.push(scheduleData.foodTypeId);
    }
    if (scheduleData.isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(scheduleData.isActive ? 1 : 0);
    }

    if (updates.length === 0) {
      return existingSchedule;
    }

    updates.push('updated_at = datetime(\'now\')');
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE feeding_schedules 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `);
    
    stmt.run(...values);
    return this.findById(id);
  }

  // Delete feeding schedule
  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM feeding_schedules WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Get active feeding schedules
  findActive(): FeedingSchedule[] {
    const stmt = this.db.prepare(`
      SELECT 
        fs.id, fs.time, fs.food_type_id, fs.is_active, fs.created_at, fs.updated_at,
        ft.id as ft_id, ft.name as ft_name, ft.brand as ft_brand, 
        ft.description as ft_description, ft.created_at as ft_created_at, ft.updated_at as ft_updated_at
      FROM feeding_schedules fs
      LEFT JOIN food_types ft ON fs.food_type_id = ft.id
      WHERE fs.is_active = 1
      ORDER BY fs.time ASC
    `);
    
    const rows = stmt.all() as any[];
    return rows.map(row => {
      const feedingScheduleRow: FeedingScheduleRow = {
        id: row.id,
        time: row.time,
        food_type_id: row.food_type_id,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at
      };

      const foodTypeRow: FoodTypeRow | undefined = row.ft_id ? {
        id: row.ft_id,
        name: row.ft_name,
        brand: row.ft_brand,
        description: row.ft_description,
        created_at: row.ft_created_at,
        updated_at: row.ft_updated_at
      } : undefined;

      return this.rowToFeedingSchedule(feedingScheduleRow, foodTypeRow);
    });
  }
}