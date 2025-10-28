import Database from 'better-sqlite3';

// Test database setup
let testDb: Database.Database;

// Mock the database connection for tests
jest.mock('../database/connection', () => ({
  getDatabase: () => {
    if (!testDb) {
      // Use in-memory database for tests
      testDb = new Database(':memory:');
      
      // Create tables
      testDb.exec(`
        CREATE TABLE pets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          species TEXT NOT NULL,
          birth_date DATE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE food_types (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          brand TEXT,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE feeding_schedules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          time TEXT NOT NULL,
          food_type_id INTEGER NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (food_type_id) REFERENCES food_types(id)
        );

        CREATE TABLE feeding_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          feeding_schedule_id INTEGER NOT NULL,
          actual_time DATETIME NOT NULL,
          completed BOOLEAN NOT NULL,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (feeding_schedule_id) REFERENCES feeding_schedules(id)
        );

        CREATE TABLE weight_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pet_id INTEGER NOT NULL,
          weight DECIMAL(5,2) NOT NULL,
          recorded_date DATE NOT NULL,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (pet_id) REFERENCES pets(id)
        );

        CREATE TABLE maintenance_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          performed_at DATETIME NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }
    return testDb;
  }
}));

export const setupTestDatabase = (): Database.Database => {
  return testDb;
};

export const cleanupTestDatabase = () => {
  if (testDb) {
    testDb.close();
  }
};