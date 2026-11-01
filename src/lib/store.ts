import { supabase, isSupabaseConfigured } from './supabase';
import {
  EventItem,
  RegistrationItem,
  CreateRegistrationInput,
  CreateEventInput,
  RegistrationStatus,
} from './types';

const LOCAL_EVENTS_KEY = 'demo_events_v1';
const LOCAL_REGS_KEY = 'demo_registrations_v1';

// 預設展示活動資料（當尚未建立資料表時自動載入）
const DEFAULT_EVENTS: EventItem[] = [
  {
    id: 'evt-101',
    title: '2026 生成式 AI 與全端雲端開發實戰工作坊',
    category: '技術工作坊',
    description:
      '本工作坊將帶領學員從零開始，使用 GitHub、Vercel 與 Supabase 快速打造現代化雲端全端應用程式。\n\n【課程亮點】\n1. 現代化 Serverless 架構解析與實務\n2. Supabase PostgreSQL 資料庫設計與即時 API 串接\n3. GitHub + Vercel 自動化 CI/CD 部署流程\n4. 現場實機操作與專題指導',
    location: '台北市大安區科技大樓 3 樓 A 廳（近捷運科技大樓站）',
    event_date: '2026-11-15T14:00:00+08:00',
    registration_deadline: '2026-11-13T23:59:00+08:00',
    max_capacity: 40,
    status: 'open',
    image_url:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    organizer: '數位創新研發社',
    created_at: '2026-11-01T09:00:00+08:00',
  },
  {
    id: 'evt-102',
    title: 'UI/UX 產品設計思維與跨領域職涯講座',
    category: '職涯講座',
    description:
      '邀請業界資深產品設計師分享從使用者研究、Design System 建置到與工程師高效協作的實務經驗。\n\n【適合對象】\n- 對產品設計、前端開發有興趣之同學與轉職者\n- 正在準備專題或個人作品集的學員\n- 希望了解科技業跨職能團隊協作流程者',
    location: '線上直播（Google Meet，報名成功後於電子憑證提供連結）',
    event_date: '2026-11-22T19:00:00+08:00',
    registration_deadline: '2026-11-20T23:59:00+08:00',
    max_capacity: 100,
    status: 'open',
    image_url:
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
    organizer: '跨領域設計學院',
    created_at: '2026-11-01T09:30:00+08:00',
  },
  {
    id: 'evt-103',
    title: '開源社群專案 Demo Day 暨開發者交流小聚',
    category: '社群聚會',
    description:
      '年度壓軸開發者聚會！由 8 組團隊輪流展示最新開發的 Web 與 AI 應用專題，現場備有精緻茶點與自由 Networking 交流時間，歡迎所有喜愛技術與創新的朋友報名參加。',
    location: '台北市信義區松菸文創園區 2 號倉庫',
    event_date: '2026-12-05T13:30:00+08:00',
    registration_deadline: '2026-12-01T23:59:00+08:00',
    max_capacity: 3, // 小名額方便測試候補功能
    status: 'open',
    image_url:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    organizer: 'OpenSource Taiwan 社群',
    created_at: '2026-11-01T10:00:00+08:00',
  },
];

const DEFAULT_REGISTRATIONS: RegistrationItem[] = [
  {
    id: 'reg-201',
    event_id: 'evt-101',
    ticket_code: 'REG-261101-A8F2',
    name: '王小明',
    email: 'ming@example.com',
    phone: '0912345678',
    organization: '國立臺灣大學 資工系',
    dietary: 'normal',
    notes: '期待實機操作環節！',
    status: 'confirmed',
    checked_in: true,
    checked_in_at: '2026-11-01T10:15:00+08:00',
    created_at: '2026-11-01T10:05:00+08:00',
  },
  {
    id: 'reg-202',
    event_id: 'evt-101',
    ticket_code: 'REG-261101-B3K9',
    name: '林佳穎',
    email: 'chiaying@example.com',
    phone: '0922888999',
    organization: '星辰數位科技',
    dietary: 'vegetarian',
    notes: '',
    status: 'confirmed',
    checked_in: false,
    checked_in_at: null,
    created_at: '2026-11-01T10:12:00+08:00',
  },
  {
    id: 'reg-203',
    event_id: 'evt-103',
    ticket_code: 'REG-261101-C7M1',
    name: '陳冠宇',
    email: 'kuanyu@example.com',
    phone: '0933111222',
    organization: '自由開發者',
    dietary: 'normal',
    notes: '',
    status: 'confirmed',
    checked_in: false,
    checked_in_at: null,
    created_at: '2026-11-01T10:20:00+08:00',
  },
  {
    id: 'reg-204',
    event_id: 'evt-103',
    ticket_code: 'REG-261101-D9P4',
    name: '張雅筑',
    email: 'yazhu@example.com',
    phone: '0955666777',
    organization: '創新實驗室',
    dietary: 'none',
    notes: '',
    status: 'confirmed',
    checked_in: false,
    checked_in_at: null,
    created_at: '2026-11-01T10:25:00+08:00',
  },
];

