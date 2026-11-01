'use client';

import React, { useEffect, useState } from 'react';
import {
  Plus,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Calendar,
  Users,
  QrCode,
  Edit3,
  Trash2,
  Lock,
  LogOut,
  CheckSquare,
  Square,
  Database,
  Copy,
  Check,
  ExternalLink,
  Utensils,
} from 'lucide-react';
import {
  fetchEvents,
  fetchAllRegistrations,
  createOrUpdateEvent,
  deleteEvent,
  updateRegistrationStatus,
  toggleCheckIn,
  isSupabaseSchemaMissing,
} from '@/lib/store';
import {
  CreateEventInput,
  EventItem,
  EventStatus,
  RegistrationItem,
  RegistrationStatus,
} from '@/lib/types';

const ADMIN_PASSCODE =
  process.env.NEXT_PUBLIC_ADMIN_PASSCODE || 'admin123';

const SCHEMA_SQL_SNIPPET = `-- 請貼上至 Supabase SQL Editor 並點擊 Run
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

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all events" ON public.events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all registrations" ON public.registrations FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.events (title, category, description, location, event_date, registration_deadline, max_capacity, status, organizer)
SELECT '2026 生成式 AI 與全端雲端開發實戰工作坊', '技術工作坊', '從零開始使用 GitHub、Vercel 與 Supabase 打造全端雲端系統。', '台北市大安區科技大樓 3 樓 A 廳', now() + interval '14 days', now() + interval '12 days', 40, 'open', '數位創新研發社'
WHERE NOT EXISTS (SELECT 1 FROM public.events LIMIT 1);`;

