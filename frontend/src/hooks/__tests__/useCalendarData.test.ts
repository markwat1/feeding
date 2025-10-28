import { renderHook, waitFor } from '@testing-library/react';
import { useCalendarData } from '../useCalendarData';
import { feedingRecordApi, maintenanceRecordApi, feedingScheduleApi } from '../../services/api';
import type { FeedingRecord, MaintenanceRecord, FeedingSchedule } from '../../types';

// Mock the APIs
vi.mock('../../services/api', () => ({
  feedingRecordApi: {
    getAll: vi.fn()
  },
  maintenanceRecordApi: {
    getAll: vi.fn()
  },
  feedingScheduleApi: {
    getAll: vi.fn()
  }
}));

const mockFeedingRecordApi = feedingRecordApi as any;
const mockMaintenanceRecordApi = maintenanceRecordApi as any;
const mockFeedingScheduleApi = feedingScheduleApi as any;

describe('useCalendarData', () => {
  const testDate = new Date('2023-10-15'); // October 2023

  const mockFeedingRecords: FeedingRecord[] = [
    {
      id: 1,
      feedingScheduleId: 1,
      actualTime: '2023-10-15T08:00:00Z',
      completed: true,
      createdAt: '2023-10-15T08:00:00Z'
    },
    {
      id: 2,
      feedingScheduleId: 1,
      actualTime: '2023-10-16T08:00:00Z',
      completed: false,
      createdAt: '2023-10-16T08:00:00Z'
    }
  ];

  const mockMaintenanceRecords: MaintenanceRecord[] = [
    {
      id: 1,
      type: 'water',
      performedAt: '2023-10-15T10:00:00Z',
      description: '給水器清掃',
      createdAt: '2023-10-15T10:00:00Z'
    }
  ];

  const mockFeedingSchedules: FeedingSchedule[] = [
    {
      id: 1,
      time: '08:00',
      foodTypeId: 1,
      isActive: true,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    },
    {
      id: 2,
      time: '18:00',
      foodTypeId: 1,
      isActive: false, // This should be filtered out
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockFeedingRecordApi.getAll.mockResolvedValue({
      data: { data: mockFeedingRecords }
    } as any);
    mockMaintenanceRecordApi.getAll.mockResolvedValue({
      data: { data: mockMaintenanceRecords }
    } as any);
    mockFeedingScheduleApi.getAll.mockResolvedValue({
      data: { data: mockFeedingSchedules }
    } as any);
  });

  it('初期状態では空のデータとローディング状態を返す', () => {
    const { result } = renderHook(() => useCalendarData(testDate));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual({
      feedingRecords: [],
      maintenanceRecords: [],
      feedingSchedules: []
    });
    expect(result.current.error).toBeNull();
  });

  it('データを正常に取得できる', async () => {
    const { result } = renderHook(() => useCalendarData(testDate));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data.feedingRecords).toEqual(mockFeedingRecords);
    expect(result.current.data.maintenanceRecords).toEqual(mockMaintenanceRecords);
    expect(result.current.data.feedingSchedules).toHaveLength(1); // Only active schedules
    expect(result.current.data.feedingSchedules[0].isActive).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('正しい日付範囲でAPIを呼び出す', async () => {
    renderHook(() => useCalendarData(testDate));

    await waitFor(() => {
      // The actual calculation might be different due to timezone
      expect(mockFeedingRecordApi.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.stringMatching(/2023-\d{2}-\d{2}/),
          endDate: expect.stringMatching(/2023-\d{2}-\d{2}/)
        })
      );
      expect(mockMaintenanceRecordApi.getAll).toHaveBeenCalled();
      expect(mockFeedingScheduleApi.getAll).toHaveBeenCalled();
    });
  });

  it('getDataForDate が特定日のデータを正しく返す', async () => {
    const { result } = renderHook(() => useCalendarData(testDate));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const oct15Data = result.current.getDataForDate(new Date('2023-10-15'));
    
    expect(oct15Data.date).toBe('2023-10-15');
    expect(oct15Data.feedingRecords).toHaveLength(1);
    expect(oct15Data.feedingRecords[0].id).toBe(1);
    expect(oct15Data.maintenanceRecords).toHaveLength(1);
    expect(oct15Data.maintenanceRecords[0].id).toBe(1);
    expect(oct15Data.scheduledFeedings).toHaveLength(1);
  });

  it('getCompletionStatus が完食率を正しく計算する', async () => {
    const { result } = renderHook(() => useCalendarData(testDate));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // October 15: 1 scheduled, 1 feeding, 1 completed
    const oct15Status = result.current.getCompletionStatus(new Date('2023-10-15'));
    expect(oct15Status.totalScheduled).toBe(1);
    expect(oct15Status.totalFeedings).toBe(1);
    expect(oct15Status.completedFeedings).toBe(1);
    expect(oct15Status.completionRate).toBe(1);
    expect(oct15Status.hasMaintenanceRecords).toBe(true);

    // October 16: 1 scheduled, 1 feeding, 0 completed
    const oct16Status = result.current.getCompletionStatus(new Date('2023-10-16'));
    expect(oct16Status.totalScheduled).toBe(1);
    expect(oct16Status.totalFeedings).toBe(1);
    expect(oct16Status.completedFeedings).toBe(0);
    expect(oct16Status.completionRate).toBe(0);
    expect(oct16Status.hasMaintenanceRecords).toBe(false);

    // October 17: 1 scheduled, 0 feedings, 0 completed
    const oct17Status = result.current.getCompletionStatus(new Date('2023-10-17'));
    expect(oct17Status.totalScheduled).toBe(1);
    expect(oct17Status.totalFeedings).toBe(0);
    expect(oct17Status.completedFeedings).toBe(0);
    expect(oct17Status.completionRate).toBe(0);
    expect(oct17Status.hasMaintenanceRecords).toBe(false);
  });

  it('API エラー時にエラー状態を設定する', async () => {
    mockFeedingRecordApi.getAll.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useCalendarData(testDate));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('カレンダーデータの取得に失敗しました');
    expect(result.current.data).toEqual({
      feedingRecords: [],
      maintenanceRecords: [],
      feedingSchedules: []
    });
  });

  it('月が変わったときにデータを再取得する', async () => {
    const { result, rerender } = renderHook(
      ({ date }) => useCalendarData(date),
      { initialProps: { date: testDate } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFeedingRecordApi.getAll).toHaveBeenCalledTimes(1);

    // 月を変更
    const newDate = new Date('2023-11-15');
    rerender({ date: newDate });

    await waitFor(() => {
      expect(mockFeedingRecordApi.getAll).toHaveBeenCalledTimes(2);
    });

    expect(mockFeedingRecordApi.getAll).toHaveBeenLastCalledWith(
      expect.objectContaining({
        startDate: expect.stringMatching(/2023-\d{2}-\d{2}/),
        endDate: expect.stringMatching(/2023-\d{2}-\d{2}/)
      })
    );
  });

  it('refetch でデータを手動で再取得できる', async () => {
    const { result } = renderHook(() => useCalendarData(testDate));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFeedingRecordApi.getAll).toHaveBeenCalledTimes(1);

    // 手動で再取得
    result.current.refetch();

    await waitFor(() => {
      expect(mockFeedingRecordApi.getAll).toHaveBeenCalledTimes(2);
    });
  });
});