// 記錄雲端資料表是否已建立，供前端 UI 顯示提示
let supabaseSchemaMissing = false;

export function isSupabaseSchemaMissing(): boolean {
  return supabaseSchemaMissing;
}

function isTableMissingError(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  return (
    err.code === 'PGRST205' ||
    err.code === '42P01' ||
    Boolean(err.message && err.message.includes('Could not find the table'))
  );
}

// 本地儲存讀寫輔助
function getLocalEvents(): EventItem[] {
  if (typeof window === 'undefined') return DEFAULT_EVENTS;
  const raw = localStorage.getItem(LOCAL_EVENTS_KEY);
  if (!raw) {
    localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(DEFAULT_EVENTS));
    return DEFAULT_EVENTS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_EVENTS;
  }
}

function saveLocalEvents(events: EventItem[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(events));
  }
}

function getLocalRegistrations(): RegistrationItem[] {
  if (typeof window === 'undefined') return DEFAULT_REGISTRATIONS;
  const raw = localStorage.getItem(LOCAL_REGS_KEY);
  if (!raw) {
    localStorage.setItem(LOCAL_REGS_KEY, JSON.stringify(DEFAULT_REGISTRATIONS));
    return DEFAULT_REGISTRATIONS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_REGISTRATIONS;
  }
}

function saveLocalRegistrations(regs: RegistrationItem[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_REGS_KEY, JSON.stringify(regs));
  }
}

/**
 * 產生專屬報名序號 (例如 REG-261101-X9A2)
 */
export function generateTicketCode(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `REG-${yy}${mm}${dd}-${rand}`;
}

/**
 * 取得所有活動列表（含目前已報名人數與候補人數統計）
 */
export async function fetchEvents(): Promise<EventItem[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });

    if (!error && events) {
      supabaseSchemaMissing = false;
      const { data: regs } = await supabase
        .from('registrations')
        .select('event_id, status');

      const regList = regs || [];
      return events.map((ev: EventItem) => ({
        ...ev,
        confirmed_count: regList.filter(
          (r) => r.event_id === ev.id && r.status === 'confirmed'
        ).length,
        waitlist_count: regList.filter(
          (r) => r.event_id === ev.id && r.status === 'waitlist'
        ).length,
      }));
    }

    if (isTableMissingError(error)) {
      supabaseSchemaMissing = true;
      console.warn(
        '⚠️ Supabase 尚未建立 events 資料表，已自動切換至本地展示資料。請至 Supabase SQL Editor 執行 supabase/schema.sql'
      );
    } else if (error) {
      throw new Error(error.message);
    }
  }

  // Fallback: Local Demo Mode
  const events = getLocalEvents();
  const regs = getLocalRegistrations();
  return events.map((ev) => ({
    ...ev,
    confirmed_count: regs.filter(
      (r) => r.event_id === ev.id && r.status === 'confirmed'
    ).length,
    waitlist_count: regs.filter(
      (r) => r.event_id === ev.id && r.status === 'waitlist'
    ).length,
  }));
}

/**
 * 依 ID 取得單一活動詳情
 */
export async function fetchEventById(id: string): Promise<EventItem | null> {
  const all = await fetchEvents();
  return all.find((e) => e.id === id) || null;
}

/**
 * 新增或更新活動（後台管理員使用）
 */
