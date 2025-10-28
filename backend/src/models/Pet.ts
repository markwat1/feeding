import Database from 'better-sqlite3';
import { getDatabase } from '../database/connection';
import { Pet, PetRow } from '../types';

export class PetModel {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  // Convert database row to Pet interface
  private rowToPet(row: PetRow): Pet {
    return {
      id: row.id,
      name: row.name,
      species: row.species,
      birthDate: row.birth_date || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Get all pets
  findAll(): Pet[] {
    const stmt = this.db.prepare(`
      SELECT id, name, species, birth_date, created_at, updated_at 
      FROM pets 
      ORDER BY created_at DESC
    `);
    const rows = stmt.all() as PetRow[];
    return rows.map(row => this.rowToPet(row));
  }

  // Get pet by ID
  findById(id: number): Pet | null {
    const stmt = this.db.prepare(`
      SELECT id, name, species, birth_date, created_at, updated_at 
      FROM pets 
      WHERE id = ?
    `);
    const row = stmt.get(id) as PetRow | undefined;
    return row ? this.rowToPet(row) : null;
  }

  // Create new pet
  create(petData: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>): Pet {
    const stmt = this.db.prepare(`
      INSERT INTO pets (name, species, birth_date, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    const birthDate = petData.birthDate || null;
    const result = stmt.run(petData.name, petData.species, birthDate);
    
    const newPet = this.findById(result.lastInsertRowid as number);
    if (!newPet) {
      throw new Error('Failed to create pet');
    }
    
    return newPet;
  }

  // Update pet
  update(id: number, petData: Partial<Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>>): Pet | null {
    const existingPet = this.findById(id);
    if (!existingPet) {
      return null;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (petData.name !== undefined) {
      updates.push('name = ?');
      values.push(petData.name);
    }
    if (petData.species !== undefined) {
      updates.push('species = ?');
      values.push(petData.species);
    }
    if (petData.birthDate !== undefined) {
      updates.push('birth_date = ?');
      values.push(petData.birthDate || null);
    }

    if (updates.length === 0) {
      return existingPet;
    }

    updates.push('updated_at = datetime(\'now\')');
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE pets 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `);
    
    stmt.run(...values);
    return this.findById(id);
  }

  // Delete pet
  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM pets WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}