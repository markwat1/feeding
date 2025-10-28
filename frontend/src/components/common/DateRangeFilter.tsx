import React from 'react';
import { Button, Input } from './';
import './DateRangeFilter.css';

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClear: () => void;
  onToday?: () => void;
  onThisWeek?: () => void;
  onThisMonth?: () => void;
  className?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
  onToday,
  onThisWeek,
  onThisMonth,
  className = ''
}) => {
  const hasFilter = startDate || endDate;

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getWeekRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return {
      start: startOfWeek.toISOString().split('T')[0],
      end: endOfWeek.toISOString().split('T')[0]
    };
  };

  const getMonthRange = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    return {
      start: startOfMonth.toISOString().split('T')[0],
      end: endOfMonth.toISOString().split('T')[0]
    };
  };

  const handleToday = () => {
    const today = getTodayDate();
    onStartDateChange(today);
    onEndDateChange(today);
    onToday?.();
  };

  const handleThisWeek = () => {
    const { start, end } = getWeekRange();
    onStartDateChange(start);
    onEndDateChange(end);
    onThisWeek?.();
  };

  const handleThisMonth = () => {
    const { start, end } = getMonthRange();
    onStartDateChange(start);
    onEndDateChange(end);
    onThisMonth?.();
  };

  return (
    <div className={`date-range-filter ${className}`}>
      <div className="date-range-filter__inputs">
        <div className="date-range-filter__input-group">
          <label htmlFor="start-date">開始日</label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="date-range-filter__input"
          />
        </div>
        <div className="date-range-filter__input-group">
          <label htmlFor="end-date">終了日</label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="date-range-filter__input"
          />
        </div>
      </div>
      
      <div className="date-range-filter__actions">
        <div className="date-range-filter__quick-actions">
          <Button onClick={handleToday} variant="secondary" size="small">
            今日
          </Button>
          <Button onClick={handleThisWeek} variant="secondary" size="small">
            今週
          </Button>
          <Button onClick={handleThisMonth} variant="secondary" size="small">
            今月
          </Button>
        </div>
        
        {hasFilter && (
          <Button onClick={onClear} variant="secondary" size="small">
            フィルタ解除
          </Button>
        )}
      </div>
    </div>
  );
};