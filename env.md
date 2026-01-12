# 環境変数設定メモ

本番/開発共通で使う値。`my-app/.env` と `.env.local` に同じ内容を設定してください。  
※ `DATABASE_URL` は必ず `postgresql://` で始まる Supabase の接続文字列を使います（httpsでは不可）。

```env
DATABASE_URL="postgresql://postgres:<DB_PASSWORD>@db.resybnvrpehzirwxjpbu.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1&sslmode=require"
SUPABASE_URL="https://resybnvrpehzirwxjpbu.supabase.co"
SUPABASE_ANON_KEY="sb_publishable_939_qBLjdf_UPtrY_qBuGA_vaIWPid4"
SUPABASE_SERVICE_ROLE_KEY="<service_roleキー (ey...で始まる長いJWT)>"
NEXT_PUBLIC_SUPABASE_URL="https://resybnvrpehzirwxjpbu.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_939_qBLjdf_UPtrY_qBuGA_vaIWPid4"
SUPABASE_STORAGE_BUCKET="attachments"
```

手順:
1. `<DB_PASSWORD>` を Supabase「Project Settings > Database > パスワード」に置換する。  
2. `<service_roleキー>` を Supabase「Settings > API > service_role」に置換する。  
3. `.env` と `.env.local` の両方に保存する。  
4. 反映後、プロジェクト直下で  
   ```bash
   npx prisma migrate dev --name init --schema prisma/schema.prisma
   npm run dev
   ``` 
   を実行。P1001/P1012が出なくなることを確認。
