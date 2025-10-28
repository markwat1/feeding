import React, { useState, useEffect } from 'react';
import { MaintenanceRecord } from '../../types';
import { maintenanceRecordApi } from '../../services/api';
import { MaintenanceRecordForm } from './MaintenanceRecordForm';
import { MaintenanceRecordList } from './MaintenanceRecordList';
import { Button, DateRangeFilter, Select, CsvExport } from '../common';
import './MaintenanceRecordManagement.css';

export const MaintenanceRecordManagement: React.FC = () => {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'water' | 'toilet' | ''>('');

  const fetchRecords = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (typeFilter) params.type = typeFilter;
      
      const response = await maintenanceRecordApi.getAll(Object.keys(params).length > 0 ? params : undefined);
      setRecords(response.data.data);
    } catch (error) {
      console.error('Failed to fetch maintenance records:', error);
      setError('メンテナンス記録の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [startDate, endDate, typeFilter]);

  const handleSubmit = async (data: Omit<MaintenanceRecord, 'id' | 'createdAt'>) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (editingRecord) {
        await maintenanceRecordApi.update(editingRecord.id, data);
      } else {
        await maintenanceRecordApi.create(data);
      }
      
      await fetchRecords();
      setShowForm(false);
      setEditingRecord(null);
    } catch (error) {
      console.error('Failed to save maintenance record:', error);
      setError('メンテナンス記録の保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (record: MaintenanceRecord) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    setError(null);
    try {
      await maintenanceRecordApi.delete(id);
      await fetchRecords();
    } catch (error) {
      console.error('Failed to delete maintenance record:', error);
      setError('メンテナンス記録の削除に失敗しました');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRecord(null);
  };

  const handleAddNew = () => {
    setEditingRecord(null);
    setShowForm(true);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setTypeFilter('');
  };

  const handleExport = async (params: { startDate?: string; endDate?: string }) => {
    const exportParams = { ...params };
    if (typeFilter) {
      (exportParams as any).type = typeFilter;
    }
    return await maintenanceRecordApi.exportCsv(exportParams);
  };

  return (
    <div className="maintenance-record-management">
      <div className="maintenance-record-management__header">
        <h2>メンテナンス記録</h2>
        {!showForm && (
          <Button
            variant="primary"
            onClick={handleAddNew}
          >
            新しい記録を追加
          </Button>
        )}
      </div>

      {error && (
        <div className="maintenance-record-management__error">
          {error}
        </div>
      )}

      <div className="maintenance-record-management__filters">
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onClear={clearFilters}
        />
        
        <div className="maintenance-record-management__type-filter">
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'water' | 'toilet' | '')}
            options={[
              { value: '', label: 'すべてのタイプ' },
              { value: 'water', label: '給水器' },
              { value: 'toilet', label: 'トイレ' }
            ]}
          />
        </div>
      </div>

      <CsvExport
        onExport={handleExport}
        title="メンテナンス記録のエクスポート"
        className="maintenance-record-management__export"
      />

      {showForm && (
        <div className="maintenance-record-management__form">
          <h3>{editingRecord ? 'メンテナンス記録を編集' : '新しいメンテナンス記録'}</h3>
          <MaintenanceRecordForm
            initialData={editingRecord || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isSubmitting}
          />
        </div>
      )}

      <div className="maintenance-record-management__list">
        <MaintenanceRecordList
          records={records}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};