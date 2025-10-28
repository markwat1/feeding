import { useState } from 'react';
import { Calendar, CalendarDayContent, CalendarDayDetailModal, LoadingSpinner } from '../components/common';
import { useCalendarData } from '../hooks/useCalendarData';

export const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { loading, error, getCompletionStatus, getDataForDate } = useCalendarData(currentMonth);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleMonthChange = (date: Date) => {
    setCurrentMonth(date);
  };

  const renderDayContent = (date: Date) => {
    const status = getCompletionStatus(date);
    
    return (
      <CalendarDayContent
        totalScheduled={status.totalScheduled}
        totalFeedings={status.totalFeedings}
        completedFeedings={status.completedFeedings}
        completionRate={status.completionRate}
        hasMaintenanceRecords={status.hasMaintenanceRecords}
      />
    );
  };

  if (error) {
    return (
      <div className="calendar-page">
        <div className="page-header">
          <h2>カレンダービュー</h2>
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  const selectedDateData = selectedDate ? getDataForDate(selectedDate) : null;

  return (
    <div className="calendar-page">
      <div className="page-header">
        <h2>カレンダービュー</h2>
        <p>月間カレンダーで餌やり記録とメンテナンス記録を確認します。日付をクリックすると詳細が表示されます。</p>
      </div>
      
      {loading && <LoadingSpinner />}
      
      <div className="calendar-container">
        <Calendar
          selectedDate={selectedDate}
          onDateClick={handleDateClick}
          onMonthChange={handleMonthChange}
          renderDayContent={renderDayContent}
          initialDate={currentMonth}
        />
      </div>

      {/* Detail Modal */}
      {selectedDate && selectedDateData && (
        <CalendarDayDetailModal
          date={selectedDate}
          feedingRecords={selectedDateData.feedingRecords}
          maintenanceRecords={selectedDateData.maintenanceRecords}
          scheduledFeedings={selectedDateData.scheduledFeedings}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};