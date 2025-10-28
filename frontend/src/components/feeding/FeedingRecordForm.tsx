import React, { useState, useEffect } from 'react';
import { FeedingSchedule, FeedingRecord, FoodType } from '../../types';
import { feedingScheduleApi, feedingRecordApi, foodTypeApi } from '../../services/api';
import { Button, Select, FormField } from '../common';
import './FeedingRecordForm.css';

interface FeedingRecordFormProps {
  record?: FeedingRecord | null;
  onSave: () => void;
  onCancel: () => void;
}

interface FormData {
  feedingScheduleId: string;
  actualTime: string;
  completed: boolean;
  notes: string;
}

export const FeedingRecordForm: React.FC<FeedingRecordFormProps> = ({ 
  record, 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<FormData>({
    feedingScheduleId: '',
    actualTime: '',
    completed: true,
    notes: ''
  });
  const [schedules, setSchedules] = useState<FeedingSchedule[]>([]);
  const [foodTypes, setFoodTypes] = useState<FoodType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (record) {
      const actualDateTime = new Date(record.actualTime);
      const dateStr = actualDateTime.toISOString().split('T')[0];
      const timeStr = actualDateTime.toTimeString().slice(0, 5);
      
      setFormData({
        feedingScheduleId: record.feedingScheduleId.toString(),
        actualTime: `${dateStr}T${timeStr}`,
        completed: record.completed,
        notes: record.notes || ''
      });
    } else {
      // Set default to current date and time
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().slice(0, 5);
      
      setFormData({
        feedingScheduleId: '',
        actualTime: `${dateStr}T${timeStr}`,
        completed: true,
        notes: ''
      });
    }
    setError(null);
    setErrors({});
  }, [record]);

  const fetchData = async () => {
    try {
      const [schedulesResponse, foodTypesResponse] = await Promise.all([
        feedingScheduleApi.getAll(),
        foodTypeApi.getAll()
      ]);
      
      // Only show active schedules for new records
      const activeSchedules = schedulesResponse.data.data.filter(s => s.isActive);
      setSchedules(activeSchedules);
      setFoodTypes(foodTypesResponse.data.data);
    } catch (err) {
      setError('データの取得に失敗しました');
      console.error('Error fetching data:', err);
    }
  };

  const getFoodTypeName = (foodTypeId: number): string => {
    const foodType = foodTypes.find(ft => ft.id === foodTypeId);
    return foodType ? foodType.name : '不明な餌';
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.feedingScheduleId) {
      newErrors.feedingScheduleId = 'スケジュールを選択してください';
    }

    if (!formData.actualTime) {
      newErrors.actualTime = '実際の給餌時刻は必須です';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const submitData = {
        feedingScheduleId: parseInt(formData.feedingScheduleId),
        actualTime: new Date(formData.actualTime).toISOString(),
        completed: formData.completed,
        notes: formData.notes.trim() || undefined
      };

      if (record) {
        await feedingRecordApi.update(record.id, submitData);
      } else {
        await feedingRecordApi.create(submitData);
      }

      onSave();
    } catch (err) {
      setError(record ? '更新に失敗しました' : '記録の保存に失敗しました');
      console.error('Error saving record:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const scheduleOptions = schedules.map(schedule => ({
    value: schedule.id.toString(),
    label: `${schedule.time} - ${getFoodTypeName(schedule.foodTypeId)}`
  }));

  return (
    <div className="record-form-container">
      <div className="record-form">
        <div className="record-form-header">
          <h2>{record ? '餌やり記録を編集' : '新しい餌やり記録を追加'}</h2>
        </div>

        {error && (
          <div className="record-form-error">
            {error}
          </div>
        )}

        {schedules.length === 0 && !record && (
          <div className="record-form-warning">
            <p>有効なスケジュールが登録されていません。先にスケジュールを登録してください。</p>
            <Button onClick={onCancel} variant="secondary">
              戻る
            </Button>
          </div>
        )}

        {(schedules.length > 0 || record) && (
          <form onSubmit={handleSubmit}>
            <FormField
              label="餌やりスケジュール"
              required
              error={errors.feedingScheduleId}
            >
              <Select
                value={formData.feedingScheduleId}
                onChange={(e) => handleChange('feedingScheduleId', e.target.value)}
                options={[
                  { value: '', label: 'スケジュールを選択してください' },
                  ...scheduleOptions
                ]}
                disabled={loading || !!record}
              />
              {record && (
                <div className="record-form-help">
                  編集時はスケジュールを変更できません
                </div>
              )}
            </FormField>

            <FormField
              label="実際の給餌時刻"
              required
              error={errors.actualTime}
            >
              <input
                type="datetime-local"
                value={formData.actualTime}
                onChange={(e) => handleChange('actualTime', e.target.value)}
                disabled={loading}
                className="record-form-datetime"
              />
            </FormField>

            <FormField label="完食状況">
              <div className="record-form-radio-group">
                <label className="record-form-radio">
                  <input
                    type="radio"
                    name="completed"
                    checked={formData.completed === true}
                    onChange={() => handleChange('completed', true)}
                    disabled={loading}
                  />
                  <span>完食した</span>
                </label>
                <label className="record-form-radio">
                  <input
                    type="radio"
                    name="completed"
                    checked={formData.completed === false}
                    onChange={() => handleChange('completed', false)}
                    disabled={loading}
                  />
                  <span>残した</span>
                </label>
              </div>
            </FormField>

            <FormField label="メモ">
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="特記事項があれば記入してください"
                rows={3}
                disabled={loading}
                className="record-form-textarea"
              />
            </FormField>

            <div className="record-form-actions">
              <Button
                type="button"
                onClick={onCancel}
                variant="secondary"
                disabled={loading}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? '保存中...' : (record ? '更新' : '記録')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};