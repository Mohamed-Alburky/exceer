import React, { useState, useEffect, useRef } from 'react';
import { Album, Photo } from '../types';
import { formatFileSize, incrementAlbumView } from '../utils/albumStorage';
import { Lock, Sparkles, Download, Eye, Calendar, Camera, Play, Pause, ChevronRight, ChevronLeft, Maximize2, Minimize2, QrCode, Share2, Check, ArrowUpRight, MessageSquare, Send, Bot, ShieldAlert, X, Loader2 } from 'lucide-react';

interface ReadOnlyAlbumViewProps {
  album: Album;
  onOpenQRModal: () => void;
  onHomeClick: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  isRefusal?: boolean;
}

export const ReadOnlyAlbumView: React.FC<ReadOnlyAlbumViewProps> = ({
  album,
  onOpenQRModal,
  onHomeClick,
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isSlideshowActive, setIsSlideshowActive] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'large'>('grid');

  // AI Assistant Chat State
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: `مرحباً بك! أنا مساعد الإكسير الذكي للصور. يمكنني وصف الصور أو الإجابة عن أي استفسار يتعلق بهذ الألبوم ("${album?.title || 'الإكسير'}").`,
    },
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isAskingAi, setIsAskingAi] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Check if user is in read-only guest mode / barcode visitor
  const isGuestView = typeof window !== 'undefined' && (
    window.location.hash.startsWith('#album/') ||
    window.location.hash.startsWith('#view/') ||
    window.location.search.includes('guest=true') ||
    window.location.search.includes('album=')
  );

  useEffect(() => {
    if (isAiAssistantOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isAiAssistantOpen]);

  useEffect(() => {
    if (album?.id) {
      incrementAlbumView(album.id);
    }
  }, [album?.id]);

  // Slideshow Timer
  useEffect(() => {
    let timer: any = null;
    const totalPhotos = album?.photos?.length || 0;
    if (isSlideshowActive && selectedPhotoIndex !== null && totalPhotos > 0) {
      timer = setInterval(() => {
        setSelectedPhotoIndex((prev) => (prev === null ? 0 : (prev + 1) % totalPhotos));
      }, 4000);
    }
    return () => clearInterval(timer);
  }, [isSlideshowActive, selectedPhotoIndex, album?.photos?.length]);

  // Keyboard Navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const totalPhotos = album?.photos?.length || 0;
      if (selectedPhotoIndex === null || totalPhotos === 0) return;
      if (e.key === 'ArrowRight') {
        setSelectedPhotoIndex((prev) => (prev === null ? 0 : (prev - 1 + totalPhotos) % totalPhotos));
      } else if (e.key === 'ArrowLeft') {
        setSelectedPhotoIndex((prev) => (prev === null ? 0 : (prev + 1) % totalPhotos));
      } else if (e.key === 'Escape') {
        setSelectedPhotoIndex(null);
        setIsSlideshowActive(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, album?.photos?.length]);

  if (!album || !album.photos) {
    return (
      <div className="max-w-4xl mx-auto my-20 p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <Lock className="w-12 h-12 text-amber-400 mx-auto" />
        <h3 className="text-xl font-bold text-amber-200">الألبوم غير متوفر أو جاري تحميل البيانات...</h3>
        <button onClick={onHomeClick} className="px-5 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl">
          العودة للرئيسية
        </button>
      </div>
    );
  }

  const activePhoto = selectedPhotoIndex !== null ? album.photos[selectedPhotoIndex] : null;

  const handleDownloadPhoto = (photo: Photo) => {
    const a = document.createElement('a');
    a.href = photo.url;
    a.download = `Elixir-${album.title}-${photo.name || 'photo'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || chatInput).trim();
    if (!text || isAskingAi) return;

    const userMsg: ChatMessage = { role: 'user', text };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsAskingAi(true);

    try {
      const res = await fetch(`/api/albums/${album.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          photoId: activePhoto?.id,
        }),
      });

      const data = await res.json();
      const reply = data.reply || 'صلاحيتك هي العرض فقط. Scan to view images only.';
      const isRefusal = reply.includes('صلاحيتك هي العرض فقط') || reply.includes('Scan to view images only');

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: reply,
          isRefusal,
        },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'صلاحيتك هي العرض فقط. Scan to view images only.',
          isRefusal: true,
        },
      ]);
    } finally {
      setIsAskingAi(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100 animate-fade-in">
      
      {/* Read-Only Top Header Bar */}
      <div className="relative rounded-3xl bg-slate-900/90 border border-amber-500/30 p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          <div className="space-y-3 max-w-2xl">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>{isGuestView ? 'زائر الباركود (Read-Only)' : 'عرض قراءة فقط (Read-Only)'}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>جودة أصيلة Full HD</span>
              </div>
            </div>

            {/* Album Title & Description */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-amber-100 font-serif tracking-tight">
              {album.title}
            </h1>

            {album.description && (
              <p className="text-sm text-slate-300 leading-relaxed font-sans">
                {album.description}
              </p>
            )}

            {/* Metadata pills */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-sans pt-1">
              {album.photographer && (
                <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>تصوير: {album.photographer}</span>
                </div>
              )}

              {album.eventDate && (
                <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>تاريخ المناسبة: {album.eventDate}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                <Eye className="w-4 h-4 text-amber-400" />
                <span>عدد الصور: {album.photos.length} صوّة</span>
              </div>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAiAssistantOpen(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30 transition-colors shadow-lg shadow-amber-500/10 cursor-pointer"
            >
              <Bot className="w-4 h-4 text-amber-400" />
              <span>مساعد الإكسير (AI)</span>
            </button>

            <button
              onClick={() => {
                setSelectedPhotoIndex(0);
                setIsSlideshowActive(true);
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>تشغيل العرض التلقائي</span>
            </button>

            <button
              onClick={onOpenQRModal}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs border border-slate-700 transition-colors"
            >
              <QrCode className="w-4 h-4" />
              <span>عرض رمز QR للطباعة</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'تم نسخ رابط الألبوم' : 'مشاركة الرابط'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* View controls */}
      <div className="flex items-center justify-between px-2 text-xs">
        <div className="text-slate-400 font-semibold">
          استعرض الصور وانقر على أي صورة لمعاينتها بدقة Full HD مكبرة:
        </div>

        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setLayoutMode('grid')}
            className={`px-3 py-1 rounded-lg transition-colors font-bold ${
              layoutMode === 'grid' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            شبكي
          </button>
          <button
            onClick={() => setLayoutMode('large')}
            className={`px-3 py-1 rounded-lg transition-colors font-bold ${
              layoutMode === 'large' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            بطاقات مكبرة
          </button>
        </div>
      </div>

      {/* Photos Gallery */}
      <div
        className={
          layoutMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'grid grid-cols-1 md:grid-cols-2 gap-8'
        }
      >
        {album.photos.map((photo, index) => (
          <div
            key={photo.id}
            onClick={() => {
              setSelectedPhotoIndex(index);
              setZoomLevel(1);
            }}
            className="group relative rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-500/10"
          >
            <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
              <img
                src={photo.url}
                alt={photo.caption || photo.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />

              {/* Quality Tag */}
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-amber-300 border border-amber-500/30">
                {photo.qualityTag}
              </div>

              {/* Resolution overlay */}
              <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-lg bg-slate-950/70 text-[10px] text-slate-300 font-mono">
                {photo.width} × {photo.height}
              </div>

              {/* Hover overlay button */}
              <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="p-3.5 rounded-full bg-slate-900/90 text-amber-400 border border-amber-500/50 shadow-xl transform scale-90 group-hover:scale-100 transition-transform flex items-center gap-2 text-xs font-bold">
                  <Maximize2 className="w-4 h-4" />
                  <span>معاينة مكبرة HD</span>
                </div>
              </div>
            </div>

            {/* Caption / Footer if present */}
            {photo.caption && (
              <div className="p-3.5 bg-slate-900 border-t border-slate-800/80 text-xs text-slate-200 line-clamp-2">
                {photo.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Fullscreen High-Res Lightbox Modal */}
      {selectedPhotoIndex !== null && activePhoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-4 animate-fade-in">
          
          {/* Lightbox Header */}
          <div className="flex items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-amber-400 font-mono">
                {selectedPhotoIndex + 1} / {album.photos.length}
              </span>
              <div className="h-4 w-px bg-slate-700"></div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">{activePhoto.name}</h4>
                <p className="text-[10px] text-slate-400 font-mono">
                  {activePhoto.width} × {activePhoto.height} • {activePhoto.qualityTag} • {formatFileSize(activePhoto.size)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSlideshowActive(!isSlideshowActive)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  isSlideshowActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isSlideshowActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isSlideshowActive ? 'إيقاف التلقائي' : 'عرض تلقائي'}</span>
              </button>

              <button
                onClick={() => handleDownloadPhoto(activePhoto)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold transition-colors"
                title="تحميل بجودة HD الكاملة"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">تحميل الأصل</span>
              </button>

              <button
                onClick={() => {
                  setSelectedPhotoIndex(null);
                  setIsSlideshowActive(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
              >
                إغلاق (Esc)
              </button>
            </div>
          </div>

          {/* Lightbox Main Image Frame */}
          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            
            {/* Previous Photo Button */}
            <button
              onClick={() =>
                setSelectedPhotoIndex(
                  (selectedPhotoIndex - 1 + album.photos.length) % album.photos.length
                )
              }
              className="absolute right-4 z-20 p-3 rounded-2xl bg-slate-900/80 hover:bg-amber-500 hover:text-slate-950 text-slate-200 border border-slate-700 transition-all cursor-pointer"
              title="الصورة السابقة"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Next Photo Button */}
            <button
              onClick={() =>
                setSelectedPhotoIndex((selectedPhotoIndex + 1) % album.photos.length)
              }
              className="absolute left-4 z-20 p-3 rounded-2xl bg-slate-900/80 hover:bg-amber-500 hover:text-slate-950 text-slate-200 border border-slate-700 transition-all cursor-pointer"
              title="الصورة التالية"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Main High Res Image */}
            <div className="max-w-5xl max-h-[75vh] flex items-center justify-center p-2">
              <img
                src={activePhoto.url}
                alt={activePhoto.caption || activePhoto.name}
                className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-2xl transition-transform duration-300"
                style={{ transform: `scale(${zoomLevel})` }}
              />
            </div>
          </div>

          {/* Lightbox Footer & Captions */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="text-amber-200 font-medium">
              {activePhoto.caption ? activePhoto.caption : 'لا يوجد شرح لهذه الصورة'}
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">التكبير:</span>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-200 font-bold hover:bg-slate-700"
              >
                -
              </button>
              <span className="font-mono text-amber-300 px-2">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-200 font-bold hover:bg-slate-700"
              >
                +
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 text-[10px]"
              >
                إعادة ضبط
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Floating AI Assistant Trigger Button */}
      <button
        onClick={() => setIsAiAssistantOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-xs shadow-2xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-amber-300/40"
      >
        <Bot className="w-5 h-5 text-slate-950" />
        <span>مساعد الإكسير الذكي</span>
      </button>

      {/* AI Photo Assistant Slide-Over Drawer */}
      {isAiAssistantOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex justify-end animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border-r border-slate-800 flex flex-col h-full shadow-2xl relative dir-rtl">
            
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-amber-100 flex items-center gap-2">
                    مساعد الإكسير الذكي
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] border border-amber-500/30 font-mono">Read-Only</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">استفسر عن محتوى الصور والألبوم</p>
                </div>
              </div>

              <button
                onClick={() => setIsAiAssistantOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Read-Only Scope Protection Banner */}
            <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800/80 flex items-center gap-2 text-[11px] text-amber-300">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>هذا المعرض محمي بصلاحية العرض فقط. لا يمكن إدراج تعديلات.</span>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed font-sans ${
                      msg.role === 'user'
                        ? 'bg-slate-800 text-slate-100 border border-slate-700 font-semibold'
                        : msg.isRefusal
                        ? 'bg-rose-950/90 border border-rose-500/50 text-rose-100 font-bold shadow-xl'
                        : 'bg-amber-500/10 border border-amber-500/30 text-amber-100'
                    }`}
                  >
                    {msg.isRefusal && (
                      <div className="flex items-center gap-1.5 mb-1.5 text-rose-400 text-[11px] font-mono">
                        <Lock className="w-3.5 h-3.5" />
                        <span>تنبيه الحماية (Read-Only Guardrail)</span>
                      </div>
                    )}
                    {msg.text}
                  </div>
                </div>
              ))}

              {isAskingAi && (
                <div className="flex items-center gap-2 text-xs text-amber-400 p-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تحليل استفسارك بواسطة الذكاء الاصطناعي...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Question Chips */}
            <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex flex-wrap gap-2 text-[11px]">
              <button
                onClick={() => handleSendMessage("صف لي محتوى الألبوم")}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium transition-colors border border-slate-700 cursor-pointer"
              >
                صف لي الألبوم 🖼️
              </button>
              <button
                onClick={() => handleSendMessage("كم عدد الصور وما هي جودتها؟")}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors border border-slate-700 cursor-pointer"
              >
                تفاصيل الجودة 🔍
              </button>
              <button
                onClick={() => handleSendMessage("امسح هذه الصورة")}
                className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-medium transition-colors border border-rose-800/40 cursor-pointer"
              >
                اختبار الحذف 🚫
              </button>
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-slate-950 border-t border-slate-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="اسأل مساعد الإكسير عن الصور..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isAskingAi}
                  className="p-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
