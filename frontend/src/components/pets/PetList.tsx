import React, { useState, useEffect } from 'react';
import { Pet } from '../../types';
import { petApi } from '../../services/api';
import { Button } from '../common/Button';
import './PetList.css';

interface PetListProps {
  onEdit: (pet: Pet) => void;
  onAdd: () => void;
  refreshTrigger?: number;
}

export const PetList: React.FC<PetListProps> = ({ onEdit, onAdd, refreshTrigger }) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await petApi.getAll();
      setPets(response.data.data);
    } catch (err) {
      setError('ペット一覧の取得に失敗しました');
      console.error('Error fetching pets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, [refreshTrigger]);

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`${name}を削除してもよろしいですか？`)) {
      return;
    }

    try {
      await petApi.delete(id);
      setPets(pets.filter(pet => pet.id !== id));
    } catch (err) {
      setError('ペットの削除に失敗しました');
      console.error('Error deleting pet:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  if (loading) {
    return <div className="pet-list-loading">読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="pet-list-error">
        <p>{error}</p>
        <Button onClick={fetchPets}>再試行</Button>
      </div>
    );
  }

  return (
    <div className="pet-list">
      <div className="pet-list-header">
        <h3>登録済みペット</h3>
        <Button onClick={onAdd}>新しいペットを追加</Button>
      </div>

      {pets.length === 0 ? (
        <div className="pet-list-empty">
          <p>登録されたペットがありません</p>
          <Button onClick={onAdd}>最初のペットを追加</Button>
        </div>
      ) : (
        <div className="pet-list-grid">
          {pets.map((pet) => (
            <div key={pet.id} className="pet-card">
              <div className="pet-card-header">
                <h4>{pet.name}</h4>
                <div className="pet-card-actions">
                  <Button 
                    size="small" 
                    variant="secondary" 
                    onClick={() => onEdit(pet)}
                  >
                    編集
                  </Button>
                  <Button 
                    size="small" 
                    variant="danger" 
                    onClick={() => handleDelete(pet.id, pet.name)}
                  >
                    削除
                  </Button>
                </div>
              </div>
              <div className="pet-card-info">
                <p><strong>種類:</strong> {pet.species}</p>
                <p><strong>生年月日:</strong> {formatDate(pet.birthDate)}</p>
                <p><strong>登録日:</strong> {formatDate(pet.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};