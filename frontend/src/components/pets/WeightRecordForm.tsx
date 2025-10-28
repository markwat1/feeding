import React, { useState, useEffect } from 'react';
import { Pet, WeightRecord } from '../../types';
import { weightRecordApi, petApi } from '../../services/api';
import { Button } from '../common/Button';
import { FormField } from '../common/FormField';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Textarea } from '../common/Textarea';
import './WeightRecordForm.css';

interface WeightRecordFormProps {
  weightRecord?: WeightRecord | null;
  onSave: () => void;
  onCancel: () => void;
}

interface FormData {
  petId: number | '';
  weight: string;
  recordedDate: string;
  notes: string;
}

interface FormErrors {
  petId?: string;
  weight?: string;
  recordedDate?: string;
}

export const WeightRecordForm: React.FC<WeightRecordFormProps> = ({ 
  weightRecord, 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<FormData>({
    petId: '',
    weight: '',
    recordedDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [petsLoading, setPetsLoading] = useState(true);

  useEffect(() => {
    fetchPets();
  }, []);

  useEffect(() => {
    if (weightRecord) {
      setFormData({
        petId: weightRecord.petId,
        weight: weightRecord.weight.toString(),
        recordedDate: weightRecord.recordedDate.split('T')[0],
        notes: weightRecord.notes || ''
      });
    } else {
      setFormData({
        petId: '',
        weight: '',
        recordedDate: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [weightRecord]);

  const fetchPets = async () => {
    try {
      setPetsLoading(true);
      const response = await petApi.getAll();
      setPets(response.data.data);
    } catch (err) {
      console.error('Error fetching pets:', err);
    } finally {
      setPetsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.petId) {
      newErrors.petId = 'ペットを選択してください';
    }

    if (!formData.weight.trim()) {
      newErrors.weight = '体重は必須です';
    } else {
      const weight = parseFloat(formData.weight);
      if (isNaN(weight) || weight <= 0) {
        newErrors.weight = '正しい体重を入力してください';
      } else if (weight > 999.99) {
        newErrors.weight = '体重は999.99kg以下で入力してください';
      }
    }

    if (!formData.recordedDate) {
      newErrors.recordedDate = '記録日は必須です';
    } else {
      const recordedDate = new Date(formData.recordedDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      if (recordedDate > today) {
        newErrors.recordedDate = '記録日は今日以前の日付を入力してください';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      const recordData = {
        petId: Number(formData.petId),
        weight: parseFloat(formData.weight),
        recordedDate: formData.recordedDate,
        notes: formData.notes.trim() || undefined
      };

      if (weightRecord) {
        await weightRecordApi.update(weightRecord.id, recordData);
      } else {
        await weightRecordApi.create(recordData);
      }

      onSave();
    } catch (err: any) {
      console.error('Error saving weight record:', err);
      setSubmitError(
        err.response?.data?.error?.message || 
        '体重記録の保存に失敗しました'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="weight-record-form-container">
      <div className="weight-record-form-header">
        <h3>{weightRecord ? '体重記録編集' : '新しい体重記録'}</h3>
      </div>

      <form onSubmit={handleSubmit} className="weight-record-form">
        <FormField label="ペット" required error={errors.petId}>
          <Select
            value={formData.petId}
            onChange={handleInputChange('petId')}
            error={!!errors.petId}
            disabled={petsLoading}
            placeholder="ペットを選択してください"
            options={pets.map(pet => ({
              value: pet.id,
              label: `${pet.name} (${pet.species})`
            }))}
          />
        </FormField>

        <FormField label="体重 (kg)" required error={errors.weight}>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="999.99"
            value={formData.weight}
            onChange={handleInputChange('weight')}
            error={!!errors.weight}
            placeholder="例: 5.2"
          />
        </FormField>

        <FormField label="記録日" required error={errors.recordedDate}>
          <Input
            type="date"
            value={formData.recordedDate}
            onChange={handleInputChange('recordedDate')}
            error={!!errors.recordedDate}
            max={new Date().toISOString().split('T')[0]}
          />
        </FormField>

        <FormField label="メモ">
          <Textarea
            value={formData.notes}
            onChange={handleInputChange('notes')}
            placeholder="体重測定時の状況や気づいたことなど"
            rows={3}
            maxLength={500}
          />
        </FormField>

        {submitError && (
          <div className="weight-record-form-error">
            {submitError}
          </div>
        )}

        <div className="weight-record-form-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
          >
            {weightRecord ? '更新' : '記録'}
          </Button>
        </div>
      </form>
    </div>
  );
};