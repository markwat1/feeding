import { useState } from 'react';
import { 
  FoodTypeManagement, 
  FeedingScheduleManagement, 
  FeedingRecordManagement,
  FeedingStats
} from '../components/feeding';
import './FeedingPage.css';

type FeedingTab = 'foodTypes' | 'schedules' | 'records' | 'stats';

export const FeedingPage = () => {
  const [activeTab, setActiveTab] = useState<FeedingTab>('foodTypes');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'foodTypes':
        return <FoodTypeManagement />;
      case 'schedules':
        return <FeedingScheduleManagement />;
      case 'records':
        return <FeedingRecordManagement />;
      case 'stats':
        return <FeedingStats />;
      default:
        return null;
    }
  };

  return (
    <div className="feeding-page">
      <div className="feeding-page-header">
        <h1>餌やり管理</h1>
        <p>餌の種類、スケジュール、記録を管理します。</p>
      </div>

      <div className="feeding-tabs">
        <button
          className={`feeding-tab ${activeTab === 'foodTypes' ? 'active' : ''}`}
          onClick={() => setActiveTab('foodTypes')}
        >
          餌の種類
        </button>
        <button
          className={`feeding-tab ${activeTab === 'schedules' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedules')}
        >
          スケジュール
        </button>
        <button
          className={`feeding-tab ${activeTab === 'records' ? 'active' : ''}`}
          onClick={() => setActiveTab('records')}
        >
          記録
        </button>
        <button
          className={`feeding-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          統計
        </button>
      </div>

      <div className="feeding-tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
};