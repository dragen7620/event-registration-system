'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Ticket,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { lookupRegistrations, updateRegistrationStatus } from '@/lib/store';
import { RegistrationItem } from '@/lib/types';

export default function LookupPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RegistrationItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const targetQuery = customQuery !== undefined ? customQuery : query;
    if (!targetQuery.trim()) return;

    setLoading(true);
    try {
      const data = await lookupRegistrations(targetQuery);
      setResults(data);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRegistration = async (reg: RegistrationItem) => {
    const ok = window.confirm(
      `確定要取消「${reg.event?.title || '此活動'}」的報名嗎？（序號：${reg.ticket_code}）`
    );
    if (!ok) return;

    await updateRegistrationStatus(reg.id, 'cancelled');
    const refreshed = await lookupRegistrations(query);
    setResults(refreshed);
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
          查詢報名狀態與電子憑證
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          請輸入您報名時填寫的 <strong>電子信箱 (Email)</strong>、<strong>手機號碼</strong> 或 <strong>報名序號 (REG-...)</strong>
        </p>
      </div>

      {/* Search Box */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={(e) => handleSearch(e)} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="例如：ming@example.com 或 0912345678 或 REG-261101-A8F2"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
          >
            <Search className="h-4 w-4" />
            {loading ? '查詢中...' : '立即查詢'}
          </button>
        </form>

        {/* 快速測試提示 */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>快速範例測試：</span>
          <button
            type="button"
            onClick={() => {
              setQuery('ming@example.com');
              handleSearch(undefined, 'ming@example.com');
            }}
            className="rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-indigo-600 hover:bg-indigo-50"
          >
            ming@example.com (王小明)
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery('REG-261101-B3K9');
              handleSearch(undefined, 'REG-261101-B3K9');
            }}
            className="rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-indigo-600 hover:bg-indigo-50"
          >
            REG-261101-B3K9 (林佳穎)
          </button>
        </div>
      </div>

      {/* Results List */}
      {searched && (
        <div className="mt-8 space-y-4">
          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-3 text-base font-bold text-slate-900">
                查無相符的報名紀錄
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                請確認輸入的 Email、電話或序號是否與報名時填寫的一致。
              </p>
            </div>
          ) : (
            results.map((reg) => (
              <div
                key={reg.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 font-mono text-xs font-bold text-indigo-700">
                        <Ticket className="h-3.5 w-3.5" />
                        {reg.ticket_code}
                      </span>

                      {reg.status === 'confirmed' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          正取成功
                        </span>
                      ) : reg.status === 'waitlist' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                          <Clock className="h-3.5 w-3.5" />
                          候補名單
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
                          <XCircle className="h-3.5 w-3.5" />
                          已取消報名
                        </span>
                      )}

                      {reg.checked_in && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                          已完成現場報到
                        </span>
                      )}
                    </div>

                    <h2 className="mt-3 text-lg font-bold text-slate-900">
                      {reg.event?.title || '活動項目'}
                    </h2>

                    <div className="mt-2 space-y-1 text-xs text-slate-600">
                      <p>
                        參加人：<strong>{reg.name}</strong> ({reg.email} /{' '}
                        {reg.phone})
                      </p>
                      {reg.event && (
                        <>
                          <p className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            活動時間：{formatDate(reg.event.event_date)}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            活動地點：{reg.event.location}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                    {reg.status !== 'cancelled' && (
                      <>
                        <Link
                          href={`/registration/success/${reg.ticket_code}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                        >
                          查看 QR Code 憑證
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                        {!reg.checked_in && (
                          <button
                            onClick={() => handleCancelRegistration(reg)}
                            className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            取消報名
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
