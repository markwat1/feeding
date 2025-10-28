import Database from 'better-sqlite3';

export const runMigrations = (db: Database.Database): void => {
  console.log('Running database migrations...');

  // Create migrations table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const migrations = [
    {
      name: '001_create_pets_table',
      sql: `
        CREATE TABLE IF NOT EXISTS pets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          species TEXT NOT NULL,
          birth_date DATE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `
    },
    {
      name: '002_create_food_types_table',
      sql: `
        CREATE TABLE IF NOT EXISTS food_types (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          brand TEXT,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `
    },
    {
      name: '003_create_feeding_schedules_table',
      sql: `
        CREATE TABLE IF NOT EXISTS feeding_schedules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          time TEXT NOT NULL,
          food_type_id INTEGER NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (food_type_id) REFERENCES food_types(id)
        )
      `
    },
    {
      name: '004_create_feeding_records_table',
      sql: `
        CREATE TABLE IF NOT EXISTS feeding_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          feeding_schedule_id INTEGER NOT NULL,
          actual_time DATETIME NOT NULL,
          completed BOOLEAN NOT NULL,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (feeding_schedule_id) REFERENCES feeding_schedules(id)
        )
      `
    },
    {
      name: '005_create_weight_records_table',
      sql: `
        CREATE TABLE IF NOT EXISTS weight_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pet_id INTEGER NOT NULL,
          weight DECIMAL(5,2) NOT NULL,
          recorded_date DATE NOT NULL,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (pet_id) REFERENCES pets(id)
        )
      `
    },
    {
      name: '006_create_maintenance_records_table',
      sql: `
        CREATE TABLE IF NOT EXISTS maintenance_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL CHECK (type IN ('water', 'toilet')),
          performed_at DATETIME NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `
    }
  ];

  // Check which migrations have been executed
  const executedMigrations = db.prepare('SELECT name FROM migrations').all() as { name: string }[];
  const executedNames = new Set(executedMigrations.map(m => m.name));

  // Execute pending migrations
  for (const migration of migrations) {
    if (!executedNames.has(migration.name)) {
      console.log(`Executing migration: ${migration.name}`);
      
      try {
        db.exec(migration.sql);
        
        // Record the migration as executed
        db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migration.name);
        
        console.log(`Migration ${migration.name} completed successfully`);
      } catch (error) {
        console.error(`Migration ${migration.name} failed:`, error);
        throw error;
      }
    }
  }

  console.log('All migrations completed successfully');
};