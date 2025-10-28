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

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: {
    message: string;
    code: string;
    details?: any;
  };
}