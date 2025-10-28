import React from 'react';
import { Button } from './Button';
import type { FeedingRecord, MaintenanceRecord, FeedingSchedule } from '../../types';
import './CalendarDayDetailModal.css';

interface CalendarDayDetailModalProps {
  date: Date;
  feedingRecords: FeedingRecord[];
  maintenanceRecords: MaintenanceRecord[];
  scheduledFeedings: FeedingSchedule[];
  isOpen: boolean;
  onClose: () => void;
}

export const CalendarDayDetailModal: React.FC<CalendarDayDetailModalProps> = ({
  date,
  feedingRecords,
  maintenanceRecords,
  scheduledFeedings,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  // Get scheduled feedings that don't have corresponding records
  const getUncompletedSchedules = () => {
    return scheduledFeedings.filter(schedule => {
      return !feedingRecords.some(record => 
        record.feedingScheduleId === schedule.id
      );
    });
  };

  const uncompletedSchedules = getUncompletedSchedules();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{formatDate(date)}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Feeding Records Section */}
          <section className="detail-section">
            <h4>餌やり記録</h4>
            {feedingRecords.length > 0 ? (
              <div className="records-list">
                {feedingRecords.map(record => (
                  <div key={record.id} className="record-item feeding-record">
                    <div className="record-header">
                      <span className="record-time">
                        {formatTime(record.actualTime)}
                      </span>
                      <span className={`completion-status ${record.completed ? 'completed' : 'incomplete'}`}>
                        {record.completed ? '完食' : '未完食'}
                      </span>
                    </div>
                    {record.feedingSchedule?.foodType && (
                      <div className="record-details">
                        <span className="food-name">
                          {record.feedingSchedule.foodType.name}
                        </span>
                        {record.feedingSchedule.foodType.brand && (
                          <span className="food-brand">
                            ({record.feedingSchedule.foodType.brand})
                          </span>
                        )}
                      </div>
                    )}
                    {record.notes && (
                      <div className="record-notes">
                        {record.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-records">この日の餌やり記録はありません</p>
            )}
          </section>

          {/* Uncompleted Schedules Section */}
          {uncompletedSchedules.length > 0 && (
            <section className="detail-section">
              <h4>未実施の予定</h4>
              <div className="records-list">
                {uncompletedSchedules.map(schedule => (
                  <div key={schedule.id} className="record-item schedule-item">
                    <div className="record-header">
                      <span className="record-time">{schedule.time}</span>
                      <span className="schedule-status">予定</span>
                    </div>
                    {schedule.foodType && (
                      <div className="record-details">
                        <span className="food-name">
                          {schedule.foodType.name}
                        </span>
                        {schedule.foodType.brand && (
                          <span className="food-brand">
                            ({schedule.foodType.brand})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Maintenance Records Section */}
          <section className="detail-section">
            <h4>メンテナンス記録</h4>
            {maintenanceRecords.length > 0 ? (
              <div className="records-list">
                {maintenanceRecords.map(record => (
                  <div key={record.id} className="record-item maintenance-record">
                    <div className="record-header">
                      <span className="record-time">
                        {formatTime(record.performedAt)}
                      </span>
                      <span className={`maintenance-type ${record.type}`}>
                        {record.type === 'water' ? '給水器' : 'トイレ'}
                      </span>
                    </div>
                    {record.description && (
                      <div className="record-notes">
                        {record.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-records">この日のメンテナンス記録はありません</p>
            )}
          </section>

          {/* Summary Section */}
          <section className="detail-section summary-section">
            <h4>サマリー</h4>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-label">餌やり予定:</span>
                <span className="stat-value">{scheduledFeedings.length}回</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">実施済み:</span>
                <span className="stat-value">{feedingRecords.length}回</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">完食:</span>
                <span className="stat-value">
                  {feedingRecords.filter(r => r.completed).length}回
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">メンテナンス:</span>
                <span className="stat-value">{maintenanceRecords.length}回</span>
              </div>
            </div>
          </section>
        </div>

        <div className="modal-footer">
          <Button variant="secondary" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </div>
  );
};