import { useState } from 'react';
import { Pet, WeightRecord } from '../types';
import { PetList } from '../components/pets/PetList';
import { PetForm } from '../components/pets/PetForm';
import { WeightRecordList } from '../components/pets/WeightRecordList';
import { WeightRecordForm } from '../components/pets/WeightRecordForm';
import { WeightChart } from '../components/pets/WeightChart';
import { Button } from '../components/common/Button';

type ViewMode = 'pets' | 'weights' | 'chart';
type FormMode = 'pet' | 'weight' | null;

export const PetsPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('pets');
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [editingWeightRecord, setEditingWeightRecord] = useState<WeightRecord | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAddPet = () => {
    setEditingPet(null);
    setFormMode('pet');
  };

  const handleEditPet = (pet: Pet) => {
    setEditingPet(pet);
    setFormMode('pet');
  };

  const handleAddWeightRecord = () => {
    setEditingWeightRecord(null);
    setFormMode('weight');
  };

  const handleEditWeightRecord = (record: WeightRecord) => {
    setEditingWeightRecord(record);
    setFormMode('weight');
  };

  const handleFormSave = () => {
    setFormMode(null);
    setEditingPet(null);
    setEditingWeightRecord(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFormCancel = () => {
    setFormMode(null);
    setEditingPet(null);
    setEditingWeightRecord(null);
  };

  const renderContent = () => {
    if (formMode === 'pet') {
      return (
        <PetForm
          pet={editingPet}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      );
    }

    if (formMode === 'weight') {
      return (
        <WeightRecordForm
          weightRecord={editingWeightRecord}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      );
    }

    if (viewMode === 'pets') {
      return (
        <PetList
          onAdd={handleAddPet}
          onEdit={handleEditPet}
          refreshTrigger={refreshTrigger}
        />
      );
    }

    if (viewMode === 'weights') {
      return (
        <WeightRecordList
          onAdd={handleAddWeightRecord}
          onEdit={handleEditWeightRecord}
          refreshTrigger={refreshTrigger}
        />
      );
    }

    return (
      <WeightChart
        onAddRecord={handleAddWeightRecord}
      />
    );
  };

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>ペット管理</h2>
        
        {!formMode && (
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <Button
              variant={viewMode === 'pets' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('pets')}
            >
              ペット情報
            </Button>
            <Button
              variant={viewMode === 'weights' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('weights')}
            >
              体重記録
            </Button>
            <Button
              variant={viewMode === 'chart' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('chart')}
            >
              体重グラフ
            </Button>
          </div>
        )}
      </div>
      
      {renderContent()}
    </div>
  );
};