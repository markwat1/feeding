# 設計書

## 概要

ペット餌記録システムは、React + TypeScript フロントエンドと Node.js + Express バックエンドを使用したWebアプリケーションです。SQLiteデータベースを使用してデータを永続化し、RESTful APIを通じてフロントエンドとバックエンドが通信します。

## アーキテクチャ

### システム構成

```
┌─────────────────┐    HTTP/REST API    ┌─────────────────┐
│   Frontend      │ ◄─────────────────► │   Backend       │
│   React + TS    │                     │   Node.js       │
│   - UI Components│                     │   - Express API │
│   - State Mgmt  │                     │   - Business    │
│   - Routing     │                     │     Logic       │
└─────────────────┘                     └─────────────────┘
                                                   │
                                                   ▼
                                        ┌─────────────────┐
                                        │   Database      │
                                        │   SQLite        │
                                        │   - Tables      │
                                        │   - Relations   │
                                        └─────────────────┘
```

### 技術スタック

**フロントエンド:**
- React 18 with TypeScript
- React Router for navigation
- React Hook Form for form handling
- Chart.js for weight tracking graphs
- CSS Modules for styling
- Date-fns for date manipulation

**バックエンド:**
- Node.js with Express
- TypeScript
- SQLite3 with better-sqlite3 driver
- CORS middleware
- Express validator for input validation

## コンポーネントとインターフェース

### フロントエンドコンポーネント構造

```
src/
├── components/
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── Navigation.tsx
│   │   └── Calendar.tsx
│   ├── pets/
│   │   ├── PetList.tsx
│   │   ├── PetForm.tsx
│   │   └── WeightChart.tsx
│   ├── feeding/
│   │   ├── FeedingScheduleList.tsx
│   │   ├── FeedingScheduleForm.tsx
│   │   ├── FeedingRecordForm.tsx
│   │   └── FeedingRecordList.tsx
│   ├── maintenance/
│   │   ├── MaintenanceForm.tsx
│   │   └── MaintenanceList.tsx
│   └── dashboard/
│       ├── Dashboard.tsx
│       └── FeedingStats.tsx
├── pages/
│   ├── HomePage.tsx
│   ├── PetsPage.tsx
│   ├── FeedingPage.tsx
│   ├── MaintenancePage.tsx
│   └── CalendarPage.tsx
├── hooks/
│   ├── usePets.ts
│   ├── useFeeding.ts
│   └── useMaintenance.ts
├── services/
│   └── api.ts
└── types/
    └── index.ts
```

### バックエンドAPI構造

```
src/
├── routes/
│   ├── pets.ts
│   ├── foodTypes.ts
│   ├── feedingSchedules.ts
│   ├── feedingRecords.ts
│   ├── weightRecords.ts
│   └── maintenanceRecords.ts
├── models/
│   ├── Pet.ts
│   ├── FoodType.ts
│   ├── FeedingSchedule.ts
│   ├── FeedingRecord.ts
│   ├── WeightRecord.ts
│   └── MaintenanceRecord.ts
├── database/
│   ├── connection.ts
│   └── migrations.ts
├── middleware/
│   ├── validation.ts
│   └── errorHandler.ts
└── app.ts
```

## データモデル

### データベーススキーマ

```sql
-- ペット情報
CREATE TABLE pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    birth_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 餌の種類
CREATE TABLE food_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    brand TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 餌やりスケジュール
CREATE TABLE feeding_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time TEXT NOT NULL, -- HH:MM format
    food_type_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (food_type_id) REFERENCES food_types(id)
);

-- 餌やり記録
CREATE TABLE feeding_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feeding_schedule_id INTEGER NOT NULL,
    actual_time DATETIME NOT NULL,
    completed BOOLEAN NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feeding_schedule_id) REFERENCES feeding_schedules(id)
);

-- 体重記録
CREATE TABLE weight_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    recorded_date DATE NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(id)
);

-- メンテナンス記録
CREATE TABLE maintenance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, -- 'water' or 'toilet'
    performed_at DATETIME NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### TypeScript型定義

```typescript
export interface Pet {
  id: number;
  name: string;
  species: string;
  birthDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface FoodType {
  id: number;
  name: string;
  brand?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedingSchedule {
  id: number;
  time: string; // HH:MM
  foodTypeId: number;
  foodType?: FoodType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeedingRecord {
  id: number;
  feedingScheduleId: number;
  feedingSchedule?: FeedingSchedule;
  actualTime: string;
  completed: boolean;
  notes?: string;
  createdAt: string;
}

export interface WeightRecord {
  id: number;
  petId: number;
  pet?: Pet;
  weight: number;
  recordedDate: string;
  notes?: string;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: number;
  type: 'water' | 'toilet';
  performedAt: string;
  description?: string;
  createdAt: string;
}
```

## エラーハンドリング

### フロントエンド
- APIエラーの統一的な処理
- ユーザーフレンドリーなエラーメッセージ表示
- ネットワークエラーの検出と再試行機能
- フォームバリデーションエラーの表示

### バックエンド
- 入力値検証エラー（400 Bad Request）
- リソース未発見エラー（404 Not Found）
- データベースエラー（500 Internal Server Error）
- 統一されたエラーレスポンス形式

```typescript
interface ErrorResponse {
  error: {
    message: string;
    code: string;
    details?: any;
  };
}
```

## テスト戦略

### フロントエンド
- React Testing Library を使用したコンポーネントテスト
- カスタムフックのテスト
- APIサービスのモックテスト
- E2Eテスト（Playwright）

### バックエンド
- Jest を使用した単体テスト
- APIエンドポイントの統合テスト
- データベース操作のテスト
- バリデーション機能のテスト

### テストデータ
- 開発用のシードデータ
- テスト用のモックデータ
- データベースのマイグレーションテスト