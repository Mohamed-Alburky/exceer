import React, { useState, useEffect } from 'react';
import { Album, Photo, ViewMode } from './types';
import { fetchAllAlbums, fetchAlbumById, saveAlbumToApi } from './utils/albumStorage';
import { Header } from './components/Header';
import { CreateAlbumModal } from './components/CreateAlbumModal';
import { UploadPhotoPage } from './components/UploadPhotoPage';
import { QRCodeModal } from './components/QRCodeModal';
import { ReadOnlyAlbumView } from './components/ReadOnlyAlbumView';
import { AlbumCard } from './components/AlbumCard';
import { Sparkles, QrCode, PlusCircle, Search, ShieldCheck, Printer, Camera, CheckCircle2, Image as ImageIcon, ArrowLeft } from 'lucide-react';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form State during creation
  const [workingTitle, setWorkingTitle] = useState('');
  const [workingDesc, setWorkingDesc] = useState('');
  const [workingPhotographer, setWorkingPhotographer] = useState('');
  const [workingDate, setWorkingDate] = useState('');
  const [workingThemeColor, setWorkingThemeColor] = useState('#f59e0b');
  const [workingPhotos, setWorkingPhotos] = useState<Photo[]>([]);
  const [workingCoverUrl, setWorkingCoverUrl] = useState('');

  // Helper to extract albumId from URL
  const getAlbumIdFromUrl = (): string => {
    const hash = window.location.hash;
    const path = window.location.pathname;
    const search = window.location.search;

    if (hash.startsWith('#album/')) {
      return hash.replace('#album/', '');
    } else if (hash.startsWith('#view/')) {
      return hash.replace('#view/', '');
    } else if (path.startsWith('/album/')) {
      return path.replace('/album/', '');
    } else if (path.startsWith('/view/')) {
      return path.replace('/view/', '');
    } else if (search.includes('album=')) {
      const params = new URLSearchParams(search);
      return params.get('album') || '';
    }
    return '';
  };

  // Synchronized initial load & URL router handling
  useEffect(() => {
    let isMounted = true;

    const initialLoad = async () => {
      setIsLoading(true);
      const albumId = getAlbumIdFromUrl();

      // Always fetch albums list for dashboard
      const list = await fetchAllAlbums();
      if (!isMounted) return;
      setAlbums(list);

      if (albumId) {
        // Fetch specific album by ID before navigating to reader view
        const found = await fetchAlbumById(albumId);
        if (!isMounted) return;
        if (found) {
          setActiveAlbum(found);
          setViewMode('read-only-viewer');
        } else {
          setActiveAlbum(null);
          setViewMode('read-only-viewer');
        }
      } else {
        setActiveAlbum(null);
        setViewMode('home');
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    const handleUrlChange = async () => {
      const albumId = getAlbumIdFromUrl();
      if (albumId) {
        setIsLoading(true);
        const found = await fetchAlbumById(albumId);
        if (!isMounted) return;
        if (found) {
          setActiveAlbum(found);
          setViewMode('read-only-viewer');
        } else {
          setActiveAlbum(null);
          setViewMode('read-only-viewer');
        }
        setIsLoading(false);
      } else {
        if (!window.location.hash && (window.location.pathname === '/' || window.location.pathname === '')) {
          setViewMode('home');
          setActiveAlbum(null);
        }
      }
    };

    initialLoad();

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      isMounted = false;
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // Handler: Start New Album Creation Flow
  const handleStartCreate = () => {
    setWorkingTitle('');
    setWorkingDesc('');
    setWorkingPhotographer('');
    setWorkingDate(new Date().toISOString().split('T')[0]);
    setWorkingPhotos([]);
    setWorkingCoverUrl('');
    setIsCreateModalOpen(true);
  };

  // Handler: Submit Step 1 details
  const handleCreateDetailsSubmit = (details: {
    title: string;
    description: string;
    photographer: string;
    eventDate: string;
    themeColor: string;
  }) => {
    setWorkingTitle(details.title);
    setWorkingDesc(details.description);
    setWorkingPhotographer(details.photographer);
    setWorkingDate(details.eventDate);
    setWorkingThemeColor(details.themeColor);
    setIsCreateModalOpen(false);
    setViewMode('upload');
  };

  // Handler: Save Album & Generate QR Code (Step 2 -> Step 3)
  const handleSaveAndGenerateQR = async () => {
    if (!workingTitle.trim() || workingPhotos.length === 0) return;

    const albumId = activeAlbum?.id || `elixir-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const coverUrl = workingCoverUrl || workingPhotos[0]?.url || '';

    const newAlbum: Album = {
      id: albumId,
      title: workingTitle,
      description: workingDesc,
      photographer: workingPhotographer,
      eventDate: workingDate,
      themeColor: workingThemeColor,
      photos: workingPhotos,
      coverPhotoUrl: coverUrl,
      createdAt: activeAlbum?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewsCount: activeAlbum?.viewsCount || 0,
    };

    const saved = await saveAlbumToApi(newAlbum);
    setActiveAlbum(saved);

    // Switch view to read-only album viewer & set URL hash for sharing/scanning
    setViewMode('read-only-viewer');
    window.location.hash = `album/${saved.id}`;

    // Refresh list
    const updatedList = await fetchAllAlbums();
    setAlbums(updatedList);

    // Open QR Modal
    setIsQRModalOpen(true);
  };

  // Delete Album
  const handleDeleteAlbum = async (id: string) => {
    if (!confirm('هل أنت تأكد من إرادة حذف هذا الألبوم؟')) return;
    try {
      await fetch(`/api/albums/${id}`, { method: 'DELETE' });
    } catch (e) {
      // ignore
    }
    const updatedList = await fetchAllAlbums();
    setAlbums(updatedList);
    if (activeAlbum?.id === id) {
      setActiveAlbum(null);
      setViewMode('home');
      window.location.hash = '';
    }
  };

  // Edit Existing Album
  const handleEditAlbum = (album: Album) => {
    setActiveAlbum(album);
    setWorkingTitle(album.title);
    setWorkingDesc(album.description || '');
    setWorkingPhotographer(album.photographer || '');
    setWorkingDate(album.eventDate || '');
    setWorkingThemeColor(album.themeColor || '#f59e0b');
    setWorkingPhotos(album.photos || []);
    setWorkingCoverUrl(album.coverPhotoUrl || album.photos?.[0]?.url || '');
    setViewMode('upload');
  };

  // View Read Only Album
  const handleViewReadOnly = async (album: Album) => {
    setIsLoading(true);
    const fetched = await fetchAlbumById(album.id);
    setActiveAlbum(fetched || album);
    setViewMode('read-only-viewer');
    window.location.hash = `album/${album.id}`;
    setIsLoading(false);
  };

  const filteredAlbums = albums.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.photographer?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 dir-rtl">
      
      {/* Header */}
      <Header
        onCreateClick={handleStartCreate}
        onHomeClick={() => {
          setViewMode('home');
          setActiveAlbum(null);
          window.location.hash = '';
        }}
        albumsCount={albums.length}
        currentMode={viewMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="py-20 text-center space-y-3 text-amber-400">
            <Sparkles className="w-8 h-8 animate-spin mx-auto" />
            <p className="text-xs font-bold font-sans">جاري تحميل بيانات الألبوم والجاهزية...</p>
          </div>
        )}

        {/* View Mode 1: Read-Only Public Album View */}
        {!isLoading && viewMode === 'read-only-viewer' && (
          activeAlbum ? (
            <ReadOnlyAlbumView
              album={activeAlbum}
              onOpenQRModal={() => setIsQRModalOpen(true)}
              onHomeClick={() => {
                setViewMode('home');
                setActiveAlbum(null);
                window.location.hash = '';
              }}
            />
          ) : (
            <div className="max-w-xl mx-auto my-16 p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-amber-100">الألبوم غير متوفر أو غير موجود</h3>
              <p className="text-xs text-slate-400">
                تعذر العثور على بيانات الألبوم المطلوبة. يرجى التأكد من صحة الرابط أو اختيار ألبوم آخر.
              </p>
              <button
                onClick={() => {
                  setViewMode('home');
                  setActiveAlbum(null);
                  window.location.hash = '';
                }}
                className="px-6 py-2.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400 transition-colors cursor-pointer"
              >
                العودة للرئيسية
              </button>
            </div>
          )
        )}

        {/* View Mode 2: Photo Upload & Management Page */}
        {!isLoading && viewMode === 'upload' && (
          <UploadPhotoPage
            albumTitle={workingTitle}
            albumDescription={workingDesc}
            photos={workingPhotos}
            onPhotosChange={setWorkingPhotos}
            onSaveAndGenerateQR={handleSaveAndGenerateQR}
            onBackToDetails={() => setIsCreateModalOpen(true)}
            coverPhotoUrl={workingCoverUrl}
            onSetCoverPhotoUrl={setWorkingCoverUrl}
          />
        )}

        {/* View Mode 3: Home Dashboard */}
        {!isLoading && viewMode === 'home' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
            
            {/* Hero Banner Section */}
            <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 p-8 sm:p-12 overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10 max-w-3xl space-y-6 text-right">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>توليد باركود ألبومات الصور عالية الجودة</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-amber-100 font-serif leading-tight">
                  أنشئ ألبوم صور خاص، ولّد رمز QR قابل للطباعة، وشاركه بلمسة واحدة.
                </h1>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
                  منصة <strong className="text-amber-300">الإكسير</strong> تمكّنك من حفظ صورك بدقتها الأصلية <span className="text-amber-300 font-mono font-bold">(Full HD / 4K)</span> دون أي ضغط، مع توليد باركود بسيط ومتوافق للطباعة المباشرة على البطاقات والأطارات.
                </p>

                {/* Primary CTA button */}
                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <button
                    onClick={handleStartCreate}
                    className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-base shadow-xl shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    id="btn-hero-create-album"
                  >
                    <PlusCircle className="w-6 h-6" />
                    <span>إنشاء ألبوم جديد الآن</span>
                  </button>

                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>رموز QR عالية التباين جاهزة للطباعة فوراً</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                  <Camera className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-amber-100 font-serif">حفظ الجودة الأصلية</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  تُحفظ جميع الصور بنفس الدقة الكاملة التي رفعها المستخدم دون أي معالجة ضاغطة أو تقليل للوضوح.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-amber-100 font-serif">باراكود مبسط للطباعة</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  توليد كود QR عالي التباين متوافق مع كافة الهواتف والأجهزة القديمة، ومصمم للطباعة الورقية المباشرة.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-amber-100 font-serif">عرض قراءة فقط (Read-Only)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  عند مسح الباركود يُوجه الزائر مباشرة لمعاينة الصور فقط بدون إمكانية التعديل أو الحذف، لحماية ألبومك.
                </p>
              </div>
            </div>

            {/* Saved Albums Section */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-amber-100 font-serif">ألبوماتي المحفوظة</h2>
                  <p className="text-xs text-slate-400">إدارة الألبومات، استعراض الاكواد، وطباعة بطاقات المشاركة</p>
                </div>

                {/* Search Bar */}
                {albums.length > 0 && (
                  <div className="relative max-w-xs w-full">
                    <Search className="w-4 h-4 text-slate-500 absolute top-3 right-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="البحث في الألبومات..."
                      className="w-full pl-4 pr-9 py-2 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}
              </div>

              {/* Album List */}
              {filteredAlbums.length === 0 ? (
                <div className="py-16 text-center bg-slate-900/50 border border-slate-800/80 rounded-3xl space-y-4 p-8">
                  <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-200">لا توجد ألبومات محفوظة حالياً</h3>
                    <p className="text-xs text-slate-400">ابدأ بإنشاء ألبومك الأول وتوليد رمز QR الخاص به بسهولة.</p>
                  </div>
                  <button
                    onClick={handleStartCreate}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors cursor-pointer"
                    id="btn-create-first-album"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>إنشاء ألبوم جديد</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAlbums.map((album) => (
                    <AlbumCard
                      key={album.id}
                      album={album}
                      onSelect={handleEditAlbum}
                      onOpenQR={(alb) => {
                        setActiveAlbum(alb);
                        setIsQRModalOpen(true);
                      }}
                      onViewReadOnly={handleViewReadOnly}
                      onDelete={handleDeleteAlbum}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-serif font-bold text-amber-200 text-sm">منصة الإكسير - Al-Elixir</p>
          <p>إنشاء ألبومات الصور عالية الجودة وتوليد رموز QR الاحترافية للطباعة والمشاركة</p>
        </div>
      </footer>

      {/* Step 1: Create Album Details Modal */}
      <CreateAlbumModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateDetailsSubmit}
      />

      {/* Step 3: QR Code & Printable Card Modal */}
      {activeAlbum && (
        <QRCodeModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          album={activeAlbum}
          onViewReadOnlyAlbum={() => {
            setIsQRModalOpen(false);
            handleViewReadOnly(activeAlbum);
          }}
        />
      )}

    </div>
  );
}
