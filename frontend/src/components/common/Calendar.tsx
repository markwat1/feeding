import React, { useState, useEffect } from 'react';
import './Calendar.css';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
}

interface CalendarProps {
  onDateClick?: (date: Date) => void;
  selectedDate?: Date;
  renderDayContent?: (date: Date) => React.ReactNode;
  onMonthChange?: (date: Date) => void;
  initialDate?: Date;
}

export const Calendar: React.FC<CalendarProps> = ({
  onDateClick,
  selectedDate,
  renderDayContent,
  onMonthChange,
  initialDate
}) => {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());

  const today = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Get first day of the month and calculate calendar grid
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Generate calendar days including previous/next month days for complete grid
  const generateCalendarDays = (): CalendarDay[] => {
    const days: CalendarDay[] = [];

    // Previous month days
    const prevMonth = new Date(currentYear, currentMonth - 1, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1, prevMonthDays - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: isSameDay(date, today)
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: isSameDay(date, today)
      });
    }

    // Next month days to complete the grid (42 days = 6 weeks)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear, currentMonth + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: isSameDay(date, today)
      });
    }

    return days;
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Notify parent of month changes
  useEffect(() => {
    if (onMonthChange) {
      onMonthChange(currentDate);
    }
  }, [currentDate, onMonthChange]);

  const handleDateClick = (date: Date) => {
    if (onDateClick) {
      onDateClick(date);
    }
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button 
          className="calendar-nav-btn"
          onClick={() => navigateMonth('prev')}
          aria-label="前月"
        >
          ‹
        </button>
        <h3 className="calendar-title">
          {currentYear}年 {monthNames[currentMonth]}
        </h3>
        <button 
          className="calendar-nav-btn"
          onClick={() => navigateMonth('next')}
          aria-label="次月"
        >
          ›
        </button>
      </div>

      <div className="calendar-grid">
        {/* Day headers */}
        {dayNames.map(day => (
          <div key={day} className="calendar-day-header">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((calendarDay, index) => {
          const isSelected = selectedDate && isSameDay(calendarDay.date, selectedDate);
          
          return (
            <div
              key={index}
              className={`calendar-day ${
                !calendarDay.isCurrentMonth ? 'calendar-day--other-month' : ''
              } ${
                calendarDay.isToday ? 'calendar-day--today' : ''
              } ${
                isSelected ? 'calendar-day--selected' : ''
              }`}
              onClick={() => handleDateClick(calendarDay.date)}
            >
              <div className="calendar-day-number">
                {calendarDay.date.getDate()}
              </div>
              <div className="calendar-day-content">
                {renderDayContent && renderDayContent(calendarDay.date)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};