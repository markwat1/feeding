import React, { useState, useEffect } from 'react';
import { Pet } from '../../types';
import { petApi } from '../../services/api';
import { Button } from '../common/Button';
import { FormField } from '../common/FormField';
import { Input } from '../common/Input';
import './PetForm.css';

interface PetFormProps {
  pet?: Pet | null;
  onSave: () => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  species: string;
  birthDate: string;
}

interface FormErrors {
  name?: string;
  species?: string;
  birthDate?: string;
}

export const PetForm: React.FC<PetFormProps> = ({ pet, onSave, onCancel }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    species: '',
    birthDate: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (pet) {
      setFormData({
        name: pet.name,
        species: pet.species,
        birthDate: pet.birthDate.split('T')[0] // Convert to YYYY-MM-DD format
      });
    } else {
      setFormData({
        name: '',
        species: '',
        birthDate: ''
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [pet]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'ペット名は必須です';
    } else if (formData.name.length > 50) {
      newErrors.name = 'ペット名は50文字以内で入力してください';
    }

    if (!formData.species.trim()) {
      newErrors.species = '種類は必須です';
    } else if (formData.species.length > 50) {
      newErrors.species = '種類は50文字以内で入力してください';
    }

    if (!formData.birthDate) {
      newErrors.birthDate = '生年月日は必須です';
    } else {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      if (birthDate > today) {
        newErrors.birthDate = '生年月日は今日以前の日付を入力してください';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
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
      const petData = {
        name: formData.name.trim(),
        species: formData.species.trim(),
        birthDate: formData.birthDate
      };

      if (pet) {
        await petApi.update(pet.id, petData);
      } else {
        await petApi.create(petData);
      }

      onSave();
    } catch (err: any) {
      console.error('Error saving pet:', err);
      setSubmitError(
        err.response?.data?.error?.message || 
        'ペットの保存に失敗しました'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pet-form-container">
      <div className="pet-form-header">
        <h3>{pet ? 'ペット情報編集' : '新しいペット登録'}</h3>
      </div>

      <form onSubmit={handleSubmit} className="pet-form">
        <FormField label="ペット名" required error={errors.name}>
          <Input
            type="text"
            value={formData.name}
            onChange={handleInputChange('name')}
            error={!!errors.name}
            placeholder="例: ポチ"
            maxLength={50}
          />
        </FormField>

        <FormField label="種類" required error={errors.species}>
          <Input
            type="text"
            value={formData.species}
            onChange={handleInputChange('species')}
            error={!!errors.species}
            placeholder="例: 犬、猫、うさぎ"
            maxLength={50}
          />
        </FormField>

        <FormField label="生年月日" required error={errors.birthDate}>
          <Input
            type="date"
            value={formData.birthDate}
            onChange={handleInputChange('birthDate')}
            error={!!errors.birthDate}
            max={new Date().toISOString().split('T')[0]}
          />
        </FormField>

        {submitError && (
          <div className="pet-form-error">
            {submitError}
          </div>
        )}

        <div className="pet-form-actions">
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
            {pet ? '更新' : '登録'}
          </Button>
        </div>
      </form>
    </div>
  );
};