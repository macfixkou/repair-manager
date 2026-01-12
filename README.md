# 修理管理アプリ (MVP)

Next.js (App Router) + Prisma + Supabase(Postgres/Auth/Storage) で動く案件管理アプリです。認証・マルチテナント・画像添付・CSV出力・滞留アラートに対応します。

## セットアップ
1. 依存インストール  
   ```bash
   cd my-app
   npm install
   ```
2. 環境変数（`.env.local` を `.env.example` から作成）  
   - `DATABASE_URL` : SupabaseのPostgres接続文字列  
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`  
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Prisma 初期化  
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```
4. デモデータ（任意、service role key が必要）  
   ```bash
   npm run prisma:seed
   ```
   ログイン: `demo@example.com` / `password123`
5. 起動  
   ```bash
   npm run dev
   ```
   ブラウザで `http://localhost:3000`

## 技術スタック
- Next.js 14 / App Router / TypeScript / TailwindCSS
- Auth: Supabase Auth（メール+パスワード）
- DB: Supabase Postgres + Prisma
- Upload: Supabase Storage（MIME検査・10MB制限）、DBにパス保存
- CSV: サーバー側生成 `/api/export/cases.csv`

## データモデル (Prisma)
- Organization: `id`, `name`, `createdAt`, `stallThresholdsJson`
- User: `id`(Supabase authユーザーID), `orgId`, `name`, `email`, `role`
- Case: `id(UUID)`, `orgId`, `receivedAt`, `status`, 各種顧客/機器/ログ/判断/共有フラグ/論理削除
- Attachment: `id`, `caseId`, `orgId`, `type`, `fileName`, `filePath`, `mimeType`, `size`

## 主要API
- POST `/api/auth/signup`
- POST `/api/auth/login`（Supabase Authを使用、cookieにセッション付与）
- GET/POST `/api/cases`
- GET/PUT/DELETE `/api/cases/:id`
- POST `/api/cases/:id/attachments`
- DELETE `/api/attachments/:id`
- GET `/api/export/cases.csv`
- GET `/api/cases/:id/share-export`
- GET/PUT `/api/org/settings`（滞留閾値）

`GET /api/cases` は `ageDays`, `stalled`, `stallThreshold`, `stalledByDays`, `attachmentsCount` を含み、`stalled=1` で滞留のみ抽出可能。

## 滞留ロジック
- 経過日数: `floor((now - receivedAt)/24h)`
- 閾値: `Organization.stallThresholdsJson` をパース（無ければデフォルト INTAKE2/DIAGNOSING3/REPAIRING5/その他0）
- `threshold > 0 && ageDays >= threshold` で `stalled=true`
- CSVにも `ageDays/stalled/stallThreshold/stalledByDays` を含める

## 使い方フロー
1. サインアップ（組織＋最初のユーザー作成、Supabase Auth登録）
2. ログイン
3. 案件作成（必須: 受付日・症状・顧客名または連絡先）
4. ダッシュボードで検索/フィルタ/滞留トグル
5. 案件詳細でログ更新・ステータス1クリック変更・共有フラグ設定・画像添付
6. CSV出力（期間/ステータス指定）
7. 匿名共有ONの案件で「共有用データをコピー」（顧客情報除去）
8. 滞留閾値設定画面でステータスごとの日数を編集

## Windows/Mac での注意
- 画像は Supabase Storage に保存します。バケット設定は Supabase 側で行ってください。
- Prisma接続は Supabase の Postgres 接続文字列を使用します。

## 動作確認チェックリスト
- [ ] サインアップ→新規組織/ユーザー作成できる（Supabaseにユーザーが登録される）
- [ ] ログイン成功（Supabase Authセッション付与）
- [ ] 案件作成（必須入力エラーが日本語表示）
- [ ] ダッシュボード一覧・検索・ステータス/滞留フィルタ・経過日数/滞留バッジ表示
- [ ] 案件詳細で編集→保存時にトースト表示、ステータス1クリック変更
- [ ] 画像(jpeg/png/webp, 10MB以下) アップロード/削除（Supabase Storage）
- [ ] CSV出力に滞留系カラムが含まれる
- [ ] 匿名共有ONの案件で共有JSONコピー成功
- [ ] 滞留閾値設定の取得/更新成功
