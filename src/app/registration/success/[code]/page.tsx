'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  Copy,
  Check,
  ArrowLeft,
  Printer,
  Search,
  CalendarPlus,
} from 'lucide-react';
import { fetchRegistrationByTicket } from '@/lib/store';
import { RegistrationItem } from '@/lib/types';

export default function RegistrationSuccessPage() {
  const params = useParams<{ code: string }>();
  const ticketCode = decodeURIComponent(params?.code || '');

  const [reg, setReg] = useState<RegistrationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!ticketCode) return;
    fetchRegistrationByTicket(ticketCode)
      .then((data) => setReg(data))
      .finally(() => setLoading(false));
  }, [ticketCode]);

  const handleCopyCode = () => {
    if (!reg) return;
    navigator.clipboard.writeText(reg.ticket_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '-';
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

  // 產生 Google Calendar 加入連結
  const getGoogleCalendarUrl = () => {
    if (!reg?.event) return '#';
    const start = new Date(reg.event.event_date);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // 預設 2 小時
    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const title = encodeURIComponent(reg.event.title);
    const details = encodeURIComponent(
      `【報名憑證序號】${reg.ticket_code}\n【參加人】${reg.name}\n\n${reg.event.description}`
    );
    const location = encodeURIComponent(reg.event.location);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(
      start
    )}/${fmt(end)}&details=${details}&location=${location}`;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (!reg) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-bold text-slate-900">找不到此報名憑證</h2>
        <p className="mt-2 text-sm text-slate-600">
          請確認您的報名序號是否正確，或前往查詢頁面輸入 Email 查詢。
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/lookup"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Search className="h-4 w-4" />
            前往報名查詢
          </Link>
        </div>
      </div>
    );
  }

  const isConfirmed = reg.status === 'confirmed';

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
        {/* Top Banner */}
        <div
          className={`px-6 py-8 text-center text-white ${
            isConfirmed
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
              : 'bg-gradient-to-r from-amber-500 to-orange-500'
          }`}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            {isConfirmed ? (
              <CheckCircle2 className="h-8 w-8 text-white" />
            ) : (
              <Clock className="h-8 w-8 text-white" />
            )}
          </div>
          <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">
            {isConfirmed ? '報名成功！電子入場憑證' : '已完成候補登記！'}
          </h1>
          <p className="mt-1.5 text-sm text-white/90">
            {isConfirmed
              ? '請截圖保存此畫面或記下報名序號，活動當日出示 QR Code 即可快速報到'
              : '目前活動正取名額已滿，若有正取者取消，系統將依序為您遞補'}
          </p>
        </div>

        {/* Ticket Content */}
        <div className="p-6 sm:p-8">
          {/* QR Code & Ticket Code Box */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
              <QRCodeSVG
                value={reg.ticket_code}
                size={168}
                level="M"
                includeMargin={false}
              />
            </div>

            <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              專屬報名序號 (Ticket Code)
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono text-2xl font-black tracking-wider text-indigo-700">
                {reg.ticket_code}
              </span>
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 print:hidden"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    已複製
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    複製
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Event Summary */}
          {reg.event && (
            <div className="mt-6 rounded-2xl bg-indigo-50/60 p-5 border border-indigo-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-indigo-600">報名活動</div>
                <a
                  href={getGoogleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm ring-1 ring-inset ring-indigo-200 hover:bg-indigo-50 print:hidden"
                >
                  <CalendarPlus className="h-3.5 w-3.5" />
                  加入 Google 行事曆
                </a>
              </div>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                {reg.event.title}
              </h2>
              <div className="mt-3 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <span>{formatDate(reg.event.event_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-indigo-600" />
                  <span>{reg.event.location}</span>
                </div>
              </div>
            </div>
          )}

          {/* Attendee Info */}
          <div className="mt-6">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              報名者資料明細
            </h3>
            <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs text-slate-500">姓名</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">
                  {reg.name}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs text-slate-500">報名狀態</dt>
                <dd className="mt-0.5 font-semibold">
                  {reg.status === 'confirmed' ? (
                    <span className="text-emerald-700">正取成功</span>
                  ) : reg.status === 'waitlist' ? (
                    <span className="text-amber-700">候補等待中</span>
                  ) : (
                    <span className="text-rose-600">已取消</span>
                  )}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs text-slate-500">電子信箱</dt>
                <dd className="mt-0.5 font-semibold text-slate-900 break-all">
                  {reg.email}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs text-slate-500">聯絡電話</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">
                  {reg.phone}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs text-slate-500">單位 / 學校</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">
                  {reg.organization || '未填寫'}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs text-slate-500">餐飲需求</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">
                  {reg.dietary === 'normal'
                    ? '葷食'
                    : reg.dietary === 'vegetarian'
                    ? '素食'
                    : '不需餐點'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6 print:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              返回首頁
            </Link>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Printer className="h-4 w-4" />
                列印 / 存為 PDF
              </button>
              <Link
                href="/lookup"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Search className="h-4 w-4" />
                管理我的報名
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
