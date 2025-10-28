import Database from 'better-sqlite3';
import { getDatabase } from '../database/connection';
import { FoodType, FoodTypeRow } from '../types';

export class FoodTypeModel {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  // Convert database row to FoodType interface
  private rowToFoodType(row: FoodTypeRow): FoodType {
    return {
      id: row.id,
      name: row.name,
      brand: row.brand || undefined,
      description: row.description || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Get all food types
  findAll(): FoodType[] {
    const stmt = this.db.prepare(`
      SELECT id, name, brand, description, created_at, updated_at 
      FROM food_types 
      ORDER BY name ASC
    `);
    const rows = stmt.all() as FoodTypeRow[];
    return rows.map(row => this.rowToFoodType(row));
  }

  // Get food type by ID
  findById(id: number): FoodType | null {
    const stmt = this.db.prepare(`
      SELECT id, name, brand, description, created_at, updated_at 
      FROM food_types 
      WHERE id = ?
    `);
    const row = stmt.get(id) as FoodTypeRow | undefined;
    return row ? this.rowToFoodType(row) : null;
  }

  // Create new food type
  create(foodTypeData: Omit<FoodType, 'id' | 'createdAt' | 'updatedAt'>): FoodType {
    const stmt = this.db.prepare(`
      INSERT INTO food_types (name, brand, description, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    const brand = foodTypeData.brand || null;
    const description = foodTypeData.description || null;
    const result = stmt.run(foodTypeData.name, brand, description);
    
    const newFoodType = this.findById(result.lastInsertRowid as number);
    if (!newFoodType) {
      throw new Error('Failed to create food type');
    }
    
    return newFoodType;
  }

  // Update food type
  update(id: number, foodTypeData: Partial<Omit<FoodType, 'id' | 'createdAt' | 'updatedAt'>>): FoodType | null {
    const existingFoodType = this.findById(id);
    if (!existingFoodType) {
      return null;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (foodTypeData.name !== undefined) {
      updates.push('name = ?');
      values.push(foodTypeData.name);
    }
    if (foodTypeData.brand !== undefined) {
      updates.push('brand = ?');
      values.push(foodTypeData.brand || null);
    }
    if (foodTypeData.description !== undefined) {
      updates.push('description = ?');
      values.push(foodTypeData.description || null);
    }

    if (updates.length === 0) {
      return existingFoodType;
    }

    updates.push('updated_at = datetime(\'now\')');
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE food_types 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `);
    
    stmt.run(...values);
    return this.findById(id);
  }

  // Delete food type
  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM food_types WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}