import Database from 'better-sqlite3';
import { getDatabase } from '../database/connection';
import { MaintenanceRecord, MaintenanceRecordRow } from '../types';

export class MaintenanceRecordModel {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  // Convert database row to MaintenanceRecord interface
  private rowToMaintenanceRecord(row: MaintenanceRecordRow): MaintenanceRecord {
    return {
      id: row.id,
      type: row.type as 'water' | 'toilet',
      performedAt: row.performed_at,
      description: row.description || undefined,
      createdAt: row.created_at
    };
  }

  // Get all maintenance records
  findAll(type?: 'water' | 'toilet'): MaintenanceRecord[] {
    let query = `
      SELECT id, type, performed_at, description, created_at 
      FROM maintenance_records
    `;

    const params: any[] = [];
    if (type) {
      query += ' WHERE type = ?';
      params.push(type);
    }

    query += ' ORDER BY performed_at DESC';

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as MaintenanceRecordRow[];
    return rows.map(row => this.rowToMaintenanceRecord(row));
  }

  // Get maintenance record by ID
  findById(id: number): MaintenanceRecord | null {
    const stmt = this.db.prepare(`
      SELECT id, type, performed_at, description, created_at 
      FROM maintenance_records 
      WHERE id = ?
    `);
    const row = stmt.get(id) as MaintenanceRecordRow | undefined;
    return row ? this.rowToMaintenanceRecord(row) : null;
  }

  // Create new maintenance record
  create(recordData: Omit<MaintenanceRecord, 'id' | 'createdAt'>): MaintenanceRecord {
    const stmt = this.db.prepare(`
      INSERT INTO maintenance_records (type, performed_at, description, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `);
    
    const result = stmt.run(
      recordData.type,
      recordData.performedAt,
      recordData.description || null
    );
    
    const newRecord = this.findById(result.lastInsertRowid as number);
    if (!newRecord) {
      throw new Error('Failed to create maintenance record');
    }
    
    return newRecord;
  }

  // Update maintenance record
  update(id: number, recordData: Partial<Omit<MaintenanceRecord, 'id' | 'createdAt'>>): MaintenanceRecord | null {
    const existingRecord = this.findById(id);
    if (!existingRecord) {
      return null;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (recordData.type !== undefined) {
      updates.push('type = ?');
      values.push(recordData.type);
    }
    if (recordData.performedAt !== undefined) {
      updates.push('performed_at = ?');
      values.push(recordData.performedAt);
    }
    if (recordData.description !== undefined) {
      updates.push('description = ?');
      values.push(recordData.description || null);
    }

    if (updates.length === 0) {
      return existingRecord;
    }

    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE maintenance_records 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `);
    
    stmt.run(...values);
    return this.findById(id);
  }

  // Delete maintenance record
  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM maintenance_records WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Get maintenance records by date range
  findByDateRange(startDate: string, endDate: string, type?: 'water' | 'toilet'): MaintenanceRecord[] {
    let query = `
      SELECT id, type, performed_at, description, created_at 
      FROM maintenance_records 
      WHERE date(performed_at) BETWEEN ? AND ?
    `;

    const params: any[] = [startDate, endDate];
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY performed_at DESC';

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as MaintenanceRecordRow[];
    return rows.map(row => this.rowToMaintenanceRecord(row));
  }

  // Get maintenance statistics for a date range
  getMaintenanceStats(startDate: string, endDate: string): { 
    water: number; 
    toilet: number; 
    total: number 
  } {
    const stmt = this.db.prepare(`
      SELECT 
        type,
        COUNT(*) as count
      FROM maintenance_records 
      WHERE date(performed_at) BETWEEN ? AND ?
      GROUP BY type
    `);
    
    const rows = stmt.all(startDate, endDate) as { type: string; count: number }[];
    
    const stats = { water: 0, toilet: 0, total: 0 };
    
    rows.forEach(row => {
      if (row.type === 'water') {
        stats.water = row.count;
      } else if (row.type === 'toilet') {
        stats.toilet = row.count;
      }
      stats.total += row.count;
    });
    
    return stats;
  }

  // Get recent maintenance records (last N days)
  findRecent(days: number = 7, type?: 'water' | 'toilet'): MaintenanceRecord[] {
    let query = `
      SELECT id, type, performed_at, description, created_at 
      FROM maintenance_records 
      WHERE date(performed_at) >= date('now', '-${days} days')
    `;

    const params: any[] = [];
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY performed_at DESC';

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as MaintenanceRecordRow[];
    return rows.map(row => this.rowToMaintenanceRecord(row));
  }
}