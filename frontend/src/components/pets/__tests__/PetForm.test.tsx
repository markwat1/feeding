import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PetForm } from '../PetForm';
import { petApi } from '../../../services/api';
import type { Pet } from '../../../types';

// Mock the API
vi.mock('../../../services/api', () => ({
  petApi: {
    create: vi.fn(),
    update: vi.fn()
  }
}));

const mockPetApi = petApi as any;

describe('PetForm', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('新規作成モード', () => {
    it('空のフォームが表示される', () => {
      render(
        <PetForm 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      expect(screen.getByDisplayValue('')).toBeInTheDocument();
      expect(screen.getByText('新しいペット登録')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '登録' })).toBeInTheDocument();
    });

    it('有効なデータで新しいペットを作成できる', async () => {
      const user = userEvent.setup();
      mockPetApi.create.mockResolvedValue({ data: { id: 1 } } as any);

      render(
        <PetForm 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      // フォームに入力
      await user.type(screen.getByLabelText(/ペット名/), 'テスト猫');
      await user.type(screen.getByLabelText(/種類/), '猫');
      await user.type(screen.getByLabelText(/生年月日/), '2020-01-15');

      // 送信
      await user.click(screen.getByRole('button', { name: '登録' }));

      await waitFor(() => {
        expect(mockPetApi.create).toHaveBeenCalledWith({
          name: 'テスト猫',
          species: '猫',
          birthDate: '2020-01-15'
        });
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('必須フィールドが空の場合バリデーションエラーが表示される', async () => {
      const user = userEvent.setup();

      render(
        <PetForm 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      // 空のまま送信
      await user.click(screen.getByRole('button', { name: '登録' }));

      await waitFor(() => {
        expect(screen.getByText('ペット名は必須です')).toBeInTheDocument();
        expect(screen.getByText('種類は必須です')).toBeInTheDocument();
        expect(screen.getByText('生年月日は必須です')).toBeInTheDocument();
      });

      expect(mockPetApi.create).not.toHaveBeenCalled();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('未来の日付を入力した場合バリデーションエラーが表示される', async () => {
      const user = userEvent.setup();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      render(
        <PetForm 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      await user.type(screen.getByLabelText(/ペット名/), 'テスト');
      await user.type(screen.getByLabelText(/種類/), '猫');
      await user.type(screen.getByLabelText(/生年月日/), futureDateStr);

      await user.click(screen.getByRole('button', { name: '登録' }));

      await waitFor(() => {
        expect(screen.getByText('生年月日は今日以前の日付を入力してください')).toBeInTheDocument();
      });
    });
  });

  describe('編集モード', () => {
    const mockPet: Pet = {
      id: 1,
      name: '既存のペット',
      species: '犬',
      birthDate: '2020-01-15T00:00:00Z',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    };

    it('既存のペット情報がフォームに表示される', () => {
      render(
        <PetForm 
          pet={mockPet}
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      expect(screen.getByDisplayValue('既存のペット')).toBeInTheDocument();
      expect(screen.getByDisplayValue('犬')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2020-01-15')).toBeInTheDocument();
      expect(screen.getByText('ペット情報編集')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument();
    });

    it('ペット情報を更新できる', async () => {
      const user = userEvent.setup();
      mockPetApi.update.mockResolvedValue({ data: mockPet } as any);

      render(
        <PetForm 
          pet={mockPet}
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      // 名前を変更
      const nameInput = screen.getByDisplayValue('既存のペット');
      await user.clear(nameInput);
      await user.type(nameInput, '更新されたペット');

      await user.click(screen.getByRole('button', { name: '更新' }));

      await waitFor(() => {
        expect(mockPetApi.update).toHaveBeenCalledWith(1, {
          name: '更新されたペット',
          species: '犬',
          birthDate: '2020-01-15'
        });
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe('キャンセル機能', () => {
    it('キャンセルボタンをクリックするとonCancelが呼ばれる', async () => {
      const user = userEvent.setup();

      render(
        <PetForm 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      await user.click(screen.getByRole('button', { name: 'キャンセル' }));

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('エラーハンドリング', () => {
    it('API エラー時にエラーメッセージが表示される', async () => {
      const user = userEvent.setup();
      mockPetApi.create.mockRejectedValue({
        response: {
          data: {
            error: {
              message: 'サーバーエラーが発生しました'
            }
          }
        }
      });

      render(
        <PetForm 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      await user.type(screen.getByLabelText(/ペット名/), 'テスト');
      await user.type(screen.getByLabelText(/種類/), '猫');
      await user.type(screen.getByLabelText(/生年月日/), '2020-01-15');

      await user.click(screen.getByRole('button', { name: '登録' }));

      await waitFor(() => {
        expect(screen.getByText('サーバーエラーが発生しました')).toBeInTheDocument();
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });
});