import React, { useState, useEffect } from 'react';
import { FeedingSchedule, FoodType } from '../../types';
import { feedingScheduleApi, foodTypeApi } from '../../services/api';
import { Button } from '../common';
import './FeedingScheduleList.css';

interface FeedingScheduleListProps {
  onEdit: (schedule: FeedingSchedule) => void;
  onAdd: () => void;
  refreshTrigger?: number;
}

export const FeedingScheduleList: React.FC<FeedingScheduleListProps> = ({ 
  onEdit, 
  onAdd, 
  refreshTrigger 
}) => {
  const [schedules, setSchedules] = useState<FeedingSchedule[]>([]);
  const [foodTypes, setFoodTypes] = useState<FoodType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [schedulesResponse, foodTypesResponse] = await Promise.all([
        feedingScheduleApi.getAll(),
        foodTypeApi.getAll()
      ]);
      
      setSchedules(schedulesResponse.data.data);
      setFoodTypes(foodTypesResponse.data.data);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('データの取得に失敗しました');
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  const getFoodTypeName = (foodTypeId: number): string => {
    const foodType = foodTypes.find(ft => ft.id === foodTypeId);
    return foodType ? foodType.name : '不明な餌';
  };

  const handleToggleActive = async (schedule: FeedingSchedule) => {
    try {
      await feedingScheduleApi.update(schedule.id, { 
        isActive: !schedule.isActive 
      });
      
      setSchedules(schedules.map(s => 
        s.id === schedule.id 
          ? { ...s, isActive: !s.isActive }
          : s
      ));
    } catch (err: any) {
      console.error('Error updating schedule status:', err);
      setError('ステータスの更新に失敗しました');
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('このスケジュールを削除しますか？')) {
      return;
    }

    try {
      await feedingScheduleApi.delete(id);
      setSchedules(schedules.filter(s => s.id !== id));
    } catch (err: any) {
      console.error('Error deleting schedule:', err);
      
      // Check if it's an API error response with a specific message
      let errorMessage = '削除に失敗しました';
      if (err.response?.data?.error?.message) {
        errorMessage = err.response.data.error.message;
      } else if (err.response?.status === 400) {
        errorMessage = 'このスケジュールは使用中のため削除できません';
      }
      
      setError(errorMessage);
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  const formatTime = (time: string): string => {
    return time;
  };

  if (loading) {
    return <div className="schedule-list-loading">読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="schedule-list-error">
        <p>{error}</p>
        <Button onClick={fetchData}>再試行</Button>
      </div>
    );
  }

  const activeSchedules = schedules.filter(s => s.isActive);
  const inactiveSchedules = schedules.filter(s => !s.isActive);

  return (
    <div className="schedule-list">
      <div className="schedule-list-header">
        <h2>餌やりスケジュール一覧</h2>
        <Button onClick={onAdd} variant="primary">
          新しいスケジュールを追加
        </Button>
      </div>

      {schedules.length === 0 ? (
        <div className="schedule-list-empty">
          <p>登録されたスケジュールがありません</p>
          <Button onClick={onAdd}>最初のスケジュールを追加</Button>
        </div>
      ) : (
        <>
          {activeSchedules.length > 0 && (
            <div className="schedule-section">
              <h3 className="schedule-section-title">有効なスケジュール</h3>
              <div className="schedule-list-grid">
                {activeSchedules
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((schedule) => (
                    <div key={schedule.id} className="schedule-card active">
                      <div className="schedule-card-header">
                        <div className="schedule-time">
                          {formatTime(schedule.time)}
                        </div>
                        <div className="schedule-card-actions">
                          <Button 
                            onClick={() => onEdit(schedule)} 
                            variant="secondary"
                            size="small"
                          >
                            編集
                          </Button>
                          <Button 
                            onClick={() => handleToggleActive(schedule)} 
                            variant="warning"
                            size="small"
                          >
                            無効化
                          </Button>
                          <Button 
                            onClick={() => handleDelete(schedule.id)} 
                            variant="danger"
                            size="small"
                          >
                            削除
                          </Button>
                        </div>
                      </div>
                      
                      <div className="schedule-card-content">
                        <p className="schedule-food-type">
                          <strong>餌の種類:</strong> {getFoodTypeName(schedule.foodTypeId)}
                        </p>
                        <p className="schedule-created">
                          登録日: {new Date(schedule.createdAt).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {inactiveSchedules.length > 0 && (
            <div className="schedule-section">
              <h3 className="schedule-section-title">無効なスケジュール</h3>
              <div className="schedule-list-grid">
                {inactiveSchedules
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((schedule) => (
                    <div key={schedule.id} className="schedule-card inactive">
                      <div className="schedule-card-header">
                        <div className="schedule-time">
                          {formatTime(schedule.time)}
                        </div>
                        <div className="schedule-card-actions">
                          <Button 
                            onClick={() => onEdit(schedule)} 
                            variant="secondary"
                            size="small"
                          >
                            編集
                          </Button>
                          <Button 
                            onClick={() => handleToggleActive(schedule)} 
                            variant="success"
                            size="small"
                          >
                            有効化
                          </Button>
                          <Button 
                            onClick={() => handleDelete(schedule.id)} 
                            variant="danger"
                            size="small"
                          >
                            削除
                          </Button>
                        </div>
                      </div>
                      
                      <div className="schedule-card-content">
                        <p className="schedule-food-type">
                          <strong>餌の種類:</strong> {getFoodTypeName(schedule.foodTypeId)}
                        </p>
                        <p className="schedule-created">
                          登録日: {new Date(schedule.createdAt).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};