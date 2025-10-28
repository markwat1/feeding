import React, { useState, useEffect } from 'react';
import { FeedingRecord, FeedingSchedule, FoodType } from '../../types';
import { feedingRecordApi, feedingScheduleApi, foodTypeApi } from '../../services/api';
import { Button, DateRangeFilter, CsvExport } from '../common';
import './FeedingRecordList.css';

interface FeedingRecordListProps {
  onEdit: (record: FeedingRecord) => void;
  onAdd: () => void;
  refreshTrigger?: number;
  showExport?: boolean;
}

export const FeedingRecordList: React.FC<FeedingRecordListProps> = ({ 
  onEdit, 
  onAdd, 
  refreshTrigger,
  showExport = false
}) => {
  const [records, setRecords] = useState<FeedingRecord[]>([]);
  const [schedules, setSchedules] = useState<FeedingSchedule[]>([]);
  const [foodTypes, setFoodTypes] = useState<FoodType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [refreshTrigger, startDate, endDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = (startDate || endDate) ? {
        startDate: startDate || undefined,
        endDate: endDate || undefined
      } : undefined;
      
      const [recordsResponse, schedulesResponse, foodTypesResponse] = await Promise.all([
        feedingRecordApi.getAll(params),
        feedingScheduleApi.getAll(),
        foodTypeApi.getAll()
      ]);
      
      setRecords(recordsResponse.data.data);
      setSchedules(schedulesResponse.data.data);
      setFoodTypes(foodTypesResponse.data.data);
    } catch (err) {
      setError('データの取得に失敗しました');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScheduleInfo = (scheduleId: number) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return { time: '不明', foodTypeName: '不明な餌' };
    
    const foodType = foodTypes.find(ft => ft.id === schedule.foodTypeId);
    return {
      time: schedule.time,
      foodTypeName: foodType ? foodType.name : '不明な餌'
    };
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('この記録を削除しますか？')) {
      return;
    }

    try {
      await feedingRecordApi.delete(id);
      setRecords(records.filter(r => r.id !== id));
    } catch (err) {
      setError('削除に失敗しました');
      console.error('Error deleting record:', err);
    }
  };

  const formatDateTime = (dateTimeString: string): { date: string; time: string } => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('ja-JP'),
      time: date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const handleExport = async (params: { startDate?: string; endDate?: string }) => {
    return await feedingRecordApi.exportCsv(params);
  };

  if (loading) {
    return <div className="record-list-loading">読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="record-list-error">
        <p>{error}</p>
        <Button onClick={fetchData}>再試行</Button>
      </div>
    );
  }

  // Group records by date
  const recordsByDate = records.reduce((acc, record) => {
    const date = formatDateTime(record.actualTime).date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(record);
    return acc;
  }, {} as Record<string, FeedingRecord[]>);

  const sortedDates = Object.keys(recordsByDate).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  return (
    <div className="record-list">
      <div className="record-list-header">
        <h2>餌やり記録一覧</h2>
        <div className="record-list-controls">
          <Button onClick={onAdd} variant="primary">
            新しい記録を追加
          </Button>
        </div>
      </div>

      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onClear={clearDateFilter}
        className="record-list-filter"
      />

      {showExport && (
        <CsvExport
          onExport={handleExport}
          title="餌やり記録のエクスポート"
          className="record-list-export"
        />
      )}

      {records.length === 0 ? (
        <div className="record-list-empty">
          {(startDate || endDate) ? (
            <>
              <p>選択した期間の記録がありません</p>
              <Button onClick={clearDateFilter}>全ての記録を表示</Button>
            </>
          ) : (
            <>
              <p>餌やり記録がありません</p>
              <Button onClick={onAdd}>最初の記録を追加</Button>
            </>
          )}
        </div>
      ) : (
        <div className="record-list-content">
          {sortedDates.map((date) => (
            <div key={date} className="record-date-group">
              <h3 className="record-date-header">{date}</h3>
              <div className="record-cards">
                {recordsByDate[date]
                  .sort((a, b) => new Date(b.actualTime).getTime() - new Date(a.actualTime).getTime())
                  .map((record) => {
                    const scheduleInfo = getScheduleInfo(record.feedingScheduleId);
                    const { time } = formatDateTime(record.actualTime);
                    
                    return (
                      <div key={record.id} className={`record-card ${record.completed ? 'completed' : 'incomplete'}`}>
                        <div className="record-card-header">
                          <div className="record-time-info">
                            <div className="record-actual-time">{time}</div>
                            <div className="record-scheduled-time">予定: {scheduleInfo.time}</div>
                          </div>
                          <div className="record-status">
                            <span className={`record-status-badge ${record.completed ? 'completed' : 'incomplete'}`}>
                              {record.completed ? '完食' : '残した'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="record-card-content">
                          <p className="record-food-type">
                            <strong>餌の種類:</strong> {scheduleInfo.foodTypeName}
                          </p>
                          {record.notes && (
                            <p className="record-notes">
                              <strong>メモ:</strong> {record.notes}
                            </p>
                          )}
                        </div>
                        
                        <div className="record-card-actions">
                          <Button 
                            onClick={() => onEdit(record)} 
                            variant="secondary"
                            size="small"
                          >
                            編集
                          </Button>
                          <Button 
                            onClick={() => handleDelete(record.id)} 
                            variant="danger"
                            size="small"
                          >
                            削除
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};