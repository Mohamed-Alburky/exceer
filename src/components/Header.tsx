import React from 'react';
import { Sparkles, PlusCircle, FolderHeart, Printer, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onCreateClick: () => void;
  onHomeClick: () => void;
  albumsCount: number;
  currentMode: string;
}

export const Header: React.FC<HeaderProps> = ({
  onCreateClick,
  onHomeClick,
  albumsCount,
  currentMode,
}) => {

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-amber-500/20 text-slate-100 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <button
          onClick={onHomeClick}
          className="flex items-center gap-3 group text-right focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg p-1 transition-all"
          id="btn-brand-logo"
        >
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-6 h-6 animate-pulse text-slate-950" />
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-300"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-l from-amber-200 via-amber-400 to-amber-100 font-serif">
                الإكسير
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-sans font-bold">
                HD Original
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              ألبومات الصور الذكية ورموز QR للطباعة
            </p>
          </div>
        </button>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {currentMode !== 'read-only-viewer' ? (
            <>
              <button
                onClick={onHomeClick}
                className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors border border-slate-700/60"
                id="btn-my-albums"
              >
                <FolderHeart className="w-4 h-4 text-amber-400" />
                <span>ألبوماتي ({albumsCount})</span>
              </button>

              <button
                onClick={onCreateClick}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                id="btn-create-album-main"
              >
                <PlusCircle className="w-5 h-5" />
                <span>إنشاء ألبوم جديد</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>عرض الألبوم (قراءة فقط)</span>
              </div>
              <button
                onClick={onHomeClick}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                id="btn-home-readonly-header"
              >
                <span>الرئيسية</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
