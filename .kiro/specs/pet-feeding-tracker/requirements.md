# 要件定義書

## 概要

ペットの餌やりと日常ケアを記録・管理するWebアプリケーション。事前に設定した餌やり時刻と餌の種類に基づいて、毎日の給餌記録と完食状況を追跡し、給水器やトイレのメンテナンス記録も管理する。

## 用語集

- **Pet_Feeding_System**: ペット餌記録システム
- **Feeding_Schedule**: 事前に登録された餌やり時刻と餌の種類の組み合わせ
- **Feeding_Record**: 実際の給餌記録（時刻、餌の種類、完食状況を含む）
- **Food_Type**: 餌の種類（品名、メーカー名、説明を含む餌の情報）
- **Maintenance_Record**: 給水器やトイレのメンテナンス記録
- **User**: システムを使用するペットの飼い主
- **Pet**: 登録されたペット（名前、種類等の基本情報を含む）
- **Weight_Record**: ペットの体重記録（日付と体重を含む）

## 要件

### 要件 1

**ユーザーストーリー:** ペットの飼い主として、餌やり時刻と餌の種類を事前に登録したい。そうすることで、毎日の餌やりを計画的に管理できる。

#### 受入基準

1. THE Pet_Feeding_System SHALL 餌やり時刻を時間と分で登録する機能を提供する
2. THE Pet_Feeding_System SHALL 餌の種類を品名、メーカー名、説明付きで登録する機能を提供する
3. THE Pet_Feeding_System SHALL 餌やり時刻と餌の種類を組み合わせたFeeding_Scheduleを作成する機能を提供する
4. THE Pet_Feeding_System SHALL 登録済みのFeeding_Scheduleを一覧表示する機能を提供する
5. THE Pet_Feeding_System SHALL 登録済みのFeeding_ScheduleとFood_Typeを編集・削除する機能を提供する

### 要件 2

**ユーザーストーリー:** ペットの飼い主として、毎日の餌やり記録を簡単に入力したい。そうすることで、ペットの食事状況を正確に把握できる。

#### 受入基準

1. WHEN Userが記録入力画面にアクセスするとき、THE Pet_Feeding_System SHALL 事前登録されたFeeding_Scheduleの一覧を表示する
2. WHEN UserがFeeding_Scheduleを選択するとき、THE Pet_Feeding_System SHALL 実際の給餌時刻を入力するフィールドを表示する
3. THE Pet_Feeding_System SHALL 餌を完食したかどうかを選択する機能を提供する
4. WHEN Userが記録を保存するとき、THE Pet_Feeding_System SHALL Feeding_Recordをデータベースに保存する
5. THE Pet_Feeding_System SHALL 保存されたFeeding_Recordを日付順で一覧表示する機能を提供する

### 要件 3

**ユーザーストーリー:** ペットの飼い主として、給水器とトイレのメンテナンス記録を管理したい。そうすることで、ペットの衛生環境を適切に維持できる。

#### 受入基準

1. THE Pet_Feeding_System SHALL 給水器の清掃記録を日時付きで登録する機能を提供する
2. THE Pet_Feeding_System SHALL トイレの清掃記録を日時付きで登録する機能を提供する
3. THE Pet_Feeding_System SHALL メンテナンス内容を自由記述で入力する機能を提供する
4. THE Pet_Feeding_System SHALL 登録されたMaintenance_Recordを日付順で一覧表示する機能を提供する
5. THE Pet_Feeding_System SHALL Maintenance_Recordを編集・削除する機能を提供する

### 要件 4

**ユーザーストーリー:** ペットの飼い主として、過去の餌やり記録とメンテナンス記録を確認したい。そうすることで、ペットのケア履歴を把握し、適切な世話を継続できる。

#### 受入基準

1. THE Pet_Feeding_System SHALL Feeding_Recordを日付範囲で検索する機能を提供する
2. THE Pet_Feeding_System SHALL Maintenance_Recordを日付範囲で検索する機能を提供する
3. THE Pet_Feeding_System SHALL 完食率を期間別に集計表示する機能を提供する
4. THE Pet_Feeding_System SHALL 記録データをCSV形式でエクスポートする機能を提供する
5. THE Pet_Feeding_System SHALL 直近7日間の餌やり状況をダッシュボードで表示する機能を提供する

### 要件 5

**ユーザーストーリー:** ペットの飼い主として、ペットの基本情報を登録し、体重の変化を記録したい。そうすることで、ペットの健康状態を継続的に管理できる。

#### 受入基準

1. THE Pet_Feeding_System SHALL ペットの名前、種類、生年月日を登録する機能を提供する
2. THE Pet_Feeding_System SHALL 登録済みのPetの情報を編集・削除する機能を提供する
3. THE Pet_Feeding_System SHALL ペットの体重を日付付きで記録する機能を提供する
4. THE Pet_Feeding_System SHALL Weight_Recordを時系列グラフで表示する機能を提供する
5. THE Pet_Feeding_System SHALL Weight_Recordを編集・削除する機能を提供する

### 要件 6

**ユーザーストーリー:** ペットの飼い主として、餌やり記録とメンテナンス記録をカレンダー形式で視覚的に確認したい。そうすることで、月間のケア状況を一目で把握し、抜け漏れを防げる。

#### 受入基準

1. THE Pet_Feeding_System SHALL 月間カレンダービューでFeeding_Recordを日付別に表示する機能を提供する
2. THE Pet_Feeding_System SHALL カレンダー上で各日の完食状況を色分けまたはアイコンで視覚的に表示する機能を提供する
3. THE Pet_Feeding_System SHALL カレンダー上でMaintenance_Recordを実施日にマーカーで表示する機能を提供する
4. WHEN Userがカレンダーの特定日をクリックするとき、THE Pet_Feeding_System SHALL その日の詳細記録を表示する機能を提供する
5. THE Pet_Feeding_System SHALL カレンダービューで前月・次月への移動機能を提供する
6. THE Pet_Feeding_System SHALL カレンダー上で餌やり予定（Feeding_Schedule）を薄い色で表示する機能を提供する