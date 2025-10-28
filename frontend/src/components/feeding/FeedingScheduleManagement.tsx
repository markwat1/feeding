import React, { useState } from 'react';
import { FeedingSchedule } from '../../types';
import { FeedingScheduleList } from './FeedingScheduleList';
import { FeedingScheduleForm } from './FeedingScheduleForm';

export const FeedingScheduleManagement: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<FeedingSchedule | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAdd = () => {
    setEditingSchedule(null);
    setShowForm(true);
  };

  const handleEdit = (schedule: FeedingSchedule) => {
    setEditingSchedule(schedule);
    setShowForm(true);
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingSchedule(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSchedule(null);
  };

  return (
    <>
      <FeedingScheduleList
        onAdd={handleAdd}
        onEdit={handleEdit}
        refreshTrigger={refreshTrigger}
      />
      
      {showForm && (
        <FeedingScheduleForm
          schedule={editingSchedule}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </>
  );
};