import React from 'react';
import './CalendarDayContent.css';

interface CalendarDayContentProps {
  totalScheduled: number;
  totalFeedings: number;
  completedFeedings: number;
  completionRate: number;
  hasMaintenanceRecords: boolean;
}

export const CalendarDayContent: React.FC<CalendarDayContentProps> = ({
  totalScheduled,
  totalFeedings,
  completedFeedings,
  completionRate,
  hasMaintenanceRecords
}) => {
  // Determine the completion status color
  const getCompletionStatusClass = () => {
    if (totalScheduled === 0) return '';
    if (completionRate === 1) return 'completion-full';
    if (completionRate >= 0.5) return 'completion-partial';
    if (totalFeedings > 0) return 'completion-low';
    return 'completion-none';
  };

  // Show feeding schedule indicators (light background for scheduled feedings)
  const showScheduleIndicators = totalScheduled > 0 && totalFeedings === 0;

  return (
    <div className="calendar-day-content-wrapper">
      {/* Feeding status indicators */}
      {totalScheduled > 0 && (
        <div className={`feeding-indicator ${getCompletionStatusClass()}`}>
          {showScheduleIndicators ? (
            <div className="schedule-indicator">
              <span className="schedule-count">{totalScheduled}</span>
              <span className="schedule-label">予定</span>
            </div>
          ) : (
            <div className="feeding-status">
              <span className="feeding-count">
                {completedFeedings}/{totalScheduled}
              </span>
              {completionRate === 1 && (
                <span className="completion-icon">✓</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Maintenance indicators */}
      {hasMaintenanceRecords && (
        <div className="maintenance-indicator">
          <span className="maintenance-icon">🔧</span>
        </div>
      )}

      {/* Additional status indicators */}
      <div className="status-dots">
        {totalFeedings > 0 && (
          <div className={`status-dot feeding-dot ${getCompletionStatusClass()}`} />
        )}
        {hasMaintenanceRecords && (
          <div className="status-dot maintenance-dot" />
        )}
      </div>
    </div>
  );
};