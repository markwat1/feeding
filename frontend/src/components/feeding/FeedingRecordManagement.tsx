import React, { useState } from 'react';
import { FeedingRecord } from '../../types';
import { FeedingRecordList } from './FeedingRecordList';
import { FeedingRecordForm } from './FeedingRecordForm';

export const FeedingRecordManagement: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FeedingRecord | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAdd = () => {
    setEditingRecord(null);
    setShowForm(true);
  };

  const handleEdit = (record: FeedingRecord) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingRecord(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRecord(null);
  };

  return (
    <>
      <FeedingRecordList
        onAdd={handleAdd}
        onEdit={handleEdit}
        refreshTrigger={refreshTrigger}
        showExport={true}
      />
      
      {showForm && (
        <FeedingRecordForm
          record={editingRecord}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </>
  );
};