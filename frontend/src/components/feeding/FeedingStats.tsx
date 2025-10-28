import React, { useState, useEffect } from 'react';
import { feedingRecordApi } from '../../services/api';
import { DateRangeFilter, LoadingSpinner } from '../common';
import './FeedingStats.css';

interface FeedingStatsData {
  total: number;
  completed: number;
  rate: number;
}

export const FeedingStats: React.FC = () => {
  const [stats, setStats] = useState<FeedingStatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    if (startDate && endDate) {
      fetchStats();
    } else {
      // Set default to last 7 days
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      
      const todayStr = today.toISOString().split('T')[0];
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      
      setStartDate(weekAgoStr);
      setEndDate(todayStr);
    }
  }, [startDate, endDate]);

  const fetchStats = async () => {
    if (!startDate || !endDate) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await feedingRecordApi.getStats({ startDate, endDate });
      setStats(response.data.data);
    } catch (err) {
      setError('統計データの取得に失敗しました');
      console.error('Error fetching feeding stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    setStartDate(weekAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 90) return '#28a745'; // Green
    if (rate >= 70) return '#ffc107'; // Yellow
    return '#dc3545'; // Red
  };

  const getCompletionRateLabel = (rate: number) => {
    if (rate >= 90) return '優秀';
    if (rate >= 70) return '良好';
    return '要改善';
  };

  return (
    <div className="feeding-stats">
      <div className="feeding-stats__header">
        <h3>餌やり完食率統計</h3>
      </div>

      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onClear={clearFilters}
        className="feeding-stats__filter"
      />

      {loading && (
        <div className="feeding-stats__loading">
          <LoadingSpinner />
        </div>
      )}

      {error && (
        <div className="feeding-stats__error">
          {error}
        </div>
      )}

      {stats && !loading && (
        <div className="feeding-stats__content">
          <div className="feeding-stats__summary">
            <div className="feeding-stats__card">
              <div className="feeding-stats__card-header">
                <h4>期間内の餌やり回数</h4>
              </div>
              <div className="feeding-stats__card-value">
                {stats.total}回
              </div>
            </div>

            <div className="feeding-stats__card">
              <div className="feeding-stats__card-header">
                <h4>完食回数</h4>
              </div>
              <div className="feeding-stats__card-value">
                {stats.completed}回
              </div>
            </div>

            <div className="feeding-stats__card feeding-stats__card--highlight">
              <div className="feeding-stats__card-header">
                <h4>完食率</h4>
              </div>
              <div 
                className="feeding-stats__card-value"
                style={{ color: getCompletionRateColor(stats.rate) }}
              >
                {stats.rate.toFixed(1)}%
              </div>
              <div 
                className="feeding-stats__card-label"
                style={{ color: getCompletionRateColor(stats.rate) }}
              >
                {getCompletionRateLabel(stats.rate)}
              </div>
            </div>
          </div>

          <div className="feeding-stats__progress">
            <div className="feeding-stats__progress-label">
              完食率の推移
            </div>
            <div className="feeding-stats__progress-bar">
              <div 
                className="feeding-stats__progress-fill"
                style={{ 
                  width: `${stats.rate}%`,
                  backgroundColor: getCompletionRateColor(stats.rate)
                }}
              />
            </div>
            <div className="feeding-stats__progress-text">
              {stats.completed} / {stats.total} 回完食
            </div>
          </div>

          {stats.total === 0 && (
            <div className="feeding-stats__no-data">
              選択した期間に餌やり記録がありません
            </div>
          )}
        </div>
      )}
    </div>
  );
};