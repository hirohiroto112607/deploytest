# GitHub Dynamic Greeting Badge

時間帯によってメッセージが変化する動的な画像生成システム。GitHubのREADMEに埋め込み可能です。

## 機能

- **時間判定ロジック**: JST（日本標準時）に基づいて3つの時間帯を判定
  - 朝 (05:00 - 10:59): 🌅 「おはようございます」
  - 昼 (11:00 - 17:59): ☀️ 「こんにちは」
  - 夜 (18:00 - 04:59): 🌙 「こんばんは」

- **ランダムメッセージ**: 各時間帯に複数のメッセージを用意し、ランダムに選択表示
- **動的画像生成**: Canvas を使用した高速PNG画像生成
- **キャッシュ制御**: GitHub のキャッシュを回避する適切なヘッダー設定

## 技術スタック

- **Framework**: Next.js 16.2.6 (App Router)
- **Image Generation**: Node.js Canvas
- **Language**: TypeScript
- **Deployment**: Vercel / Cloudflare Pages

## セットアップ方法

```bash
# 依存パッケージをインストール
npm install

# 開発サーバーを起動
npm run dev
```

開発サーバーは `http://localhost:3000` で起動します。

## 使い方

### API エンドポイント

```
GET /api/badge
```

現在の時刻に応じた PNG 画像を返します。

### README.md への埋め込み

```markdown
![Greeting Badge](https://your-domain.com/api/badge?t={TIMESTAMP})
```

タイムスタンプ(`?t={TIMESTAMP}`)を付けることで、ブラウザとGitHubのキャッシュをより強力に回避できます。

## プロジェクト構成

```
├── app/
│   ├── api/
│   │   └── badge/
│   │       └── route.ts          # API エンドポイント
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── messages.ts               # メッセージと時間判定ロジック
│   └── badge.ts                  # 画像生成ロジック
├── package.json
└── tsconfig.json
```

## 主要ファイル説明

### `lib/messages.ts`

- 時間帯の定義
- 各時間帯のメッセージ定義
- 時間判定関数 (`getTimeSlot()`)
- ランダムメッセージ選択関数 (`getRandomMessage()`)

### `lib/badge.ts`

- Canvas を使用した PNG 画像生成
- グラデーション背景の描画
- 時刻、挨拶、メッセージの配置

### `app/api/badge/route.ts`

- Next.js API Route
- HTTP キャッシュヘッダー設定
- JST 時刻取得と画像生成

## ビルドとデプロイ

### ビルド

```bash
npm run build
```

### Vercel へのデプロイ

```bash
vercel deploy
```

### 本番環境での実行

```bash
npm run start
```

## 拡張アイデア

- [ ] GitHub Actions連携: 最後のコミット時刻を表示
- [ ] ランダム名言: 技術者の名言を100個リスト化
- [ ] 季節対応: お正月、クリスマス、誕生日の特殊メッセージ
- [ ] 複数言語対応: 英語、中国語など
- [ ] テーマのカスタマイズ: 色やサイズのクエリパラメータ対応

## ライセンス

MIT
