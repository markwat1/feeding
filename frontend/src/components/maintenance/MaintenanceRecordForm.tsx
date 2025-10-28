import React, { useState } from 'react';
import { MaintenanceRecord } from '../../types';
import { Button, FormField, Input, Select, Textarea } from '../common';
import './MaintenanceRecordForm.css';

interface MaintenanceRecordFormProps {
  initialData?: Partial<MaintenanceRecord>;
  onSubmit: (data: Omit<MaintenanceRecord, 'id' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const MaintenanceRecordForm: React.FC<MaintenanceRecordFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    type: initialData?.type || 'water' as 'water' | 'toilet',
    performedAt: initialData?.performedAt 
      ? new Date(initialData.performedAt).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    description: initialData?.description || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.type) {
      newErrors.type = 'メンテナンス種類を選択してください';
    }

    if (!formData.performedAt) {
      newErrors.performedAt = '実施日時を入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        type: formData.type,
        performedAt: new Date(formData.performedAt).toISOString(),
        description: formData.description || undefined
      });
    } catch (error) {
      console.error('Failed to submit maintenance record:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const maintenanceTypeOptions = [
    { value: 'water', label: '給水器' },
    { value: 'toilet', label: 'トイレ' }
  ];

  return (
    <form onSubmit={handleSubmit} className="maintenance-record-form">
      <FormField label="メンテナンス種類" error={errors.type} required>
        <Select
          value={formData.type}
          onChange={(e) => handleInputChange('type', e.target.value)}
          options={maintenanceTypeOptions}
          placeholder="メンテナンス種類を選択"
        />
      </FormField>

      <FormField label="実施日時" error={errors.performedAt} required>
        <Input
          type="datetime-local"
          value={formData.performedAt}
          onChange={(e) => handleInputChange('performedAt', e.target.value)}
        />
      </FormField>

      <FormField label="メンテナンス内容" error={errors.description}>
        <Textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="実施したメンテナンス内容を入力してください"
          rows={4}
        />
      </FormField>

      <div className="maintenance-record-form__actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          キャンセル
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
        >
          {isLoading ? '保存中...' : '保存'}
        </Button>
      </div>
    </form>
  );
};