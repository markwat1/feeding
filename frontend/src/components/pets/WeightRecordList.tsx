import React, { useState, useEffect } from 'react';
import { Pet, WeightRecord } from '../../types';
import { weightRecordApi, petApi } from '../../services/api';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import './WeightRecordList.css';

interface WeightRecordListProps {
  onEdit: (record: WeightRecord) => void;
  onAdd: () => void;
  refreshTrigger?: number;
}

export const WeightRecordList: React.FC<WeightRecordListProps> = ({ 
  onEdit, 
  onAdd, 
  refreshTrigger 
}) => {
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPets = async () => {
    try {
      const response = await petApi.getAll();
      setPets(response.data.data);
    } catch (err) {
      console.error('Error fetching pets:', err);
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const petId = selectedPetId ? Number(selectedPetId) : undefined;
      const response = await weightRecordApi.getAll(petId);
      setRecords(response.data.data);
    } catch (err) {
      setError('体重記録の取得に失敗しました');
      console.error('Error fetching weight records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [selectedPetId, refreshTrigger]);

  const handleDelete = async (id: number, petName: string, date: string) => {
    if (!window.confirm(`${petName}の${formatDate(date)}の体重記録を削除してもよろしいですか？`)) {
      return;
    }

    try {
      await weightRecordApi.delete(id);
      setRecords(records.filter(record => record.id !== id));
    } catch (err) {
      setError('体重記録の削除に失敗しました');
      console.error('Error deleting weight record:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const formatWeight = (weight: number) => {
    return `${weight.toFixed(2)}kg`;
  };

  const getPetName = (petId: number) => {
    const pet = pets.find(p => p.id === petId);
    return pet ? pet.name : '不明';
  };

  const handlePetFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPetId(e.target.value === '' ? '' : Number(e.target.value));
  };

  if (loading && records.length === 0) {
    return <div className="weight-record-list-loading">読み込み中...</div>;
  }

  return (
    <div className="weight-record-list">
      <div className="weight-record-list-header">
        <h3>体重記録</h3>
        <div className="weight-record-list-controls">
          <Select
            value={selectedPetId}
            onChange={handlePetFilterChange}
            className="pet-filter"
            options={[
              { value: '', label: 'すべてのペット' },
              ...pets.map(pet => ({
                value: pet.id,
                label: pet.name
              }))
            ]}
          />
          <Button onClick={onAdd}>体重記録を追加</Button>
        </div>
      </div>

      {error && (
        <div className="weight-record-list-error">
          <p>{error}</p>
          <Button onClick={fetchRecords}>再試行</Button>
        </div>
      )}

      {records.length === 0 && !loading ? (
        <div className="weight-record-list-empty">
          <p>
            {selectedPetId 
              ? `${getPetName(Number(selectedPetId))}の体重記録がありません` 
              : '体重記録がありません'
            }
          </p>
          <Button onClick={onAdd}>最初の体重記録を追加</Button>
        </div>
      ) : (
        <div className="weight-record-table-container">
          <table className="weight-record-table">
            <thead>
              <tr>
                <th>ペット名</th>
                <th>記録日</th>
                <th>体重</th>
                <th>メモ</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{getPetName(record.petId)}</td>
                  <td>{formatDate(record.recordedDate)}</td>
                  <td className="weight-cell">{formatWeight(record.weight)}</td>
                  <td className="notes-cell">
                    {record.notes ? (
                      <span title={record.notes}>
                        {record.notes.length > 30 
                          ? `${record.notes.substring(0, 30)}...` 
                          : record.notes
                        }
                      </span>
                    ) : (
                      <span className="no-notes">-</span>
                    )}
                  </td>
                  <td>
                    <div className="record-actions">
                      <Button 
                        size="small" 
                        variant="secondary" 
                        onClick={() => onEdit(record)}
                      >
                        編集
                      </Button>
                      <Button 
                        size="small" 
                        variant="danger" 
                        onClick={() => handleDelete(
                          record.id, 
                          getPetName(record.petId), 
                          record.recordedDate
                        )}
                      >
                        削除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loading && records.length > 0 && (
        <div className="weight-record-list-loading-overlay">
          更新中...
        </div>
      )}
    </div>
  );
};