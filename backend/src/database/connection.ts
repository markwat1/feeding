import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from './migrations';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/pet_feeding.db');

let db: Database.Database | null = null;

export const getDatabase = (): Database.Database => {
  if (!db) {
    // Ensure data directory exists
    const fs = require('fs');
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(DB_PATH);
    
    // Enable foreign key constraints
    db.pragma('foreign_keys = ON');
    
    // Run migrations
    runMigrations(db);
    
    console.log(`Database connected: ${DB_PATH}`);
  }
  
  return db;
};

export const closeDatabase = (): void => {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
};

// Graceful shutdown
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});