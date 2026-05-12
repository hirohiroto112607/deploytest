# GitHub Dynamic Greeting Badge

時間帯によってメッセージが変化する動的な画像生成システム。GitHubのREADMEに埋め込み可能です。

## 機能

- **時間判定ロジック**: JST（日本標準時）に基づいて3つの時間帯を判定
  - 朝 (05:00 - 10:59): 🌅 「おはようございます」
  - 昼 (11:00 - 17:59): ☀️ 「こんにちは」
  - 夜 (18:00 - 04:59): 🌙 「こんばんは」

- **ランダムメッセージ + A/B最適化**: 表示継続傾向をインメモリで学習し、反応の良い文面へ寄せる
- **動的画像生成**: SVG を文字列で生成
- **キャッシュ制御**: GitHub のキャッシュを回避する適切なヘッダー設定
- **多言語自動切替**: `lang=auto` と `Accept-Language` から日本語/英語/中国語を自動判定
- **テーマ機能**: `default / neon / minimal / retro` + `font / radius / padding` 調整
- **GitHub連携**: `username` 指定で公開プロフィール、直近コミット数、連続活動日数を表示
- **イベント連動**: リリース公開 / Issue完了 / PRマージを優先表示（または `event` クエリで強制）
- **祝日/誕生日対応**: 祝日APIと `birthday=MM-DD` による特別メッセージ
- **フェイルセーフ**: 外部API失敗時も簡易バッジを返して可用性を維持

## 技術スタック

- **Framework**: Next.js 16.2.6 (App Router)
- **Image Generation**: SVG (string)
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

現在の時刻に応じた SVG 画像を返します。

### クエリパラメータ

| パラメータ | 例 | 説明 |
| --- | --- | --- |
| `username` | `username=octocat` | GitHub公開プロフィールと活動情報を表示 |
| `lang` | `lang=auto` / `lang=ja` | 言語切替（`ja`,`en`,`zh`,`auto`） |
| `theme` | `theme=neon` | テーマ切替（`default`,`neon`,`minimal`,`retro`） |
| `font` | `font=Arial,sans-serif` | フォント指定 |
| `radius` | `radius=18` | 角丸（0-28） |
| `padding` | `padding=32` | 内側余白（20-48） |
| `mode` | `mode=holiday` | コンテキストモード固定（`workday`,`holiday`,`early-bird`,`night-owl`） |
| `event` | `event=release` | イベント表示強制（`release`,`issue`,`pr`） |
| `country` | `country=JP` | 祝日判定に使う国コード（ISO 3166-1 alpha-2） |
| `birthday` | `birthday=12-24` | 誕生日判定（`MM-DD`） |

### README.md への埋め込み

```markdown
![Greeting Badge](https://greetingbadge.hirohiroto112607.f5.si/api/badge?t={TIMESTAMP})
```

タイムスタンプ(`?t={TIMESTAMP}`)を付けることで、ブラウザとGitHubのキャッシュをより強力に回避できます。

発展機能を使う例:

```markdown
![Advanced Badge](https://greetingbadge.hirohiroto112607.f5.si/api/badge?username=octocat&lang=auto&theme=retro&country=JP&birthday=12-24&t={TIMESTAMP})
```

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

- SVG 画像生成
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

## 実装済みの発展機能

- [x] パーソナライズ表示（`username`）
- [x] 開発アクティビティ連携（直近コミット数・連続活動日数）
- [x] イベント連動表示（リリース / Issue / PR）
- [x] コンテキスト別モード（平日/休日・朝活/深夜）
- [x] 高度なテーマ機能（プリセット + カスタム）
- [x] アニメーションSVG（グラデーション・アイコン）
- [x] A/Bメッセージ最適化（インメモリ）
- [x] 多言語自動切替（`lang=auto`）
- [x] 祝日/記念日連携（祝日API + 誕生日）
- [x] 監視とフェイルセーフ（簡易バッジ）

## ライセンス

MIT
