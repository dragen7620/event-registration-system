import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'EventPass 線上活動報名與管理系統 | GitHub + Vercel + Supabase',
  description:
    '現代化線上活動報名、電子票券 QR Code 報到與後台名單管理系統',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className=" flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 EventPass 線上活動報名系統. Built with Next.js, Vercel & Supabase.</p>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span>支援即時名額計算</span>
              <span>•</span>
              <span>QR Code 電子入場券</span>
              <span>•</span>
              <span>CSV 名單匯出</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
