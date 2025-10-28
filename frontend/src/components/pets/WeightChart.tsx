import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { Pet, WeightRecord } from '../../types';
import { weightRecordApi, petApi } from '../../services/api';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import './WeightChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface WeightChartProps {
  onAddRecord?: () => void;
}

type PeriodOption = '1month' | '3months' | '6months' | '1year' | 'all';

const PERIOD_OPTIONS = [
  { value: '1month' as PeriodOption, label: '1ヶ月' },
  { value: '3months' as PeriodOption, label: '3ヶ月' },
  { value: '6months' as PeriodOption, label: '6ヶ月' },
  { value: '1year' as PeriodOption, label: '1年' },
  { value: 'all' as PeriodOption, label: 'すべて' },
];

export const WeightChart: React.FC<WeightChartProps> = ({ onAddRecord }) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<number | ''>('');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('3months');
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPets();
  }, []);

  useEffect(() => {
    if (selectedPetId) {
      fetchWeightRecords();
    } else {
      setRecords([]);
    }
  }, [selectedPetId, selectedPeriod]);

  const fetchPets = async () => {
    try {
      const response = await petApi.getAll();
      const petsData = response.data.data;
      setPets(petsData);
      
      // Auto-select first pet if available
      if (petsData.length > 0) {
        setSelectedPetId(petsData[0].id);
      }
    } catch (err) {
      setError('ペット情報の取得に失敗しました');
      console.error('Error fetching pets:', err);
    }
  };

  const fetchWeightRecords = async () => {
    if (!selectedPetId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await weightRecordApi.getAll(Number(selectedPetId));
      let recordsData = response.data.data;

      // Filter by period
      if (selectedPeriod !== 'all') {
        const now = new Date();
        const cutoffDate = new Date();
        
        switch (selectedPeriod) {
          case '1month':
            cutoffDate.setMonth(now.getMonth() - 1);
            break;
          case '3months':
            cutoffDate.setMonth(now.getMonth() - 3);
            break;
          case '6months':
            cutoffDate.setMonth(now.getMonth() - 6);
            break;
          case '1year':
            cutoffDate.setFullYear(now.getFullYear() - 1);
            break;
        }

        recordsData = recordsData.filter(record => 
          new Date(record.recordedDate) >= cutoffDate
        );
      }

      // Sort by date
      recordsData.sort((a, b) => 
        new Date(a.recordedDate).getTime() - new Date(b.recordedDate).getTime()
      );

      setRecords(recordsData);
    } catch (err) {
      setError('体重記録の取得に失敗しました');
      console.error('Error fetching weight records:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPetName = (petId: number) => {
    const pet = pets.find(p => p.id === petId);
    return pet ? pet.name : '不明';
  };

  const chartData = {
    labels: records.map(record => record.recordedDate),
    datasets: [
      {
        label: `${selectedPetId ? getPetName(Number(selectedPetId)) : ''}の体重`,
        data: records.map(record => ({
          x: record.recordedDate,
          y: record.weight,
        })),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '体重推移グラフ',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const record = records[context.dataIndex];
            let label = `体重: ${context.parsed.y.toFixed(2)}kg`;
            if (record.notes) {
              label += `\nメモ: ${record.notes}`;
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'day' as const,
          displayFormats: {
            day: 'MM/dd',
          },
        },
        title: {
          display: true,
          text: '日付',
        },
      },
      y: {
        title: {
          display: true,
          text: '体重 (kg)',
        },
        beginAtZero: false,
      },
    },
  };

  if (pets.length === 0 && !loading) {
    return (
      <div className="weight-chart-empty">
        <p>グラフを表示するには、まずペットを登録してください。</p>
      </div>
    );
  }

  return (
    <div className="weight-chart-container">
      <div className="weight-chart-header">
        <h3>体重推移グラフ</h3>
        <div className="weight-chart-controls">
          <Select
            value={selectedPetId}
            onChange={(e) => setSelectedPetId(e.target.value === '' ? '' : Number(e.target.value))}
            className="pet-selector"
            placeholder="ペットを選択"
            options={pets.map(pet => ({
              value: pet.id,
              label: pet.name
            }))}
          />
          
          <Select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as PeriodOption)}
            className="period-selector"
            disabled={!selectedPetId}
            options={PERIOD_OPTIONS.map(option => ({
              value: option.value,
              label: option.label
            }))}
          />

          {onAddRecord && (
            <Button onClick={onAddRecord} disabled={!selectedPetId}>
              体重記録を追加
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="weight-chart-error">
          <p>{error}</p>
          <Button onClick={fetchWeightRecords}>再試行</Button>
        </div>
      )}

      {loading ? (
        <div className="weight-chart-loading">
          読み込み中...
        </div>
      ) : !selectedPetId ? (
        <div className="weight-chart-no-selection">
          <p>ペットを選択してください</p>
        </div>
      ) : records.length === 0 ? (
        <div className="weight-chart-no-data">
          <p>{getPetName(Number(selectedPetId))}の体重記録がありません</p>
          {onAddRecord && (
            <Button onClick={onAddRecord}>
              最初の体重記録を追加
            </Button>
          )}
        </div>
      ) : (
        <div className="weight-chart-wrapper">
          <Line data={chartData} options={chartOptions} />
          <div className="weight-chart-stats">
            <div className="stat-item">
              <span className="stat-label">記録数:</span>
              <span className="stat-value">{records.length}回</span>
            </div>
            {records.length > 1 && (
              <>
                <div className="stat-item">
                  <span className="stat-label">最新体重:</span>
                  <span className="stat-value">{records[records.length - 1].weight.toFixed(2)}kg</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">体重変化:</span>
                  <span className={`stat-value ${
                    records[records.length - 1].weight - records[0].weight >= 0 
                      ? 'positive' 
                      : 'negative'
                  }`}>
                    {(records[records.length - 1].weight - records[0].weight >= 0 ? '+' : '')}
                    {(records[records.length - 1].weight - records[0].weight).toFixed(2)}kg
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};