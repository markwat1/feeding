import { useState, useEffect } from 'react';
import { feedingRecordApi, maintenanceRecordApi, feedingScheduleApi } from '../services/api';
import type { FeedingRecord, MaintenanceRecord, FeedingSchedule } from '../types';

interface CalendarData {
  feedingRecords: FeedingRecord[];
  maintenanceRecords: MaintenanceRecord[];
  feedingSchedules: FeedingSchedule[];
}

interface DayData {
  date: string; // YYYY-MM-DD format
  feedingRecords: FeedingRecord[];
  maintenanceRecords: MaintenanceRecord[];
  scheduledFeedings: FeedingSchedule[];
}

export const useCalendarData = (currentDate: Date) => {
  const [data, setData] = useState<CalendarData>({
    feedingRecords: [],
    maintenanceRecords: [],
    feedingSchedules: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get month range for API calls
  const getMonthRange = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Start from first day of month
    const startDate = new Date(year, month, 1);
    // End at last day of month
    const endDate = new Date(year, month + 1, 0);
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  const fetchCalendarData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = getMonthRange(currentDate);

      const [feedingRecordsRes, maintenanceRecordsRes, feedingSchedulesRes] = await Promise.all([
        feedingRecordApi.getAll({ startDate, endDate }),
        maintenanceRecordApi.getAll({ startDate, endDate }),
        feedingScheduleApi.getAll()
      ]);

      setData({
        feedingRecords: feedingRecordsRes.data.data,
        maintenanceRecords: maintenanceRecordsRes.data.data,
        feedingSchedules: feedingSchedulesRes.data.data.filter(schedule => schedule.isActive)
      });
    } catch (err) {
      console.error('Failed to fetch calendar data:', err);
      setError('カレンダーデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate.getFullYear(), currentDate.getMonth()]);

  // Helper function to get data for a specific date
  const getDataForDate = (date: Date): DayData => {
    const dateStr = date.toISOString().split('T')[0];
    
    // Filter feeding records for this date
    const dayFeedingRecords = data.feedingRecords.filter(record => {
      const recordDate = new Date(record.actualTime).toISOString().split('T')[0];
      return recordDate === dateStr;
    });

    // Filter maintenance records for this date
    const dayMaintenanceRecords = data.maintenanceRecords.filter(record => {
      const recordDate = new Date(record.performedAt).toISOString().split('T')[0];
      return recordDate === dateStr;
    });

    // All active schedules apply to every day
    const scheduledFeedings = data.feedingSchedules;

    return {
      date: dateStr,
      feedingRecords: dayFeedingRecords,
      maintenanceRecords: dayMaintenanceRecords,
      scheduledFeedings
    };
  };

  // Helper function to get completion status for a date
  const getCompletionStatus = (date: Date) => {
    const dayData = getDataForDate(date);
    const totalScheduled = dayData.scheduledFeedings.length;
    const completedFeedings = dayData.feedingRecords.filter(record => record.completed).length;
    const totalFeedings = dayData.feedingRecords.length;

    return {
      totalScheduled,
      totalFeedings,
      completedFeedings,
      completionRate: totalScheduled > 0 ? completedFeedings / totalScheduled : 0,
      hasMaintenanceRecords: dayData.maintenanceRecords.length > 0
    };
  };

  return {
    data,
    loading,
    error,
    getDataForDate,
    getCompletionStatus,
    refetch: fetchCalendarData
  };
};