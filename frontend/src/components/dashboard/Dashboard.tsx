import React, { useState, useEffect } from 'react';
import { FeedingRecord, MaintenanceRecord } from '../../types';
import { feedingRecordApi, maintenanceRecordApi } from '../../services/api';
import { LoadingSpinner } from '../common';
import './Dashboard.css';

interface DashboardData {
  recentFeedings: FeedingRecord[];
  recentMaintenance: MaintenanceRecord[];
  weeklyStats: {
    total: number;
    completed: number;
    rate: number;
  };
}

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      
      const startDate = weekAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      const [feedingResponse, maintenanceResponse, statsResponse] = await Promise.all([
        feedingRecordApi.getAll({ startDate, endDate }),
        maintenanceRecordApi.getRecent({ days: 7 }),
        feedingRecordApi.getStats({ startDate, endDate })
      ]);

      setData({
        recentFeedings: feedingResponse.data.data.slice(0, 5), // Last 5 feedings
        recentMaintenance: maintenanceResponse.data.data.slice(0, 3), // Last 3 maintenance
        weeklyStats: statsResponse.data.data
      });
    } catch (err) {
      setError('ダッシュボードデータの取得に失敗しました');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 0) {
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes}分前`;
      }
      return `${diffHours}時間前`;
    } else if (diffDays === 1) {
      return '昨日';
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return date.toLocaleDateString('ja-JP');
    }
  };

  const getMaintenanceTypeLabel = (type: 'water' | 'toilet') => {
    return type === 'water' ? '給水器' : 'トイレ';
  };

  const getMaintenanceTypeIcon = (type: 'water' | 'toilet') => {
    return type === 'water' ? '💧' : '🚽';
  };

  if (loading) {
    return (
      <div className="dashboard__loading">
        <LoadingSpinner />
        <p>ダッシュボードを読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard__error">
        <p>{error}</p>
        <button onClick={fetchDashboardData} className="dashboard__retry-btn">
          再試行
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h2>ダッシュボード</h2>
        <p className="dashboard__subtitle">直近7日間の餌やり状況</p>
      </div>

      <div className="dashboard__grid">
        {/* Weekly Stats */}
        <div className="dashboard__card dashboard__card--stats">
          <h3>今週の完食率</h3>
          <div className="dashboard__stats">
            <div className="dashboard__stat-main">
              <span className="dashboard__stat-value">
                {data.weeklyStats.rate.toFixed(1)}%
              </span>
              <span className="dashboard__stat-label">
                {data.weeklyStats.completed} / {data.weeklyStats.total} 回完食
              </span>
            </div>
            <div className="dashboard__progress-ring">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  fill="none"
                  stroke="#e9ecef"
                  strokeWidth="6"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  fill="none"
                  stroke={data.weeklyStats.rate >= 90 ? '#28a745' : data.weeklyStats.rate >= 70 ? '#ffc107' : '#dc3545'}
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 35 * (data.weeklyStats.rate / 100)} ${2 * Math.PI * 35}`}
                  strokeDashoffset={2 * Math.PI * 35 * 0.25}
                  transform="rotate(-90 40 40)"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Recent Feedings */}
        <div className="dashboard__card">
          <h3>最近の餌やり記録</h3>
          {data.recentFeedings.length === 0 ? (
            <p className="dashboard__no-data">最近の餌やり記録がありません</p>
          ) : (
            <div className="dashboard__feeding-list">
              {data.recentFeedings.map((feeding) => (
                <div key={feeding.id} className="dashboard__feeding-item">
                  <div className="dashboard__feeding-status">
                    <span className={`dashboard__status-badge ${feeding.completed ? 'completed' : 'incomplete'}`}>
                      {feeding.completed ? '✓' : '×'}
                    </span>
                  </div>
                  <div className="dashboard__feeding-info">
                    <div className="dashboard__feeding-time">
                      {formatDateTime(feeding.actualTime)}
                    </div>
                    <div className="dashboard__feeding-status-text">
                      {feeding.completed ? '完食' : '残した'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Maintenance */}
        <div className="dashboard__card">
          <h3>最近のメンテナンス</h3>
          {data.recentMaintenance.length === 0 ? (
            <p className="dashboard__no-data">最近のメンテナンス記録がありません</p>
          ) : (
            <div className="dashboard__maintenance-list">
              {data.recentMaintenance.map((maintenance) => (
                <div key={maintenance.id} className="dashboard__maintenance-item">
                  <div className="dashboard__maintenance-icon">
                    {getMaintenanceTypeIcon(maintenance.type)}
                  </div>
                  <div className="dashboard__maintenance-info">
                    <div className="dashboard__maintenance-type">
                      {getMaintenanceTypeLabel(maintenance.type)}
                    </div>
                    <div className="dashboard__maintenance-time">
                      {formatDateTime(maintenance.performedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};