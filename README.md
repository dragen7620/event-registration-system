# EventPass 線上活動報名與管理系統 (GitHub + Vercel + Supabase)

本專案為使用 **Next.js (App Router) + Tailwind CSS + Supabase** 打造的雲端全端活動報名系統。

## ✨ 核心功能
- **前台活動探索與篩選**：支援關鍵字搜尋、活動分類篩選、即時名額進度條顯示。
- **線上報名與自動候補機制**：名額額滿時自動轉為「候補登記」，並具備同活動重複 Email 防呆檢查。
- **QR Code 電子入場憑證**：報名完成即刻產生專屬序號 (`REG-...`) 與 QR Code，支援列印或儲存 PDF。
- **免登入報名查詢與取消 (`/lookup`)**：輸入 Email、電話或序號即可查詢報名狀態或自行取消報名。
- **主辦方管理後台 (`/admin`)**：
  - 總覽統計卡片（總活動數、正取人數、候補人數、已簽到人數）
  - 現場快速報到核銷（支援輸入或掃描序號一鍵簽到）
  - 報名名單篩選、狀態變更（正取/候補/取消）與 **一鍵匯出 CSV (Excel) 報表**
  - 新增、編輯、刪除活動場次
- **雙模式自動切換**：尚未設定 `.env.local` 時自動啟用本地展示模式（內建範例活動與名單），設定 Supabase 金鑰後自動無縫切換至雲端資料庫！

---

## 🚀 快速啟動與雲端部署指南

### Step 1：本地安裝與啟動預覽
```bash
npm install
npm run dev
```
打開瀏覽器前往 `http://localhost:3000` 即可預覽完整前台與後台功能（後台預設測試密碼：`admin123`）。

### Step 2：設定 Supabase 資料庫
1. 登入 [Supabase](https://supabase.com/) 並建立一個新專案 (New Project)。
2. 點擊左側選單的 **SQL Editor** -> **New query**。
3. 複製本專案 [`supabase/schema.sql`](./supabase/schema.sql) 內的所有 SQL 語法，貼上並點擊 **Run**（會自動建立 `events` 與 `registrations` 資料表並寫入範例活動）。

### Step 3：綁定環境變數
1. 在 Supabase 後台前往 **Project Settings** -> **API**。
2. 複製 `Project URL` 與 `anon public` 金鑰。
3. 在專案根目錄建立 `.env.local`（可複製 `.env.example` 修改）：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=您的_Project_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=您的_anon_public_key
   NEXT_PUBLIC_ADMIN_PASSCODE=admin123
   ```

### Step 4 & 5：推送至 GitHub 並透過 Vercel 自動部署
1. 將程式碼推送至您的 GitHub 儲存庫：
   ```bash
   git init
   git add .
   git commit -m "feat: initial event registration system"
   git branch -M main
   git remote add origin https://github.com/您的帳號/您的儲存庫.git
   git push -u origin main
   ```
2. 登入 [Vercel](https://vercel.com/) -> 點擊 **Add New Project** -> 選擇剛才的 GitHub 儲存庫。
3. 展開 **Environment Variables**，填入 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY` 與 `NEXT_PUBLIC_ADMIN_PASSCODE`。
4. 點擊 **Deploy**，約 1 分鐘即可獲得正式上線網址！