export default function AdminDashboardPage() {
  // 簡易管理員登入狀態
  const [unlocked, setUnlocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [authError, setAuthError] = useState('');

  // 資料與分頁狀態
  const [activeTab, setActiveTab] = useState<
    'registrations' | 'events' | 'database'
  >('registrations');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [quickTicketCode, setQuickTicketCode] = useState('');
  const [quickCheckInMsg, setQuickCheckInMsg] = useState('');

  // 新增 / 編輯活動 Modal 狀態
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | undefined>(
    undefined
  );
  const [formData, setFormData] = useState<CreateEventInput>({
    title: '',
    category: '技術工作坊',
    description: '',
    location: '',
    event_date: '2026-11-20T14:00',
    registration_deadline: '2026-11-18T23:59',
    max_capacity: 50,
    status: 'open',
    image_url:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    organizer: '活動籌備團隊',
  });

  const loadAllData = async () => {
    const [evData, regData] = await Promise.all([
      fetchEvents(),
      fetchAllRegistrations('all'),
    ]);
    setEvents(evData);
    setRegistrations(regData);
    setSchemaMissing(isSupabaseSchemaMissing());
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('admin_unlocked');
      if (saved === 'true') setUnlocked(true);
    }
    loadAllData();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput === ADMIN_PASSCODE) {
      setUnlocked(true);
      setAuthError('');
      sessionStorage.setItem('admin_unlocked', 'true');
    } else {
      setAuthError('管理員通行碼錯誤（預設測試密碼為 admin123）');
    }
  };

  const handleLogout = () => {
    setUnlocked(false);
    sessionStorage.removeItem('admin_unlocked');
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SCHEMA_SQL_SNIPPET);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2500);
  };

  // 篩選後的報名名單
  const filteredRegs = registrations.filter((r) => {
    const matchEvent =
      selectedEventId === 'all' || r.event_id === selectedEventId;
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'checked_in' ? r.checked_in : r.status === statusFilter);
    const q = searchTerm.trim().toLowerCase();
    const matchSearch =
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.phone.toLowerCase().includes(q) ||
      r.ticket_code.toLowerCase().includes(q) ||
      (r.organization || '').toLowerCase().includes(q);
    return matchEvent && matchStatus && matchSearch;
  });

  // 統計指標（依目前選擇的活動計算）
  const scopedRegs =
    selectedEventId === 'all'
      ? registrations
      : registrations.filter((r) => r.event_id === selectedEventId);

  const totalConfirmed = scopedRegs.filter(
    (r) => r.status === 'confirmed'
  ).length;
  const totalWaitlist = scopedRegs.filter(
    (r) => r.status === 'waitlist'
  ).length;
  const totalCheckedIn = scopedRegs.filter((r) => r.checked_in).length;
  const checkInRate =
    totalConfirmed > 0 ? Math.round((totalCheckedIn / totalConfirmed) * 100) : 0;

  // 便當餐飲統計（只計正取者）
  const confirmedRegs = scopedRegs.filter((r) => r.status === 'confirmed');
  const normalMealCount = confirmedRegs.filter(
    (r) => r.dietary === 'normal'
  ).length;
  const vegMealCount = confirmedRegs.filter(
    (r) => r.dietary === 'vegetarian'
  ).length;
  const noMealCount = confirmedRegs.filter((r) => r.dietary === 'none').length;

  // 快速序號簽到
  const handleQuickCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = quickTicketCode.trim().toUpperCase();
    if (!code) return;

    const target = registrations.find(
      (r) => r.ticket_code.toUpperCase() === code
    );
    if (!target) {
      setQuickCheckInMsg(`❌ 找不到序號「${code}」的報名紀錄`);
      return;
    }
    await toggleCheckIn(target.id, true);
    setQuickCheckInMsg(`✅ 已完成簽到：${target.name} (${target.ticket_code})`);
    setQuickTicketCode('');
    await loadAllData();
  };

  // 匯出 CSV 報表
  const handleExportCSV = () => {
    const headers = [
      '報名序號',
      '活動名稱',
      '姓名',
      'Email',
      '電話',
      '單位/學校',
      '飲食需求',
      '報名狀態',
      '是否報到',
      '報到時間',
      '備註',
      '報名時間',
    ];

    const rows = filteredRegs.map((r) => [
      r.ticket_code,
      r.event?.title || r.event_id,
      r.name,
      r.email,
      `'${r.phone}`,
      r.organization || '',
      r.dietary === 'normal'
        ? '葷食'
        : r.dietary === 'vegetarian'
        ? '素食'
        : '不需餐點',
      r.status === 'confirmed'
        ? '正取'
        : r.status === 'waitlist'
        ? '候補'
        : '已取消',
      r.checked_in ? '已報到' : '未報到',
      r.checked_in_at || '',
      (r.notes || '').replace(/\n/g, ' '),
      r.created_at,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers, ...rows]
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        )
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `報名名單_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 開啟新增或編輯活動視窗
  const openCreateModal = () => {
    setEditingEventId(undefined);
    setFormData({
      title: '',
      category: '技術工作坊',
      description: '',
      location: '',
      event_date: '2026-11-25T14:00',
      registration_deadline: '2026-11-23T23:59',
      max_capacity: 50,
      status: 'open',
      image_url:
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
      organizer: '活動籌備團隊',
    });
    setShowEventModal(true);
  };

  const openEditModal = (ev: EventItem) => {
    setEditingEventId(ev.id);
    setFormData({
      title: ev.title,
      category: ev.category,
      description: ev.description,
      location: ev.location,
      event_date: ev.event_date.slice(0, 16),
      registration_deadline: ev.registration_deadline.slice(0, 16),
      max_capacity: ev.max_capacity,
      status: ev.status,
      image_url: ev.image_url,
      organizer: ev.organizer,
    });
    setShowEventModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    await createOrUpdateEvent(
      {
        ...formData,
        event_date: new Date(formData.event_date).toISOString(),
        registration_deadline: new Date(
          formData.registration_deadline
        ).toISOString(),
      },
      editingEventId
    );
    setShowEventModal(false);
    await loadAllData();
  };

  const handleDeleteEvent = async (ev: EventItem) => {
    if (
      !window.confirm(
        `確定要刪除活動「${ev.title}」嗎？這將會連同該活動的報名名單一併移除。`
      )
    ) {
      return;
    }
    await deleteEvent(ev.id);
    await loadAllData();
  };

  // 若尚未解鎖後台，顯示管理員登入畫面
  if (!unlocked) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-extrabold text-slate-900">
            主辦方管理後台登入
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            請輸入管理員通行碼以管理活動與簽到名單（預設：
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-indigo-600">
              admin123
            </code>
            ）
          </p>

          {authError && (
            <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input
              type="password"
              required
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              placeholder="請輸入管理員密碼 (admin123)"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700"
            >
              進入管理後台
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            主辦方管理後台
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            管理活動上線狀態、審核報名名單、餐飲便當統計、現場報到核銷與匯出 CSV 報表
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            新增活動
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            匯出 CSV 報表
          </button>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" />
            登出
          </button>
        </div>
      </div>

      {/* 若雲端尚未建立 events / registrations 資料表，顯示醒目引導卡片 */}
      {schemaMissing && (
        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
                <Database className="h-4 w-4 text-amber-700" />
                <span>
                  偵測到您的 Supabase 尚未建立 `events` 與 `registrations` 資料表（目前使用預覽資料）
                </span>
              </div>
              <p className="text-xs text-amber-800">
                請點擊右側「複製建表 SQL」，再打開您的 Supabase SQL Editor 貼上執行，即可立即啟用雲端資料庫同步！
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-800"
              >
                {sqlCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    已複製 SQL！
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    1. 複製建表 SQL
                  </>
                )}
              </button>
              <a
                href="https://supabase.com/dashboard/project/qfbijrsmazgubmrovmvm/sql/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-xl border border-amber-400 bg-white px-3.5 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100"
              >
                2. 開啟 SQL Editor
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>總活動場次</span>
            <Calendar className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {events.length}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>正取報名人數</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">
            {totalConfirmed}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>候補等待人數</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600">
            {totalWaitlist}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>已簽到 (報到率)</span>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-blue-700">
              {totalCheckedIn}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              ({checkInRate}%)
            </span>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>正取餐飲統計</span>
            <Utensils className="h-4 w-4 text-violet-600" />
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs font-bold">
            <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-700">
              葷 {normalMealCount}
            </span>
            <span className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700">
              素 {vegMealCount}
            </span>
            <span className="rounded-lg bg-slate-50 px-2 py-1 text-slate-400">
              不需 {noMealCount}
            </span>
          </div>
        </div>
      </div>

      {/* 快速序號報到核銷列 */}
      <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
        <form
          onSubmit={handleQuickCheckIn}
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-indigo-900">
            <QrCode className="h-5 w-5 text-indigo-600" />
            <span>現場快速報到核銷：</span>
          </div>
          <input
            type="text"
            value={quickTicketCode}
            onChange={(e) => setQuickTicketCode(e.target.value)}
            placeholder="輸入或掃描報名序號 (例如 REG-261101-B3K9)"
            className="flex-1 rounded-xl border border-indigo-200 bg-white px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700"
          >
            確認簽到
          </button>
        </form>
        {quickCheckInMsg && (
          <div className="mt-2 text-xs font-semibold text-indigo-800">
            {quickCheckInMsg}
          </div>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="mt-8 flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('registrations')}
          className={`border-b-2 px-5 py-3 text-sm font-bold transition ${
            activeTab === 'registrations'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          報名名單與簽到管理 ({registrations.length})
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`border-b-2 px-5 py-3 text-sm font-bold transition ${
            activeTab === 'events'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          活動場次設定 ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('database')}
          className={`border-b-2 px-5 py-3 text-sm font-bold transition ${
            activeTab === 'database'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Supabase 雲端建表與狀態
        </button>
      </div>

      {/* Tab 1: Registrations Table */}
      {activeTab === 'registrations' && (
        <div className="mt-6">
          {/* Filters */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-800"
            >
              <option value="all">所有活動場次</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-800"
            >
              <option value="all">所有狀態</option>
              <option value="confirmed">正取 (Confirmed)</option>
              <option value="waitlist">候補 (Waitlist)</option>
              <option value="checked_in">已現場簽到</option>
              <option value="cancelled">已取消</option>
            </select>

            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜尋姓名、Email、電話、單位或序號..."
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3.5 font-bold">現場簽到</th>
                  <th className="px-4 py-3.5 font-bold">報名序號</th>
                  <th className="px-4 py-3.5 font-bold">參加者資訊</th>
                  <th className="px-4 py-3.5 font-bold">報名活動</th>
                  <th className="px-4 py-3.5 font-bold">餐飲 / 備註</th>
                  <th className="px-4 py-3.5 font-bold">報名狀態</th>
                  <th className="px-4 py-3.5 font-bold text-right">狀態操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRegs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      沒有符合篩選條件的報名資料
                    </td>
                  </tr>
                ) : (
                  filteredRegs.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3.5">
                        <button
                          onClick={async () => {
                            await toggleCheckIn(reg.id, !reg.checked_in);
                            await loadAllData();
                          }}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold transition ${
                            reg.checked_in
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {reg.checked_in ? (
                            <>
                              <CheckSquare className="h-3.5 w-3.5" />
                              已簽到
                            </>
                          ) : (
                            <>
                              <Square className="h-3.5 w-3.5" />
                              未簽到
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-indigo-700">
                        {reg.ticket_code}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">
                          {reg.name}
                        </div>
                        <div className="text-slate-500">
                          {reg.email} · {reg.phone}
                        </div>
                        {reg.organization && (
                          <div className="text-slate-400">
                            {reg.organization}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="line-clamp-1 font-medium text-slate-800">
                          {reg.event?.title || reg.event_id}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                          {reg.dietary === 'normal'
                            ? '葷食'
                            : reg.dietary === 'vegetarian'
                            ? '素食'
                            : '不需餐點'}
                        </span>
                        {reg.notes && (
                          <div className="mt-1 max-w-xs truncate text-slate-500">
                            備註：{reg.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {reg.status === 'confirmed' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 font-semibold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" />
                            正取
                          </span>
                        ) : reg.status === 'waitlist' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 font-semibold text-amber-800">
                            <Clock className="h-3 w-3" />
                            候補
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 font-semibold text-rose-800">
                            <XCircle className="h-3 w-3" />
                            已取消
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <select
                          value={reg.status}
                          onChange={async (e) => {
                            await updateRegistrationStatus(
                              reg.id,
                              e.target.value as RegistrationStatus
                            );
                            await loadAllData();
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700"
                        >
                          <option value="confirmed">設為正取</option>
                          <option value="waitlist">設為候補</option>
                          <option value="cancelled">設為取消</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Events Management */}
      {activeTab === 'events' && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                    {ev.category}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      ev.status === 'open'
                        ? 'bg-emerald-100 text-emerald-800'
                        : ev.status === 'closed'
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {ev.status === 'open'
                      ? '開放報名'
                      : ev.status === 'closed'
                      ? '已截止'
                      : '草稿'}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-bold text-slate-900">
                  {ev.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  地點：{ev.location}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  名額統計：正取 {ev.confirmed_count || 0} / {ev.max_capacity} 人
                  （候補 {ev.waitlist_count || 0} 人）
                </p>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  onClick={() => openEditModal(ev)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  編輯活動
                </button>
                <button
                  onClick={() => handleDeleteEvent(ev)}
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  刪除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Supabase Cloud Database Setup & Status */}
      {activeTab === 'database' && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Supabase 雲端資料庫連線與初始化腳本
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                依據 <code>.antigravity/schema.md</code> 規範建立 <code>events</code> 與 <code>registrations</code> 資料表
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
              >
                {sqlCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    已複製 SQL
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    複製 SQL 腳本
                  </>
                )}
              </button>
              <a
                href="https://supabase.com/dashboard/project/qfbijrsmazgubmrovmvm/editor"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                打開 Supabase Table Editor
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-100">
            {SCHEMA_SQL_SNIPPET}
          </pre>
        </div>
      )}

      {/* Event Create/Edit Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl sm:p-8">
            <h2 className="text-xl font-bold text-slate-900">
              {editingEventId ? '編輯活動資訊' : '建立新活動'}
            </h2>

            <form onSubmit={handleSaveEvent} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">活動名稱 *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">活動分類 *</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">主辦單位 *</label>
                  <input
                    type="text"
                    required
                    value={formData.organizer}
                    onChange={(e) =>
                      setFormData({ ...formData, organizer: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">活動日期時間 *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.event_date}
                    onChange={(e) =>
                      setFormData({ ...formData, event_date: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">報名截止時間 *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.registration_deadline}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        registration_deadline: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">名額上限 *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.max_capacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_capacity: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">報名狀態</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as EventStatus,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm"
                  >
                    <option value="open">開放報名 (Open)</option>
                    <option value="closed">截止報名 (Closed)</option>
                    <option value="draft">草稿隱藏 (Draft)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">活動地點 / 會議連結 *</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">封面圖片網址</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">活動詳細介紹 *</label>
                <textarea
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  儲存活動
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
