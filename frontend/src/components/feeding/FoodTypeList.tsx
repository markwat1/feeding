import React, { useState, useEffect } from 'react';
import { FoodType } from '../../types';
import { foodTypeApi } from '../../services/api';
import { Button } from '../common';
import './FoodTypeList.css';

interface FoodTypeListProps {
  onEdit: (foodType: FoodType) => void;
  onAdd: () => void;
  refreshTrigger?: number;
}

export const FoodTypeList: React.FC<FoodTypeListProps> = ({ onEdit, onAdd, refreshTrigger }) => {
  const [foodTypes, setFoodTypes] = useState<FoodType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFoodTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await foodTypeApi.getAll();
      setFoodTypes(response.data.data);
    } catch (err) {
      setError('餌の種類の取得に失敗しました');
      console.error('Error fetching food types:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoodTypes();
  }, [refreshTrigger]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('この餌の種類を削除しますか？')) {
      return;
    }

    try {
      await foodTypeApi.delete(id);
      setFoodTypes(foodTypes.filter(ft => ft.id !== id));
    } catch (err) {
      setError('削除に失敗しました');
      console.error('Error deleting food type:', err);
    }
  };

  if (loading) {
    return <div className="food-type-list-loading">読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="food-type-list-error">
        <p>{error}</p>
        <Button onClick={fetchFoodTypes}>再試行</Button>
      </div>
    );
  }

  return (
    <div className="food-type-list">
      <div className="food-type-list-header">
        <h2>餌の種類一覧</h2>
        <Button onClick={onAdd} variant="primary">
          新しい餌の種類を追加
        </Button>
      </div>

      {foodTypes.length === 0 ? (
        <div className="food-type-list-empty">
          <p>登録された餌の種類がありません</p>
          <Button onClick={onAdd}>最初の餌の種類を追加</Button>
        </div>
      ) : (
        <div className="food-type-list-grid">
          {foodTypes.map((foodType) => (
            <div key={foodType.id} className="food-type-card">
              <div className="food-type-card-header">
                <h3>{foodType.name}</h3>
                <div className="food-type-card-actions">
                  <Button 
                    onClick={() => onEdit(foodType)} 
                    variant="secondary"
                    size="small"
                  >
                    編集
                  </Button>
                  <Button 
                    onClick={() => handleDelete(foodType.id)} 
                    variant="danger"
                    size="small"
                  >
                    削除
                  </Button>
                </div>
              </div>
              
              <div className="food-type-card-content">
                {foodType.brand && (
                  <p className="food-type-brand">
                    <strong>メーカー:</strong> {foodType.brand}
                  </p>
                )}
                {foodType.description && (
                  <p className="food-type-description">
                    <strong>説明:</strong> {foodType.description}
                  </p>
                )}
                <p className="food-type-created">
                  登録日: {new Date(foodType.createdAt).toLocaleDateString('ja-JP')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};