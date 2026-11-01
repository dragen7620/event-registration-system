import { createClient } from '@supabase/supabase-js';

// 從 .env.local 讀取環境變數
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ 找不到 Supabase 環境變數！請確認 .env.local 中已設定 NEXT_PUBLIC_SUPABASE_URL 與 NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

// 建立並匯出 Supabase Client 實例
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
