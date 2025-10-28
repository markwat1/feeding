import React from 'react';
import { MaintenanceRecord } from '../../types';
import { Button } from '../common';
import './MaintenanceRecordList.css';

interface MaintenanceRecordListProps {
  records: MaintenanceRecord[];
  onEdit: (record: MaintenanceRecord) => void;
  onDelete: (id: number) => void;
  isLoading?: boolean;
}

export const MaintenanceRecordList: React.FC<MaintenanceRecordListProps> = ({
  records,
  onEdit,
  onDelete,
  isLoading = false
}) => {
  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMaintenanceTypeLabel = (type: 'water' | 'toilet') => {
    return type === 'water' ? '給水器' : 'トイレ';
  };

  const getMaintenanceTypeIcon = (type: 'water' | 'toilet') => {
    return type === 'water' ? '💧' : '🚽';
  };

  if (isLoading) {
    return (
      <div className="maintenance-record-list__loading">
        読み込み中...
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="maintenance-record-list__empty">
        <p>メンテナンス記録がありません</p>
        <p>新しい記録を追加してください</p>
      </div>
    );
  }

  return (
    <div className="maintenance-record-list">
      {records.map((record) => (
        <div key={record.id} className="maintenance-record-item">
          <div className="maintenance-record-item__header">
            <div className="maintenance-record-item__type">
              <span className="maintenance-record-item__icon">
                {getMaintenanceTypeIcon(record.type)}
              </span>
              <span className="maintenance-record-item__type-label">
                {getMaintenanceTypeLabel(record.type)}
              </span>
            </div>
            <div className="maintenance-record-item__datetime">
              {formatDateTime(record.performedAt)}
            </div>
          </div>
          
          {record.description && (
            <div className="maintenance-record-item__description">
              {record.description}
            </div>
          )}
          
          <div className="maintenance-record-item__actions">
            <Button
              variant="secondary"
              size="small"
              onClick={() => onEdit(record)}
            >
              編集
            </Button>
            <Button
              variant="danger"
              size="small"
              onClick={() => {
                if (window.confirm('この記録を削除しますか？')) {
                  onDelete(record.id);
                }
              }}
            >
              削除
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};