import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedingRecordForm } from '../FeedingRecordForm';
import { feedingScheduleApi, feedingRecordApi, foodTypeApi } from '../../../services/api';
import type { FeedingSchedule, FoodType, FeedingRecord } from '../../../types';

// Mock the APIs
vi.mock('../../../services/api', () => ({
  feedingScheduleApi: {
    getAll: vi.fn()
  },
  feedingRecordApi: {
    create: vi.fn(),
    update: vi.fn()
  },
  foodTypeApi: {
    getAll: vi.fn()
  }
}));

const mockFeedingScheduleApi = feedingScheduleApi as any;
const mockFeedingRecordApi = feedingRecordApi as any;
const mockFoodTypeApi = foodTypeApi as any;

describe('FeedingRecordForm', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  const mockFoodTypes: FoodType[] = [
    {
      id: 1,
      name: 'ドライフード',
      brand: 'テストブランド',
      description: 'テスト用フード',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    }
  ];

  const mockSchedules: FeedingSchedule[] = [
    {
      id: 1,
      time: '08:00',
      foodTypeId: 1,
      isActive: true,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      foodType: mockFoodTypes[0]
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockFeedingScheduleApi.getAll.mockResolvedValue({
      data: { data: mockSchedules }
    } as any);
    mockFoodTypeApi.getAll.mockResolvedValue({
      data: { data: mockFoodTypes }
    } as any);
  });

  describe('新規作成モード', () => {
    it('スケジュール選択フォームが表示される', async () => {
      render(
        <FeedingRecordForm 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('新しい餌やり記録を追加')).toBeInTheDocument();
        expect(screen.getByText('08:00 - ドライフード')).toBeInTheDocument();
      });
    });

    it('有効なデータで新しい記録を作成できる', async () => {
      const user = userEvent.setup();
      mockFeedingRecordApi.create.mockResolvedValue({ data: { id: 1 } } as any);

      render(
        <FeedingRecordForm 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('08:00 - ドライフード')).toBeInTheDocument();
      });

      // スケジュールを選択
      const scheduleSelect = screen.getByRole('combobox');
      await user.selectOptions(scheduleSelect, '1');

      // 完食状況を選択
      const completedRadio = screen.getByLabelText('完食した');
      await user.click(completedRadio);

      // 送信
      await user.click(screen.getByRole('button', { name: '記録' }));

      await waitFor(() => {
        expect(mockFeedingRecordApi.create).toHaveBeenCalledWith(
          expect.objectContaining({
            feedingScheduleId: 1,
            completed: true
          })
        );
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('スケジュールが選択されていない場合バリデーションエラーが表示される', async () => {
      const user = userEvent.setup();

      render(
        <FeedingRecordForm 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '記録' })).toBeInTheDocument();
      });

      // スケジュールを選択せずに送信
      await user.click(screen.getByRole('button', { name: '記録' }));

      await waitFor(() => {
        expect(screen.getByText('スケジュールを選択してください')).toBeInTheDocument();
      });

      expect(mockFeedingRecordApi.create).not.toHaveBeenCalled();
    });

    it('スケジュールがない場合警告メッセージが表示される', async () => {
      mockFeedingScheduleApi.getAll.mockResolvedValue({
        data: { data: [] }
      } as any);

      render(
        <FeedingRecordForm 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('有効なスケジュールが登録されていません。先にスケジュールを登録してください。')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '戻る' })).toBeInTheDocument();
      });
    });
  });

  describe('編集モード', () => {
    const mockRecord: FeedingRecord = {
      id: 1,
      feedingScheduleId: 1,
      actualTime: '2023-10-28T08:15:00Z',
      completed: true,
      notes: 'テストメモ',
      createdAt: '2023-10-28T08:15:00Z',
      feedingSchedule: mockSchedules[0]
    };

    it('既存の記録情報がフォームに表示される', async () => {
      render(
        <FeedingRecordForm 
          record={mockRecord}
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('餌やり記録を編集')).toBeInTheDocument();
        expect(screen.getByDisplayValue('テストメモ')).toBeInTheDocument();
        expect(screen.getByLabelText('完食した')).toBeChecked();
      });
    });

    it('記録を更新できる', async () => {
      const user = userEvent.setup();
      mockFeedingRecordApi.update.mockResolvedValue({ data: mockRecord } as any);

      render(
        <FeedingRecordForm 
          record={mockRecord}
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('テストメモ')).toBeInTheDocument();
      });

      // 完食状況を変更
      const notCompletedRadio = screen.getByLabelText('残した');
      await user.click(notCompletedRadio);

      // メモを変更
      const notesTextarea = screen.getByDisplayValue('テストメモ');
      await user.clear(notesTextarea);
      await user.type(notesTextarea, '更新されたメモ');

      await user.click(screen.getByRole('button', { name: '更新' }));

      await waitFor(() => {
        expect(mockFeedingRecordApi.update).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            completed: false,
            notes: '更新されたメモ'
          })
        );
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('編集時はスケジュール選択が無効になる', async () => {
      render(
        <FeedingRecordForm 
          record={mockRecord}
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      await waitFor(() => {
        const scheduleSelect = screen.getByRole('combobox');
        expect(scheduleSelect).toBeDisabled();
        expect(screen.getByText('編集時はスケジュールを変更できません')).toBeInTheDocument();
      });
    });
  });

  describe('キャンセル機能', () => {
    it('キャンセルボタンをクリックするとonCancelが呼ばれる', async () => {
      const user = userEvent.setup();

      render(
        <FeedingRecordForm 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'キャンセル' }));

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });
});