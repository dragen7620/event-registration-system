-- ============================================================================
-- 線上活動報名系統 - Supabase (PostgreSQL) 資料庫初始化腳本
-- 使用說明：請將此檔案內容全選複製，貼上至 Supabase 後台的 SQL Editor 並點擊 Run
-- ============================================================================

-- 1. 建立活動資料表 (events)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '講座研討',
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  registration_deadline TIMESTAMPTZ NOT NULL,
  max_capacity INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'draft')),
  image_url TEXT DEFAULT 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
  organizer TEXT NOT NULL DEFAULT '活動籌備團隊',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 建立報名紀錄資料表 (registrations)
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  organization TEXT DEFAULT '',
  dietary TEXT NOT NULL DEFAULT 'normal' CHECK (dietary IN ('normal', 'vegetarian', 'none')),
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'waitlist', 'cancelled')),
  checked_in BOOLEAN NOT NULL DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. 建立索引以加速查詢
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON public.registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON public.registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_ticket_code ON public.registrations(ticket_code);

-- 4. 啟用 Row Level Security (RLS)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- 5. 設定開放讀寫原則 (方便專題與初期快速串接測試，正式上線可改為限定 authenticated)
DROP POLICY IF EXISTS "Allow public read events" ON public.events;
CREATE POLICY "Allow public read events" ON public.events
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public write events" ON public.events;
CREATE POLICY "Allow public write events" ON public.events
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read registrations" ON public.registrations;
CREATE POLICY "Allow public read registrations" ON public.registrations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public write registrations" ON public.registrations;
CREATE POLICY "Allow public write registrations" ON public.registrations
  FOR ALL USING (true) WITH CHECK (true);

-- 6. 插入預設精選範例活動（若目前沒有任何活動）
INSERT INTO public.events (title, category, description, location, event_date, registration_deadline, max_capacity, status, image_url, organizer)
SELECT
  '2026 生成式 AI 與全端雲端開發實戰工作坊',
  '技術工作坊',
  '本工作坊將帶領學員從零開始，使用 GitHub、Vercel 與 Supabase 快速打造現代化雲端全端應用程式。現場包含實機操作指導、架構設計解析與 QA 交流時間，適合對 Web 開發與 AI 應用有興趣的學生與開發者參加。',
  '台北市大安區科技大樓 3 樓 A 廳（近捷運科技大樓站）',
  now() + interval '14 days',
  now() + interval '12 days',
  40,
  'open',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
  '數位創新研發社'
WHERE NOT EXISTS (SELECT 1 FROM public.events LIMIT 1);

INSERT INTO public.events (title, category, description, location, event_date, registration_deadline, max_capacity, status, image_url, organizer)
SELECT
  'UI/UX 產品設計思維與跨領域職涯講座',
  '職涯講座',
  '邀請業界資深產品設計師分享從使用者研究、Design System 建置到與工程師高效協作的實務經驗。現場同時提供作品集健檢與職涯問答。',
  '線上直播 (Google Meet，報名成功後將於憑證頁提供連結)',
  now() + interval '21 days',
  now() + interval '19 days',
  100,
  'open',
  'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
  '跨領域設計學院'
WHERE (SELECT COUNT(*) FROM public.events) < 2;
