import axios from 'axios';
import type {
  Pet,
  FoodType,
  FeedingSchedule,
  FeedingRecord,
  WeightRecord,
  MaintenanceRecord,
  ApiResponse
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Pet API
export const petApi = {
  getAll: () => api.get<ApiResponse<Pet[]>>('/pets'),
  getById: (id: number) => api.get<ApiResponse<Pet>>(`/pets/${id}`),
  create: (pet: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<Pet>>('/pets', pet),
  update: (id: number, pet: Partial<Pet>) => 
    api.put<ApiResponse<Pet>>(`/pets/${id}`, pet),
  delete: (id: number) => api.delete(`/pets/${id}`),
};

// Food Type API
export const foodTypeApi = {
  getAll: () => api.get<ApiResponse<FoodType[]>>('/food-types'),
  getById: (id: number) => api.get<ApiResponse<FoodType>>(`/food-types/${id}`),
  create: (foodType: Omit<FoodType, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<FoodType>>('/food-types', foodType),
  update: (id: number, foodType: Partial<FoodType>) => 
    api.put<ApiResponse<FoodType>>(`/food-types/${id}`, foodType),
  delete: (id: number) => api.delete(`/food-types/${id}`),
};

// Feeding Schedule API
export const feedingScheduleApi = {
  getAll: () => api.get<ApiResponse<FeedingSchedule[]>>('/feeding-schedules'),
  getById: (id: number) => api.get<ApiResponse<FeedingSchedule>>(`/feeding-schedules/${id}`),
  create: (schedule: Omit<FeedingSchedule, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<FeedingSchedule>>('/feeding-schedules', schedule),
  update: (id: number, schedule: Partial<FeedingSchedule>) => 
    api.put<ApiResponse<FeedingSchedule>>(`/feeding-schedules/${id}`, schedule),
  delete: (id: number) => api.delete(`/feeding-schedules/${id}`),
};

// Feeding Record API
export const feedingRecordApi = {
  getAll: (params?: { startDate?: string; endDate?: string }) => 
    api.get<ApiResponse<FeedingRecord[]>>('/feeding-records', { params }),
  getById: (id: number) => api.get<ApiResponse<FeedingRecord>>(`/feeding-records/${id}`),
  getStats: (params: { startDate: string; endDate: string }) =>
    api.get<ApiResponse<{ total: number; completed: number; rate: number }>>('/feeding-records/stats', { params }),
  exportCsv: (params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    return api.get(`/feeding-records/export?${queryParams.toString()}`, {
      responseType: 'blob'
    });
  },
  create: (record: Omit<FeedingRecord, 'id' | 'createdAt'>) => 
    api.post<ApiResponse<FeedingRecord>>('/feeding-records', record),
  update: (id: number, record: Partial<FeedingRecord>) => 
    api.put<ApiResponse<FeedingRecord>>(`/feeding-records/${id}`, record),
  delete: (id: number) => api.delete(`/feeding-records/${id}`),
};

// Weight Record API
export const weightRecordApi = {
  getAll: (petId?: number) => 
    api.get<ApiResponse<WeightRecord[]>>('/weight-records', { params: { petId } }),
  getById: (id: number) => api.get<ApiResponse<WeightRecord>>(`/weight-records/${id}`),
  create: (record: Omit<WeightRecord, 'id' | 'createdAt'>) => 
    api.post<ApiResponse<WeightRecord>>('/weight-records', record),
  update: (id: number, record: Partial<WeightRecord>) => 
    api.put<ApiResponse<WeightRecord>>(`/weight-records/${id}`, record),
  delete: (id: number) => api.delete(`/weight-records/${id}`),
};

// Maintenance Record API
export const maintenanceRecordApi = {
  getAll: (params?: { startDate?: string; endDate?: string; type?: 'water' | 'toilet' }) => 
    api.get<ApiResponse<MaintenanceRecord[]>>('/maintenance-records', { params }),
  getById: (id: number) => api.get<ApiResponse<MaintenanceRecord>>(`/maintenance-records/${id}`),
  getRecent: (params?: { days?: number; type?: 'water' | 'toilet' }) =>
    api.get<ApiResponse<MaintenanceRecord[]>>('/maintenance-records/recent', { params }),
  getStats: (params: { startDate: string; endDate: string }) =>
    api.get<ApiResponse<{ water: number; toilet: number; total: number }>>('/maintenance-records/stats', { params }),
  exportCsv: (params?: { startDate?: string; endDate?: string; type?: 'water' | 'toilet' }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.type) queryParams.append('type', params.type);
    
    return api.get(`/maintenance-records/export?${queryParams.toString()}`, {
      responseType: 'blob'
    });
  },
  create: (record: Omit<MaintenanceRecord, 'id' | 'createdAt'>) => 
    api.post<ApiResponse<MaintenanceRecord>>('/maintenance-records', record),
  update: (id: number, record: Partial<MaintenanceRecord>) => 
    api.put<ApiResponse<MaintenanceRecord>>(`/maintenance-records/${id}`, record),
  delete: (id: number) => api.delete(`/maintenance-records/${id}`),
};

export default api;