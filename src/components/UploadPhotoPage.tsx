import React, { useState, useRef } from 'react';
import { Photo } from '../types';
import { readFileAsDataURL, detectQualityTag, formatFileSize } from '../utils/albumStorage';
import { UploadCloud, Image as ImageIcon, QrCode, Trash2, Crown, ArrowRight, Sparkles, CheckCircle2, AlertCircle, Eye, ArrowUp, ArrowDown } from 'lucide-react';

interface UploadPhotoPageProps {
  albumTitle: string;
  albumDescription?: string;
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  onSaveAndGenerateQR: () => void;
  onBackToDetails: () => void;
  coverPhotoUrl?: string;
  onSetCoverPhotoUrl: (url: string) => void;
}

export const UploadPhotoPage: React.FC<UploadPhotoPageProps> = ({
  albumTitle,
  albumDescription,
  photos,
  onPhotosChange,
  onSaveAndGenerateQR,
  onBackToDetails,
  coverPhotoUrl,
  onSetCoverPhotoUrl,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList | File[]) => {
    setIsProcessing(true);
    const newPhotos: Photo[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      try {
        const { url, width, height } = await readFileAsDataURL(file);
        const qualityTag = detectQualityTag(width, height);

        const newPhoto: Photo = {
          id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          url,
          name: file.name,
          size: file.size,
          width,
          height,
          mimeType: file.type,
          createdAt: new Date().toISOString(),
          qualityTag,
        };
        newPhotos.push(newPhoto);
      } catch (err) {
        console.error('Error processing file:', file.name, err);
      }
    }

    if (newPhotos.length > 0) {
      const updated = [...photos, ...newPhotos];
      onPhotosChange(updated);
      if (!coverPhotoUrl && updated.length > 0) {
        onSetCoverPhotoUrl(updated[0].url);
      }
    }
    setIsProcessing(false);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDeletePhoto = (id: string) => {
    const updated = photos.filter((p) => p.id !== id);
    onPhotosChange(updated);
    if (coverPhotoUrl && photos.find((p) => p.id === id)?.url === coverPhotoUrl) {
      onSetCoverPhotoUrl(updated[0]?.url || '');
    }
  };

  const handleMovePhoto = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= photos.length) return;
    const list = [...photos];
    const [moved] = list.splice(index, 1);
    list.splice(targetIdx, 0, moved);
    onPhotosChange(list);
  };

  const handleCaptionChange = (id: string, caption: string) => {
    const list = photos.map((p) => (p.id === id ? { ...p, caption } : p));
    onPhotosChange(list);
  };

  const totalSize = photos.reduce((acc, p) => acc + p.size, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-slate-100">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900/90 border border-amber-500/30 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
              الخطوة 2 من 3
            </span>
            <span className="text-xs text-slate-400">رفع الصور وحفظ الجودة الأصلية</span>
          </div>
          <h2 className="text-2xl font-bold text-amber-100 mt-1 font-serif">{albumTitle}</h2>
          {albumDescription && <p className="text-sm text-slate-400 mt-1">{albumDescription}</p>}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDetails}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors border border-slate-700"
            id="btn-back-details"
          >
            <ArrowRight className="w-4 h-4" />
            <span>تعديل التفاصيل</span>
          </button>

          <button
            onClick={onSaveAndGenerateQR}
            disabled={photos.length === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-xl transition-all ${
              photos.length > 0
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
            id="btn-save-generate-qr-top"
          >
            <QrCode className="w-5 h-5" />
            <span>حفظ وتوليد QR</span>
          </button>
        </div>
      </div>

      {/* Quality Assurance Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 flex items-start sm:items-center gap-3 text-xs text-emerald-200 shadow-md">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
        <div className="space-y-0.5">
          <span className="font-bold text-emerald-300">ضمان الجودة الكاملة (Full HD / HD Original):</span>
          <p className="text-slate-300">
            يتم حفظ جميع الصور بدقتها وألوانها الأصلية بدون أي ضغط أو تقليل للأبعاد، لكي تظهر للزوار بأعلى وضوح عند مسح QR code.
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleFileDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
            : 'border-slate-700 hover:border-amber-500/60 bg-slate-900/60 hover:bg-slate-900'
        }`}
        id="zone-upload-drop"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="input-file-photos"
        />

        <div className="max-w-md mx-auto space-y-3 pointer-events-none">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-amber-100">اسحب وإسقاط الصور هنا</h3>
            <p className="text-xs text-slate-400 mt-1">أو انقر لاختيار الصور من الهاتف أو الجهاز المحمول</p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-amber-300/80 font-mono">
            <span>يدعم: JPG, PNG, WEBP, HEIC</span>
            <span>•</span>
            <span>دقة غير محدودة (Full HD / 4K)</span>
          </div>
        </div>

        {isProcessing && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-3xl flex items-center justify-center text-amber-300 font-bold text-sm gap-2">
            <Sparkles className="w-5 h-5 animate-spin" />
            <span>جاري معالجة وتحليل الصور وتنسيق الجودة...</span>
          </div>
        )}
      </div>

      {/* Summary Bar */}
      {photos.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <ImageIcon className="w-4 h-4" />
              <span>إجمالي الصور: {photos.length}</span>
            </div>
            <div className="text-slate-400">
              الحجم الإجمالي: <span className="font-mono font-bold text-slate-200">{formatFileSize(totalSize)}</span>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
            <span>إضافة المزيد من الصور</span>
          </button>
        </div>
      )}

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <div className="py-12 text-center text-slate-500 space-y-2">
          <AlertCircle className="w-10 h-10 mx-auto text-slate-600" />
          <p className="text-sm">لم يتم إضافة أي صور بعد. قم برفع الصور للمتابعة.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo, index) => {
            const isCover = coverPhotoUrl === photo.url;
            return (
              <div
                key={photo.id}
                className={`group relative rounded-2xl bg-slate-900 border transition-all overflow-hidden flex flex-col ${
                  isCover ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-lg shadow-amber-500/10' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Image Box */}
                <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Quality Badge Overlay */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-amber-300 border border-amber-500/30">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{photo.qualityTag}</span>
                  </div>

                  {/* Cover Badge */}
                  {isCover && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black shadow-md">
                      <Crown className="w-3 h-3" />
                      <span>غلاف الألبوم</span>
                    </div>
                  )}

                  {/* Image Resolution & Size info */}
                  <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-lg bg-slate-950/70 text-[10px] text-slate-300 font-mono">
                    {photo.width} × {photo.height} ({formatFileSize(photo.size)})
                  </div>

                  {/* Quick Preview Hover Action */}
                  <button
                    onClick={() => setPreviewPhoto(photo)}
                    className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    title="معاينة المكبرة"
                  >
                    <div className="p-3 rounded-full bg-slate-900/90 text-amber-400 border border-amber-500/40 transform scale-90 group-hover:scale-100 transition-transform">
                      <Eye className="w-5 h-5" />
                    </div>
                  </button>
                </div>

                {/* Photo Actions & Caption */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between bg-slate-900/90">
                  <input
                    type="text"
                    value={photo.caption || ''}
                    onChange={(e) => handleCaptionChange(photo.id, e.target.value)}
                    placeholder="اكتب شرحاً أو تعليقاً لهذه الصورة..."
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
                  />

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
                    {/* Order buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMovePhoto(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
                        title="تحريك للأمام"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMovePhoto(index, 'down')}
                        disabled={index === photos.length - 1}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
                        title="تحريك للخلف"
                      >
                        <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isCover && (
                        <button
                          onClick={() => onSetCoverPhotoUrl(photo.url)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-[11px] font-semibold transition-colors"
                        >
                          جعله الغلاف
                        </button>
                      )}

                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="حذف الصورة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Save & Generate QR Bottom Sticky CTA */}
      {photos.length > 0 && (
        <div className="sticky bottom-6 z-30 p-4 rounded-3xl bg-slate-900/95 backdrop-blur-xl border border-amber-500/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <QrCode className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-100">الألبوم جاهز للتوليد والطباعة</h4>
              <p className="text-xs text-slate-400">
                سيتم إنشاء رمز QR واقحامه في بطاقة طباعة قابلة للتنزيل والمشاركة مباشرة.
              </p>
            </div>
          </div>

          <button
            onClick={onSaveAndGenerateQR}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-base shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            id="btn-save-generate-qr-bottom"
          >
            <QrCode className="w-5 h-5" />
            <span>حفظ وتوليد QR الآن</span>
          </button>
        </div>
      )}

      {/* Full Resolution Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-slate-900 border border-amber-500/30 rounded-3xl overflow-hidden p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-bold text-amber-200 text-sm">{previewPhoto.name}</h4>
                <p className="text-xs text-slate-400 font-mono">
                  {previewPhoto.width} × {previewPhoto.height} • {previewPhoto.qualityTag} • {formatFileSize(previewPhoto.size)}
                </p>
              </div>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="px-3 py-1 rounded-xl bg-slate-800 text-xs font-bold hover:bg-slate-700"
              >
                إغلاق
              </button>
            </div>

            <div className="max-h-[70vh] flex items-center justify-center overflow-hidden rounded-2xl bg-slate-950">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.name}
                className="max-h-[65vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
