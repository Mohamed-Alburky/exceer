import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Album, QRDesignConfig } from '../types';
import { PrintTemplate } from './PrintTemplate';
import { QrCode, Printer, Download, Copy, ExternalLink, Check, Sparkles, ShieldCheck, RefreshCw, X, FileImage, FileCode } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  album: Album;
  onViewReadOnlyAlbum: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  album,
  onViewReadOnlyAlbum,
}) => {
  const [qrPngDataUrl, setQrPngDataUrl] = useState<string>('');
  const [qrSvgString, setQrSvgString] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(true);

  const [config, setConfig] = useState<QRDesignConfig>({
    fgColor: '#000000',
    bgColor: '#ffffff',
    margin: 4,
    errorCorrectionLevel: 'H',
    includeTitleInPrint: true,
    printFormat: 'A4',
  });

  // Calculate full album read-only URL
  const getAlbumUrl = () => {
    const origin = window.location.origin;
    return `${origin}/#album/${album.id}`;
  };

  const albumUrl = getAlbumUrl();

  // Generate high quality QR code whenever album or config changes
  useEffect(() => {
    if (!isOpen || !album) return;

    setIsGenerating(true);
    const url = getAlbumUrl();

    const qrLib: any = QRCode;
    const toDataURLFn = qrLib?.toDataURL || qrLib?.default?.toDataURL;
    const toStringFn = qrLib?.toString || qrLib?.default?.toString;

    if (typeof toDataURLFn === 'function') {
      toDataURLFn(url, {
        width: 600,
        margin: config.margin,
        errorCorrectionLevel: config.errorCorrectionLevel,
        color: {
          dark: config.fgColor,
          light: config.bgColor,
        },
      })
        .then((png: string) => {
          setQrPngDataUrl(png);
          setIsGenerating(false);
        })
        .catch((err: any) => {
          console.error('Failed to generate PNG QR code:', err);
          setIsGenerating(false);
        });
    } else {
      setIsGenerating(false);
    }

    if (typeof toStringFn === 'function') {
      toStringFn(url, {
        type: 'svg',
        margin: config.margin,
        errorCorrectionLevel: config.errorCorrectionLevel,
        color: {
          dark: config.fgColor,
          light: config.bgColor,
        },
      })
        .then((svg: string) => setQrSvgString(svg))
        .catch((err: any) => console.error('Failed to generate SVG QR code:', err));
    }
  }, [isOpen, album, config]);

  if (!isOpen || !album) return null;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(albumUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      }
    } catch (e) {
      console.warn('Clipboard write failed, using execCommand fallback', e);
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = albumUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Fallback copy failed', err);
    }
  };

  const handleDownloadPng = () => {
    if (!qrPngDataUrl) return;
    const a = document.createElement('a');
    a.href = qrPngDataUrl;
    a.download = `QR-Elixir-${album.title.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSvg = () => {
    if (!qrSvgString) return;
    const blob = new Blob([qrSvgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR-Elixir-${album.title.replace(/\s+/g, '_')}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Hidden print template for window.print() */}
      <PrintTemplate album={album} qrDataUrl={qrPngDataUrl} albumUrl={albumUrl} />

      {/* Screen Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto print:hidden animate-fade-in">
        <div 
          className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl shadow-amber-500/10 overflow-hidden text-slate-100 my-8"
          id="modal-qr-code"
        >
          {/* Modal Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-amber-950/50 to-slate-900 border-b border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-amber-100 font-serif">رمز QR وبطاقة الألبوم</h3>
                <p className="text-xs text-slate-400">تم حفظ الألبوم وتوليد الرمز المخصص للطباعة والمشاركة</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              id="btn-close-qr-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Guarantee Badge */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/20 text-xs text-amber-200 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="leading-relaxed">
                <span className="font-bold text-amber-300">توافق عالي وسهولة مسح:</span> صُمّم الباركود بتباين أسود/أبيض عالي الدقة (Error Correction Level H) ليعمل مع كافة الكاميرات والهواتف القديمة والجديدة دون أي صعوبة في المسح.
              </p>
            </div>

            {/* QR Card Preview Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 text-center space-y-4">
              
              <div className="inline-block p-4 rounded-2xl bg-white border-2 border-slate-900 shadow-xl relative">
                {isGenerating ? (
                  <div className="w-56 h-56 flex items-center justify-center text-slate-900 text-xs gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>جاري توليد الباركود...</span>
                  </div>
                ) : (
                  <img
                    src={qrPngDataUrl}
                    alt="Album QR Code"
                    className="w-56 h-56 mx-auto object-contain block"
                    style={{ imageRendering: 'pixelated' }}
                  />
                )}
                <div className="mt-2 text-[10px] font-bold text-slate-900 tracking-tight font-sans">
                  الإكسير • {album.title}
                </div>
              </div>

              {/* Album info */}
              <div>
                <h4 className="text-lg font-extrabold text-amber-200">{album.title}</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  يتضمن {album.photos.length} صورة بدقة HD • بصلاحية قراءة فقط (Read-Only)
                </p>
              </div>

              {/* URL Display */}
              <div className="flex items-center gap-2 max-w-md mx-auto p-2 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-mono text-slate-300">
                <span className="truncate flex-1 text-right text-[11px] dir-ltr text-amber-300/90">{albumUrl}</span>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[11px] font-sans font-bold transition-colors shrink-0"
                  id="btn-copy-qr-link"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ الرابط</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Main Action Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Print Button (Primary) */}
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                id="btn-print-qr-card"
              >
                <Printer className="w-5 h-5" />
                <span>طباعة بطاقة الألبوم مباشرة</span>
              </button>

              {/* View Read-Only Album */}
              <button
                onClick={onViewReadOnlyAlbum}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm border border-slate-700 transition-colors cursor-pointer"
                id="btn-preview-readonly"
              >
                <ExternalLink className="w-4 h-4 text-amber-400" />
                <span>معاينة صفحة الألبوم (عرض فقط)</span>
              </button>

              {/* Download PNG */}
              <button
                onClick={handleDownloadPng}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors"
                id="btn-download-png"
              >
                <FileImage className="w-4 h-4 text-emerald-400" />
                <span>تنزيل الباركود (صورة PNG عالية الدقة)</span>
              </button>

              {/* Download SVG */}
              <button
                onClick={handleDownloadSvg}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors"
                id="btn-download-svg"
              >
                <FileCode className="w-4 h-4 text-amber-400" />
                <span>تنزيل الباركود (ملف متجهي SVG)</span>
              </button>

            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>تم الإنشاء بواسطة منصة الإكسير</span>
            <button
              onClick={onClose}
              className="text-amber-400 font-bold hover:underline"
            >
              إغلاق العرض
            </button>
          </div>

        </div>
      </div>
    </>
  );
};
