import React from 'react';
import { Album } from '../types';
import { Sparkles, Lock, Camera, Calendar } from 'lucide-react';

interface PrintTemplateProps {
  album: Album;
  qrDataUrl: string;
  albumUrl: string;
}

export const PrintTemplate: React.FC<PrintTemplateProps> = ({
  album,
  qrDataUrl,
  albumUrl,
}) => {
  return (
    <div className="print-template hidden print:block bg-white text-slate-900 p-8 max-w-2xl mx-auto font-sans">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-template, .print-template * {
            visibility: visible;
          }
          .print-template {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: white !important;
            color: black !important;
            padding: 2cm !important;
            box-sizing: border-box;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>

      {/* Frame Container */}
      <div className="border-4 border-slate-900 rounded-3xl p-8 space-y-6 text-center relative overflow-hidden bg-white">
        
        {/* Corner Crop Marks for Professional Printing */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-slate-400"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-slate-400"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-slate-400"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-slate-400"></div>

        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3 border-b-2 border-slate-900 pb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 font-serif">الإكسير</h1>
            <p className="text-xs text-slate-600 font-bold">ألبوم صور تفاعلي | رمز استجابة سريعة</p>
          </div>
        </div>

        {/* Album Title */}
        <div className="space-y-1 my-4">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">عنوان الألبوم</span>
          <h2 className="text-3xl font-extrabold text-slate-900">{album.title}</h2>
          {album.description && (
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">{album.description}</p>
          )}
        </div>

        {/* High Contrast QR Code Display */}
        <div className="my-6 inline-block p-4 rounded-2xl border-2 border-slate-900 bg-white shadow-none">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR Code"
              className="w-64 h-64 mx-auto object-contain block"
              style={{ imageRendering: 'pixelated' }}
            />
          ) : (
            <div className="w-64 h-64 bg-slate-100 flex items-center justify-center text-xs">جاري التوليد...</div>
          )}
          <div className="mt-2 text-[11px] font-bold text-slate-700 tracking-wider">
            دقة قراءة عالية HD • متوافق مع كافة الأجهزة
          </div>
        </div>

        {/* Scanning Instructions */}
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs space-y-1.5 max-w-md mx-auto">
          <div className="flex items-center justify-center gap-1.5 font-bold text-slate-900">
            <Lock className="w-4 h-4 text-slate-700" />
            <span>امسح الكود بالكاميرا للوصول المباشر (عرض فقط)</span>
          </div>
          <p className="text-[11px] text-slate-600">
            وجه كاميرا الهاتف نحو الباركود لعرض الصور بالجودة الكاملة (Full HD) بدون الحاجة إلى تثبيت أي تطبيق.
          </p>
        </div>

        {/* Footer Metadata */}
        <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-xs text-slate-600 font-medium">
          {album.photographer && (
            <div className="flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-slate-800" />
              <span>المصور: {album.photographer}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-800" />
            <span>التاريخ: {album.eventDate || new Date().toLocaleDateString('ar-SA')}</span>
          </div>
          <div className="font-mono text-[10px] text-slate-500">
            {album.photos.length} صورة HD
          </div>
        </div>

        {/* Short Link */}
        <div className="text-[10px] text-slate-400 font-mono break-all pt-1">
          {albumUrl}
        </div>

      </div>
    </div>
  );
};
