export interface Pet {
  id: number;
  name: string;
  species: string;
  birthDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface FoodType {
  id: number;
  name: string;
  brand?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedingSchedule {
  id: number;
  time: string; // HH:MM
  foodTypeId: number;
  foodType?: FoodType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeedingRecord {
  id: number;
  feedingScheduleId: number;
  feedingSchedule?: FeedingSchedule;
  actualTime: string;
  completed: boolean;
  notes?: string;
  createdAt: string;
}

export interface WeightRecord {
  id: number;
  petId: number;
  pet?: Pet;
  weight: number;
  recordedDate: string;
  notes?: string;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: number;
  type: 'water' | 'toilet';
  performedAt: string;
  description?: string;
  createdAt: string;
}

// Database row interfaces (snake_case from database)
export interface PetRow {
  id: number;
  name: string;
  species: string;
  birth_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface FoodTypeRow {
  id: number;
  name: string;
  brand: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedingScheduleRow {
  id: number;
  time: string;
  food_type_id: number;
  is_active: number; // SQLite boolean as integer
  created_at: string;
  updated_at: string;
}

export interface FeedingRecordRow {
  id: number;
  feeding_schedule_id: number;
  actual_time: string;
  completed: number; // SQLite boolean as integer
  notes: string | null;
  created_at: string;
}

export interface WeightRecordRow {
  id: number;
  pet_id: number;
  weight: number;
  recorded_date: string;
  notes: string | null;
  created_at: string;
}

export interface MaintenanceRecordRow {
  id: number;
  type: string;
  performed_at: string;
  description: string | null;
  created_at: string;
}