# Google Calendar iCal Sync

Google Apps ScriptでiCalファイルをGoogleカレンダーに同期します。

## 注意

このコードはphenylshimaが自分用（UTASのカレンダーを同期させるため）に書いたものなので，使っている間はそれなりにメンテナンスしますが（たぶん），継続される保証はありません．

したがって，issueやpull requestに応答しないことがありますので，あらかじめご了承ください．

フォークするのはご自由にどうぞ．

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Google Apps Scriptプロジェクトの作成

1. [Google Apps Script](https://script.google.com/)にアクセス
2. 新しいプロジェクトを作成
3. プロジェクトIDをコピー

### 3. claspの設定

```bash
# Google Apps Scriptにログイン
npx clasp login
```

（プロジェクトルートに）`.clasp.json`を作成し，以下のように書き込んでください．スクリプトIDはGoogle Apps Scriptエディターから取得できます．

```json
{
  "scriptId": "スクリプトID",
  "rootDir": "dist"
}
```

### 4. ビルドとデプロイ

```bash
# TypeScriptコードをビルド
npm run build

# Google Apps Scriptにプッシュ
npm run push
```

### 5. スクリプトプロパティの設定

Google Apps Scriptエディターを開き，「プロジェクトの設定」から以下のように「スクリプト プロパティ」を設定してください．

- `CALENDAR_ID`: カレンダーID．カレンダーIDは「Calendar Settings」を開き，「Integrate calendar」まで行くと書いてあります．
- `ICAL_URL`: ICALのURL．UTASだと「休講・スケジュール」>「カレンダー連携」から取得できます．

### 6. 必要な権限の許可

初回実行時に以下の権限を許可する必要があります：

- Google Calendarへのアクセス
- 外部URLへのアクセス
- スクリプトプロパティへのアクセス

### 7. トリガーの設定

1. Google Apps Scriptエディターで「トリガー」タブを開く
2. 「トリガーを追加」をクリック
3. 以下の設定：
   - 実行する関数: `syncICalToGoogleCalendar`
   - イベントソース: 時間主導型
   - 時間ベース: 日タイマー
   - 時刻: お好みの時間

## 使用方法

### 手動実行

```javascript
// テスト実行
testSync();

// 現在の設定を確認
showCurrentConfiguration();
```

### iCalファイル形式

サポートされるiCalプロパティ：

- `UID`: イベントの一意識別子（必須）
- `SUMMARY`: イベントのタイトル（必須）
- `DTSTART`: 開始時刻（必須）
- `DTEND`: 終了時刻（必須）
- `LOCATION`: 場所（オプション）
- `DESCRIPTION`: 説明（オプション）

## 開発

### フォーマット

```bash
npm run format
```

### ビルドスクリプト

```bash
# ビルド
npm run build

# ビルド + プッシュ
npm run deploy
```

### デバッグモード

```javascript
// テスト実行でデバッグ
testSync();
```

## ライセンス

MIT License
