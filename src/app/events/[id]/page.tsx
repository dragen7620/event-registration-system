'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Building2,
  User,
  Mail,
  Phone,
  Utensils,
  FileText,
  Loader2,
} from 'lucide-react';
import { fetchEventById, submitRegistration } from '@/lib/store';
import { DietaryOption, EventItem } from '@/lib/types';

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const eventId = params?.id || '';

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [dietary, setDietary] = useState<DietaryOption>('normal');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!eventId) return;
    fetchEventById(eventId)
      .then((data) => setEvent(data))
      .finally(() => setLoading(false));
  }, [eventId]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setErrorMsg('請填寫所有必填欄位（姓名、Email、聯絡電話）');
      return;
    }

    setSubmitting(true);
    try {
      const reg = await submitRegistration({
        event_id: eventId,
        name,
        email,
        phone,
        organization,
        dietary,
        notes,
      });
      router.push(`/registration/success/${reg.ticket_code}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : '報名提交失敗，請稍後再試';
      setErrorMsg(message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-bold text-slate-900">找不到此活動</h2>
        <p className="mt-2 text-slate-600">該活動可能已下架或連結有誤。</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" />
          返回活動列表
        </Link>
      </div>
    );
  }

  const confirmed = event.confirmed_count || 0;
  const waitlist = event.waitlist_count || 0;
  const remaining = Math.max(0, event.max_capacity - confirmed);
  const isFull = event.max_capacity > 0 && confirmed >= event.max_capacity;
  const isOpen = event.status === 'open';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" />
        返回所有活動
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-12">
        {/* 左側：活動詳細內容 (佔 7 欄) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative h-64 sm:h-80 w-full bg-slate-100">
              <img
                src={event.image_url}
                alt={event.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute left-4 top-4 flex gap-2">
                <span className="rounded-lg bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {event.category}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="text-sm font-semibold text-indigo-600">
                主辦單位：{event.organizer}
              </div>
              <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                {event.title}
              </h1>

              {/* 活動資訊卡片 */}
              <div className="mt-6 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 border border-slate-100">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                  <div>
                    <div className="text-xs font-medium text-slate-500">
                      活動時間
                    </div>
                    <div className="mt-0.5 text-sm font-semibold text-slate-900">
                      {formatDate(event.event_date)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                  <div>
                    <div className="text-xs font-medium text-slate-500">
                      報名截止
                    </div>
                    <div className="mt-0.5 text-sm font-semibold text-slate-900">
                      {formatDate(event.registration_deadline)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:col-span-2">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                  <div>
                    <div className="text-xs font-medium text-slate-500">
                      活動地點
                    </div>
                    <div className="mt-0.5 text-sm font-semibold text-slate-900">
                      {event.location}
                    </div>
                  </div>
                </div>
              </div>

              {/* 活動詳細說明 */}
              <div className="mt-8">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
                  活動介紹與須知
                </h2>
                <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {event.description}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右側：即時名額與線上報名表單 (佔 5 欄) */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            {/* 名額狀態頂部提示 */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">線上報名表單</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  提交後將立即產生電子報到憑證
                </p>
              </div>
              <div className="text-right">
                {!isOpen ? (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    已截止報名
                  </span>
                ) : isFull ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    候補登記中
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    剩餘 {remaining} 名額
                  </span>
                )}
              </div>
            </div>

            {/* 目前報名人數統計列 */}
            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="h-4 w-4 text-indigo-600" />
                正取名額：{confirmed} / {event.max_capacity} 人
              </span>
              {waitlist > 0 && (
                <span className="font-semibold text-amber-700">
                  目前候補：{waitlist} 人
                </span>
              )}
            </div>

            {isFull && isOpen && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800">
                <strong>正取名額已滿：</strong>
                您現在提交表單將自動排入<strong>「候補名單」</strong>。若有正取者取消報名，主辦單位將依序遞補通知。
              </div>
            )}

            {errorMsg && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700">
                {errorMsg}
              </div>
            )}

            {!isOpen ? (
              <div className="mt-6 rounded-xl bg-slate-100 p-6 text-center text-sm text-slate-600">
                本活動目前已關閉線上報名，若有任何疑問請洽詢主辦單位（{event.organizer}）。
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    參加者姓名 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="請輸入真實姓名"
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    電子信箱 (Email) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@mail.com（用於查詢報名與接收通知）"
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    手機號碼 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912-345-678"
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    服務單位 / 學校系級（選填）
                  </label>
                  <div className="relative mt-1.5">
                    <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="例如：XX大學資管系 / XX科技公司"
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    餐飲需求
                  </label>
                  <div className="relative mt-1.5">
                    <Utensils className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select
                      value={dietary}
                      onChange={(e) => setDietary(e.target.value as DietaryOption)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="normal">葷食 (Normal)</option>
                      <option value="vegetarian">素食 (Vegetarian)</option>
                      <option value="none">不需餐點 (No Meal)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    備註或提問（選填）
                  </label>
                  <div className="relative mt-1.5">
                    <FileText className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="有任何想事先詢問講者或主辦單位的問題嗎？"
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-sm transition ${
                    isFull
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  } disabled:opacity-60`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      正在送出報名資料...
                    </>
                  ) : isFull ? (
                    '送出候補登記'
                  ) : (
                    '確認送出報名'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
