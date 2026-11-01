'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Users,
  ArrowRight,
  Search,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { fetchEvents } from '@/lib/store';
import { EventItem } from '@/lib/types';

export default function HomePage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');

  useEffect(() => {
    fetchEvents()
      .then((data) => {
        // 前台只顯示非草稿活動
        setEvents(data.filter((e) => e.status !== 'draft'));
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    '全部',
    ...Array.from(new Set(events.map((e) => e.category))),
  ];

  const filteredEvents = events.filter((ev) => {
    const matchCategory =
      selectedCategory === '全部' || ev.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      ev.title.toLowerCase().includes(q) ||
      ev.description.toLowerCase().includes(q) ||
      ev.location.toLowerCase().includes(q) ||
      ev.organizer.toLowerCase().includes(q);
    return matchCategory && matchSearch;
  });

  const formatDate = (iso: string) => {
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
    <div className="pb-16">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3.5 py-1.5 text-xs font-medium text-indigo-200 ring-1 ring-inset ring-indigo-400/30 mb-5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>秒速線上報名 · 自動核發 QR Code 電子入場憑證</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl leading-tight">
              探索精彩活動，
              <span className="text-indigo-300">一鍵預約您的席次</span>
            </h1>
            <p className="mt-4 text-base text-indigo-100/90 sm:text-lg">
              免註冊繁瑣帳號，填寫基本資料即可立即取得專屬報名序號與報到 QR Code。支援即時名額顯示、自動候補與線上狀態查詢。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#events-list"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-900 shadow-sm transition hover:bg-indigo-50"
              >
                瀏覽近期活動
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/lookup"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-700/60 px-5 py-3 text-sm font-semibold text-white ring-1 ring-inset ring-indigo-400/30 transition hover:bg-indigo-700"
              >
                <Search className="h-4 w-4" />
                查詢已報名活動
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filter Bar */}
      <section id="events-list" className="mx-auto -mt-7 max-w-6xl px-4 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋活動名稱、地點或主辦單位..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Event Cards Grid */}
      <section className="mx-auto mt-10 max-w-6xl px-4 sm:px-6">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="h-44 rounded-xl bg-slate-200" />
                <div className="mt-4 h-6 w-3/4 rounded bg-slate-200" />
                <div className="mt-3 h-4 w-1/2 rounded bg-slate-200" />
                <div className="mt-6 h-10 w-full rounded-xl bg-slate-200" />
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              沒有找到符合條件的活動
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              請嘗試調整搜尋關鍵字，或至「主辦方後台」新增您的第一場活動。
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((ev) => {
              const confirmed = ev.confirmed_count || 0;
              const waitlist = ev.waitlist_count || 0;
              const isFull =
                ev.max_capacity > 0 && confirmed >= ev.max_capacity;
              const isOpen = ev.status === 'open';
              const progressPercent =
                ev.max_capacity > 0
                  ? Math.min(100, Math.round((confirmed / ev.max_capacity) * 100))
                  : 0;

              return (
                <div
                  key={ev.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  {/* Image Header */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    <img
                      src={ev.image_url}
                      alt={ev.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3 flex gap-2">
                      <span className="rounded-lg bg-slate-900/75 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        {ev.category}
                      </span>
                    </div>
                    <div className="absolute right-3 top-3">
                      {!isOpen ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-800/90 px-2.5 py-1 text-xs font-semibold text-slate-200">
                          已截止
                        </span>
                      ) : isFull ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/95 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                          <AlertCircle className="h-3.5 w-3.5" />
                          正取額滿（開放候補）
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/95 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          開放報名中
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="text-xs font-medium text-indigo-600">
                      主辦：{ev.organizer}
                    </div>
                    <h2 className="mt-1 line-clamp-2 text-lg font-bold text-slate-900 group-hover:text-indigo-600">
                      {ev.title}
                    </h2>

                    <div className="mt-4 space-y-2 text-xs text-slate-600">
                      <div className="flex items-start gap-2">
                        <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <span>{formatDate(ev.event_date)}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <span className="line-clamp-1">{ev.location}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <span>報名截止：{formatDate(ev.registration_deadline)}</span>
                      </div>
                    </div>

                    {/* Capacity Bar */}
                    <div className="mt-5 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          已報名：{confirmed} / {ev.max_capacity} 人
                        </span>
                        {waitlist > 0 && (
                          <span className="text-amber-600 font-medium">
                            候補 {waitlist} 人
                          </span>
                        )}
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isFull ? 'bg-amber-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-5 pt-1">
                      <Link
                        href={`/events/${ev.id}`}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                          !isOpen
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : isFull
                            ? 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-300 hover:bg-amber-100'
                            : 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
                        }`}
                      >
                        {!isOpen
                          ? '查看活動詳情'
                          : isFull
                          ? '登記候補席次'
                          : '立即報名參加'}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