export async function createOrUpdateEvent(
  input: CreateEventInput,
  eventId?: string
): Promise<EventItem> {
  if (isSupabaseConfigured() && supabase && !supabaseSchemaMissing) {
    if (eventId) {
      const { data, error } = await supabase
        .from('events')
        .update(input)
        .eq('id', eventId)
        .select()
        .single();
      if (!isTableMissingError(error)) {
        if (error) throw new Error(error.message);
        return data as EventItem;
      }
      supabaseSchemaMissing = true;
    } else {
      const { data, error } = await supabase
        .from('events')
        .insert([input])
        .select()
        .single();
      if (!isTableMissingError(error)) {
        if (error) throw new Error(error.message);
        return data as EventItem;
      }
      supabaseSchemaMissing = true;
    }
  }

  const events = getLocalEvents();
  if (eventId) {
    const idx = events.findIndex((e) => e.id === eventId);
    if (idx === -1) throw new Error('找不到該活動');
    const updated: EventItem = { ...events[idx], ...input };
    events[idx] = updated;
    saveLocalEvents(events);
    return updated;
  } else {
    const newEvent: EventItem = {
      ...input,
      id: `evt-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    events.unshift(newEvent);
    saveLocalEvents(events);
    return newEvent;
  }
}

/**
 * 刪除活動
 */
export async function deleteEvent(eventId: string): Promise<void> {
  if (isSupabaseConfigured() && supabase && !supabaseSchemaMissing) {
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (!isTableMissingError(error)) {
      if (error) throw new Error(error.message);
      return;
    }
    supabaseSchemaMissing = true;
  }
  const events = getLocalEvents().filter((e) => e.id !== eventId);
  saveLocalEvents(events);
  const regs = getLocalRegistrations().filter((r) => r.event_id !== eventId);
  saveLocalRegistrations(regs);
}

/**
 * 提交報名表單（自動判斷正取或候補、檢查重複報名）
 */
export async function submitRegistration(
  input: CreateRegistrationInput
): Promise<RegistrationItem> {
  const event = await fetchEventById(input.event_id);
  if (!event) {
    throw new Error('找不到此活動資訊');
  }
  if (event.status !== 'open') {
    throw new Error('此活動目前已停止受理報名');
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  const ticketCode = generateTicketCode();

  // 判斷正取或候補
  const currentConfirmed = event.confirmed_count || 0;
  const isFull =
    event.max_capacity > 0 && currentConfirmed >= event.max_capacity;
  const status: RegistrationStatus = isFull ? 'waitlist' : 'confirmed';

  if (isSupabaseConfigured() && supabase && !supabaseSchemaMissing) {
    // 檢查同一活動是否已用相同 Email 報名過（且未取消）
    const { data: existing, error: checkErr } = await supabase
      .from('registrations')
      .select('id, ticket_code, status')
      .eq('event_id', input.event_id)
      .ilike('email', normalizedEmail)
      .neq('status', 'cancelled')
      .maybeSingle();

    if (!isTableMissingError(checkErr)) {
      if (existing) {
        throw new Error(
          `此 Email 已經報名過本活動（序號：${existing.ticket_code}），請至「報名查詢」頁面查看。`
        );
      }

      const { data, error } = await supabase
        .from('registrations')
        .insert([
          {
            event_id: input.event_id,
            ticket_code: ticketCode,
            name: input.name.trim(),
            email: normalizedEmail,
            phone: input.phone.trim(),
            organization: (input.organization || '').trim(),
            dietary: input.dietary,
            notes: (input.notes || '').trim(),
            status,
            checked_in: false,
          },
        ])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return { ...(data as RegistrationItem), event };
    }
    supabaseSchemaMissing = true;
  }

  // Fallback: Local Demo Mode
  const regs = getLocalRegistrations();
  const duplicate = regs.find(
    (r) =>
      r.event_id === input.event_id &&
      r.email.toLowerCase() === normalizedEmail &&
      r.status !== 'cancelled'
  );
  if (duplicate) {
    throw new Error(
      `此 Email 已經報名過本活動（序號：${duplicate.ticket_code}），請至「報名查詢」頁面查看。`
    );
  }

  const newReg: RegistrationItem = {
    id: `reg-${Date.now()}`,
    event_id: input.event_id,
    ticket_code: ticketCode,
    name: input.name.trim(),
    email: normalizedEmail,
    phone: input.phone.trim(),
    organization: (input.organization || '').trim(),
    dietary: input.dietary,
    notes: (input.notes || '').trim(),
    status,
    checked_in: false,
    checked_in_at: null,
    created_at: new Date().toISOString(),
  };

  regs.unshift(newReg);
  saveLocalRegistrations(regs);
  return { ...newReg, event };
}

/**
 * 依報名序號取得單筆報名憑證與活動資訊
 */
export async function fetchRegistrationByTicket(
  ticketCode: string
): Promise<RegistrationItem | null> {
  const cleanCode = ticketCode.trim().toUpperCase();
  const events = await fetchEvents();
  const eventMap = new Map(events.map((e) => [e.id, e]));

  if (isSupabaseConfigured() && supabase && !supabaseSchemaMissing) {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('ticket_code', cleanCode)
      .maybeSingle();

    if (!isTableMissingError(error)) {
      if (error || !data) return null;
      const reg = data as RegistrationItem;
      return {
        ...reg,
        event: eventMap.get(reg.event_id),
      };
    }
    supabaseSchemaMissing = true;
  }

  const regs = getLocalRegistrations();
  const found = regs.find((r) => r.ticket_code.toUpperCase() === cleanCode);
  if (!found) return null;
  return {
    ...found,
    event: eventMap.get(found.event_id),
  };
}

/**
 * 報名者查詢報名紀錄（支援透過 Email、手機號碼或報名序號查詢）
 */
export async function lookupRegistrations(
  query: string
): Promise<RegistrationItem[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const events = await fetchEvents();
  const eventMap = new Map(events.map((e) => [e.id, e]));

  if (isSupabaseConfigured() && supabase && !supabaseSchemaMissing) {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .or(`email.ilike.%${q}%,phone.ilike.%${q}%,ticket_code.ilike.%${q}%`)
      .order('created_at', { ascending: false });

    if (!isTableMissingError(error)) {
      if (error) throw new Error(error.message);
      return (data || []).map((r: RegistrationItem) => ({
        ...r,
        event: eventMap.get(r.event_id),
      }));
    }
    supabaseSchemaMissing = true;
  }

  const regs = getLocalRegistrations();
  return regs
    .filter(
      (r) =>
        r.email.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        r.ticket_code.toLowerCase().includes(q)
    )
    .map((r) => ({
      ...r,
      event: eventMap.get(r.event_id),
    }));
}

/**
 * 取得所有報名名單（或特定活動的報名名單）供後台管理使用
 */
export async function fetchAllRegistrations(
  eventId?: string
): Promise<RegistrationItem[]> {
  const events = await fetchEvents();
  const eventMap = new Map(events.map((e) => [e.id, e]));

  if (isSupabaseConfigured() && supabase && !supabaseSchemaMissing) {
    let query = supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (eventId && eventId !== 'all') {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query;
    if (!isTableMissingError(error)) {
      if (error) throw new Error(error.message);
      return (data || []).map((r: RegistrationItem) => ({
        ...r,
        event: eventMap.get(r.event_id),
      }));
    }
    supabaseSchemaMissing = true;
  }

  let regs = getLocalRegistrations();
  if (eventId && eventId !== 'all') {
    regs = regs.filter((r) => r.event_id === eventId);
  }
  return regs.map((r) => ({
    ...r,
    event: eventMap.get(r.event_id),
  }));
}

/**
 * 更新報名狀態（例如：取消報名、候補轉正取）
 */
export async function updateRegistrationStatus(
  regId: string,
  status: RegistrationStatus
): Promise<void> {
  if (isSupabaseConfigured() && supabase && !supabaseSchemaMissing) {
    const { error } = await supabase
      .from('registrations')
      .update({ status })
      .eq('id', regId);
    if (!isTableMissingError(error)) {
      if (error) throw new Error(error.message);
      return;
    }
    supabaseSchemaMissing = true;
  }

  const regs = getLocalRegistrations();
  const idx = regs.findIndex((r) => r.id === regId);
  if (idx !== -1) {
    regs[idx].status = status;
    saveLocalRegistrations(regs);
  }
}

/**
 * 現場報到核銷（切換簽到狀態或透過 Ticket Code 快速簽到）
 */
export async function toggleCheckIn(
  regId: string,
  checkedIn: boolean
): Promise<void> {
  const checkedInAt = checkedIn ? new Date().toISOString() : null;

  if (isSupabaseConfigured() && supabase && !supabaseSchemaMissing) {
    const { error } = await supabase
      .from('registrations')
      .update({ checked_in: checkedIn, checked_in_at: checkedInAt })
      .eq('id', regId);
    if (!isTableMissingError(error)) {
      if (error) throw new Error(error.message);
      return;
    }
    supabaseSchemaMissing = true;
  }

  const regs = getLocalRegistrations();
  const idx = regs.findIndex((r) => r.id === regId);
  if (idx !== -1) {
    regs[idx].checked_in = checkedIn;
    regs[idx].checked_in_at = checkedInAt;
    saveLocalRegistrations(regs);
  }
}
