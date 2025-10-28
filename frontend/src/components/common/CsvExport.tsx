import React, { useState } from 'react';
import { Button, DateRangeFilter } from './';
import './CsvExport.css';

interface CsvExportProps {
  onExport: (params: { startDate?: string; endDate?: string }) => Promise<any>;
  title?: string;
  className?: string;
}

export const CsvExport: React.FC<CsvExportProps> = ({
  onExport,
  title = 'CSVエクスポート',
  className = ''
}) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    
    try {
      const params: { startDate?: string; endDate?: string } = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await onExport(params);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      const dateRange = startDate && endDate ? `_${startDate}_${endDate}` : 
                       startDate ? `_from_${startDate}` :
                       endDate ? `_until_${endDate}` : '_all';
      link.download = `export${dateRange}.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      setError('エクスポートに失敗しました');
    } finally {
      setIsExporting(false);
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className={`csv-export ${className}`}>
      <div className="csv-export__header">
        <h4>{title}</h4>
        <p className="csv-export__description">
          期間を指定してデータをCSV形式でダウンロードできます
        </p>
      </div>

      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onClear={clearFilters}
        className="csv-export__filter"
      />

      {error && (
        <div className="csv-export__error">
          {error}
        </div>
      )}

      <div className="csv-export__actions">
        <Button
          onClick={handleExport}
          disabled={isExporting}
          variant="primary"
        >
          {isExporting ? 'エクスポート中...' : 'CSVダウンロード'}
        </Button>
        
        <div className="csv-export__info">
          {startDate || endDate ? (
            <span>
              期間: {startDate || '開始日なし'} ～ {endDate || '終了日なし'}
            </span>
          ) : (
            <span>全期間のデータをエクスポートします</span>
          )}
        </div>
      </div>
    </div>
  );
};