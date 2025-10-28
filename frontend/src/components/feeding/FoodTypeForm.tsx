import React, { useState, useEffect } from 'react';
import { FoodType } from '../../types';
import { foodTypeApi } from '../../services/api';
import { Button, Input, Textarea, FormField } from '../common';
import './FoodTypeForm.css';

interface FoodTypeFormProps {
  foodType?: FoodType | null;
  onSave: () => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  brand: string;
  description: string;
}

export const FoodTypeForm: React.FC<FoodTypeFormProps> = ({ foodType, onSave, onCancel }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    brand: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    if (foodType) {
      setFormData({
        name: foodType.name,
        brand: foodType.brand || '',
        description: foodType.description || ''
      });
    } else {
      setFormData({
        name: '',
        brand: '',
        description: ''
      });
    }
    setError(null);
    setErrors({});
  }, [foodType]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = '餌の名前は必須です';
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
        name: formData.name.trim(),
        brand: formData.brand.trim() || undefined,
        description: formData.description.trim() || undefined
      };

      if (foodType) {
        await foodTypeApi.update(foodType.id, submitData);
      } else {
        await foodTypeApi.create(submitData);
      }

      onSave();
    } catch (err) {
      setError(foodType ? '更新に失敗しました' : '登録に失敗しました');
      console.error('Error saving food type:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="food-type-form-container">
      <div className="food-type-form">
        <div className="food-type-form-header">
          <h2>{foodType ? '餌の種類を編集' : '新しい餌の種類を追加'}</h2>
        </div>

        {error && (
          <div className="food-type-form-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <FormField
            label="餌の名前"
            required
            error={errors.name}
          >
            <Input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="例: ロイヤルカナン キトン"
              disabled={loading}
            />
          </FormField>

          <FormField
            label="メーカー名"
            error={errors.brand}
          >
            <Input
              value={formData.brand}
              onChange={(e) => handleChange('brand', e.target.value)}
              placeholder="例: ロイヤルカナン"
              disabled={loading}
            />
          </FormField>

          <FormField
            label="説明"
            error={errors.description}
          >
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="餌の特徴や注意事項など"
              rows={4}
              disabled={loading}
            />
          </FormField>

          <div className="food-type-form-actions">
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
              {loading ? '保存中...' : (foodType ? '更新' : '登録')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};