import React, { useState, useEffect } from 'react';
import { FeedingSchedule, FoodType } from '../../types';
import { feedingScheduleApi, foodTypeApi } from '../../services/api';
import { Button, Input, Select, FormField } from '../common';
import './FeedingScheduleForm.css';

interface FeedingScheduleFormProps {
  schedule?: FeedingSchedule | null;
  onSave: () => void;
  onCancel: () => void;
}

interface FormData {
  time: string;
  foodTypeId: string;
  isActive: boolean;
}

export const FeedingScheduleForm: React.FC<FeedingScheduleFormProps> = ({ 
  schedule, 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<FormData>({
    time: '',
    foodTypeId: '',
    isActive: true
  });
  const [foodTypes, setFoodTypes] = useState<FoodType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    fetchFoodTypes();
  }, []);

  useEffect(() => {
    if (schedule) {
      setFormData({
        time: schedule.time,
        foodTypeId: schedule.foodTypeId.toString(),
        isActive: schedule.isActive
      });
    } else {
      setFormData({
        time: '',
        foodTypeId: '',
        isActive: true
      });
    }
    setError(null);
    setErrors({});
  }, [schedule]);

  const fetchFoodTypes = async () => {
    try {
      const response = await foodTypeApi.getAll();
      setFoodTypes(response.data.data);
    } catch (err) {
      setError('餌の種類の取得に失敗しました');
      console.error('Error fetching food types:', err);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.time.trim()) {
      newErrors.time = '時刻は必須です';
    } else {
      // Validate time format (HH:MM)
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(formData.time)) {
        newErrors.time = '時刻は HH:MM 形式で入力してください（例: 08:30）';
      }
    }

    if (!formData.foodTypeId) {
      newErrors.foodTypeId = '餌の種類を選択してください';
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
        time: formData.time,
        foodTypeId: parseInt(formData.foodTypeId),
        isActive: formData.isActive
      };

      if (schedule) {
        await feedingScheduleApi.update(schedule.id, submitData);
      } else {
        await feedingScheduleApi.create(submitData);
      }

      onSave();
    } catch (err) {
      setError(schedule ? '更新に失敗しました' : '登録に失敗しました');
      console.error('Error saving schedule:', err);
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

  const foodTypeOptions = foodTypes.map(ft => ({
    value: ft.id.toString(),
    label: ft.name
  }));

  return (
    <div className="schedule-form-container">
      <div className="schedule-form">
        <div className="schedule-form-header">
          <h2>{schedule ? 'スケジュールを編集' : '新しいスケジュールを追加'}</h2>
        </div>

        {error && (
          <div className="schedule-form-error">
            {error}
          </div>
        )}

        {foodTypes.length === 0 && (
          <div className="schedule-form-warning">
            <p>餌の種類が登録されていません。先に餌の種類を登録してください。</p>
            <Button onClick={onCancel} variant="secondary">
              戻る
            </Button>
          </div>
        )}

        {foodTypes.length > 0 && (
          <form onSubmit={handleSubmit}>
            <FormField
              label="時刻"
              required
              error={errors.time}
              helpText="24時間形式で入力してください（例: 08:30, 18:00）"
            >
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => handleChange('time', e.target.value)}
                disabled={loading}
              />
            </FormField>

            <FormField
              label="餌の種類"
              required
              error={errors.foodTypeId}
            >
              <Select
                value={formData.foodTypeId}
                onChange={(e) => handleChange('foodTypeId', e.target.value)}
                options={[
                  { value: '', label: '餌の種類を選択してください' },
                  ...foodTypeOptions
                ]}
                disabled={loading}
              />
            </FormField>

            <FormField label="ステータス">
              <div className="schedule-form-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleChange('isActive', e.target.checked)}
                    disabled={loading}
                  />
                  <span>有効なスケジュール</span>
                </label>
              </div>
            </FormField>

            <div className="schedule-form-actions">
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
                {loading ? '保存中...' : (schedule ? '更新' : '登録')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};