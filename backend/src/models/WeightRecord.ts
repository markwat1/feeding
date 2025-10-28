import Database from 'better-sqlite3';
import { getDatabase } from '../database/connection';
import { WeightRecord, WeightRecordRow, Pet, PetRow } from '../types';

export class WeightRecordModel {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  // Convert database row to WeightRecord interface
  private rowToWeightRecord(row: WeightRecordRow, petRow?: PetRow): WeightRecord {
    const weightRecord: WeightRecord = {
      id: row.id,
      petId: row.pet_id,
      weight: row.weight,
      recordedDate: row.recorded_date,
      notes: row.notes || undefined,
      createdAt: row.created_at
    };

    if (petRow) {
      weightRecord.pet = {
        id: petRow.id,
        name: petRow.name,
        species: petRow.species,
        birthDate: petRow.birth_date || '',
        createdAt: petRow.created_at,
        updatedAt: petRow.updated_at
      };
    }

    return weightRecord;
  }

  // Get all weight records with pet information
  findAll(petId?: number): WeightRecord[] {
    let query = `
      SELECT 
        wr.id, wr.pet_id, wr.weight, wr.recorded_date, wr.notes, wr.created_at,
        p.id as p_id, p.name as p_name, p.species as p_species, 
        p.birth_date as p_birth_date, p.created_at as p_created_at, p.updated_at as p_updated_at
      FROM weight_records wr
      LEFT JOIN pets p ON wr.pet_id = p.id
    `;

    const params: any[] = [];
    if (petId) {
      query += ' WHERE wr.pet_id = ?';
      params.push(petId);
    }

    query += ' ORDER BY wr.recorded_date DESC, wr.created_at DESC';

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];
    
    return rows.map(row => {
      const weightRecordRow: WeightRecordRow = {
        id: row.id,
        pet_id: row.pet_id,
        weight: row.weight,
        recorded_date: row.recorded_date,
        notes: row.notes,
        created_at: row.created_at
      };

      const petRow: PetRow | undefined = row.p_id ? {
        id: row.p_id,
        name: row.p_name,
        species: row.p_species,
        birth_date: row.p_birth_date,
        created_at: row.p_created_at,
        updated_at: row.p_updated_at
      } : undefined;

      return this.rowToWeightRecord(weightRecordRow, petRow);
    });
  }

  // Get weight record by ID
  findById(id: number): WeightRecord | null {
    const stmt = this.db.prepare(`
      SELECT 
        wr.id, wr.pet_id, wr.weight, wr.recorded_date, wr.notes, wr.created_at,
        p.id as p_id, p.name as p_name, p.species as p_species, 
        p.birth_date as p_birth_date, p.created_at as p_created_at, p.updated_at as p_updated_at
      FROM weight_records wr
      LEFT JOIN pets p ON wr.pet_id = p.id
      WHERE wr.id = ?
    `);
    
    const row = stmt.get(id) as any;
    if (!row) return null;

    const weightRecordRow: WeightRecordRow = {
      id: row.id,
      pet_id: row.pet_id,
      weight: row.weight,
      recorded_date: row.recorded_date,
      notes: row.notes,
      created_at: row.created_at
    };

    const petRow: PetRow | undefined = row.p_id ? {
      id: row.p_id,
      name: row.p_name,
      species: row.p_species,
      birth_date: row.p_birth_date,
      created_at: row.p_created_at,
      updated_at: row.p_updated_at
    } : undefined;

    return this.rowToWeightRecord(weightRecordRow, petRow);
  }

  // Create new weight record
  create(recordData: Omit<WeightRecord, 'id' | 'createdAt' | 'pet'>): WeightRecord {
    const stmt = this.db.prepare(`
      INSERT INTO weight_records (pet_id, weight, recorded_date, notes, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);
    
    const result = stmt.run(
      recordData.petId,
      recordData.weight,
      recordData.recordedDate,
      recordData.notes || null
    );
    
    const newRecord = this.findById(result.lastInsertRowid as number);
    if (!newRecord) {
      throw new Error('Failed to create weight record');
    }
    
    return newRecord;
  }

  // Update weight record
  update(id: number, recordData: Partial<Omit<WeightRecord, 'id' | 'createdAt' | 'pet'>>): WeightRecord | null {
    const existingRecord = this.findById(id);
    if (!existingRecord) {
      return null;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (recordData.petId !== undefined) {
      updates.push('pet_id = ?');
      values.push(recordData.petId);
    }
    if (recordData.weight !== undefined) {
      updates.push('weight = ?');
      values.push(recordData.weight);
    }
    if (recordData.recordedDate !== undefined) {
      updates.push('recorded_date = ?');
      values.push(recordData.recordedDate);
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
      UPDATE weight_records 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `);
    
    stmt.run(...values);
    return this.findById(id);
  }

  // Delete weight record
  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM weight_records WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Get weight records by pet ID and date range
  findByPetAndDateRange(petId: number, startDate: string, endDate: string): WeightRecord[] {
    const stmt = this.db.prepare(`
      SELECT 
        wr.id, wr.pet_id, wr.weight, wr.recorded_date, wr.notes, wr.created_at,
        p.id as p_id, p.name as p_name, p.species as p_species, 
        p.birth_date as p_birth_date, p.created_at as p_created_at, p.updated_at as p_updated_at
      FROM weight_records wr
      LEFT JOIN pets p ON wr.pet_id = p.id
      WHERE wr.pet_id = ? AND wr.recorded_date BETWEEN ? AND ?
      ORDER BY wr.recorded_date ASC
    `);
    
    const rows = stmt.all(petId, startDate, endDate) as any[];
    
    return rows.map(row => {
      const weightRecordRow: WeightRecordRow = {
        id: row.id,
        pet_id: row.pet_id,
        weight: row.weight,
        recorded_date: row.recorded_date,
        notes: row.notes,
        created_at: row.created_at
      };

      const petRow: PetRow | undefined = row.p_id ? {
        id: row.p_id,
        name: row.p_name,
        species: row.p_species,
        birth_date: row.p_birth_date,
        created_at: row.p_created_at,
        updated_at: row.p_updated_at
      } : undefined;

      return this.rowToWeightRecord(weightRecordRow, petRow);
    });
  }

  // Get latest weight record for a pet
  findLatestByPet(petId: number): WeightRecord | null {
    const stmt = this.db.prepare(`
      SELECT 
        wr.id, wr.pet_id, wr.weight, wr.recorded_date, wr.notes, wr.created_at,
        p.id as p_id, p.name as p_name, p.species as p_species, 
        p.birth_date as p_birth_date, p.created_at as p_created_at, p.updated_at as p_updated_at
      FROM weight_records wr
      LEFT JOIN pets p ON wr.pet_id = p.id
      WHERE wr.pet_id = ?
      ORDER BY wr.recorded_date DESC, wr.created_at DESC
      LIMIT 1
    `);
    
    const row = stmt.get(petId) as any;
    if (!row) return null;

    const weightRecordRow: WeightRecordRow = {
      id: row.id,
      pet_id: row.pet_id,
      weight: row.weight,
      recorded_date: row.recorded_date,
      notes: row.notes,
      created_at: row.created_at
    };

    const petRow: PetRow | undefined = row.p_id ? {
      id: row.p_id,
      name: row.p_name,
      species: row.p_species,
      birth_date: row.p_birth_date,
      created_at: row.p_created_at,
      updated_at: row.p_updated_at
    } : undefined;

    return this.rowToWeightRecord(weightRecordRow, petRow);
  }
}