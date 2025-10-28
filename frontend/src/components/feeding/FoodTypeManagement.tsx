import React, { useState } from 'react';
import { FoodType } from '../../types';
import { FoodTypeList } from './FoodTypeList';
import { FoodTypeForm } from './FoodTypeForm';

export const FoodTypeManagement: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingFoodType, setEditingFoodType] = useState<FoodType | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAdd = () => {
    setEditingFoodType(null);
    setShowForm(true);
  };

  const handleEdit = (foodType: FoodType) => {
    setEditingFoodType(foodType);
    setShowForm(true);
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingFoodType(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingFoodType(null);
  };

  return (
    <>
      <FoodTypeList
        onAdd={handleAdd}
        onEdit={handleEdit}
        refreshTrigger={refreshTrigger}
      />
      
      {showForm && (
        <FoodTypeForm
          foodType={editingFoodType}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </>
  );
};