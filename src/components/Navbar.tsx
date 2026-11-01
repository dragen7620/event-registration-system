'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarCheck,
  Search,
  ShieldCheck,
  Database,
  AlertCircle,
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { isSupabaseSchemaMissing, fetchEvents } from '@/lib/store';

export default function Navbar() {
  const pathname = usePathname();
  const connected = isSupabaseConfigured();
  const [schemaMissing, setSchemaMissing] = useState(false);

  useEffect(() => {
    fetchEvents().then(() => {
      setSchemaMissing(isSupabaseSchemaMissing());
    });
  }, [pathname]);

  const navItems = [
    { href: '/', label: '探索活動', icon: CalendarCheck },
    { href: '/lookup', label: '報名查詢 / 取消', icon: Search },
    { href: '/admin', label: '主辦方後台', icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition group-hover:bg-indigo-700">
            <CalendarCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              EventPass
            </span>
            <span className="ml-2 hidden rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 sm:inline-block">
              雲端報名系統
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/' || pathname.startsWith('/events')
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.label.split(' ')[0]}</span>
                </Link>
              );
            })}
          </nav>

          {/* 資料庫連線狀態徽章 */}
          <Link
            href="/admin"
            title={
              connected && !schemaMissing
                ? '已連線至 Supabase 雲端資料庫 (events & registrations)'
                : connected && schemaMissing
                ? '已連線 Supabase，但尚未執行建表 SQL（點擊前往後台查看一鍵建表指南）'
                : '目前為本地展示模式'
            }
            className={`hidden md:flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
              connected && !schemaMissing
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            {connected && !schemaMissing ? (
              <>
                <Database className="h-3.5 w-3.5" />
                <span>Supabase 雲端同步中</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-3.5 w-3.5" />
                <span>待執行 SQL 建表 (預覽模式)</span>
              </>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
