import React, { useState } from 'react';
import { Sparkles, FolderPlus, User, Calendar, FileText, ArrowLeft, X } from 'lucide-react';

interface CreateAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: {
    title: string;
    description: string;
    photographer: string;
    eventDate: string;
    themeColor: string;
  }) => void;
}

export const CreateAlbumModal: React.FC<CreateAlbumModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photographer, setPhotographer] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [themeColor, setThemeColor] = useState('#f59e0b'); // Default Amber
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('يرجى كتابة عنوان الألبوم للمتابعة');
      return;
    }
    setError('');
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      photographer: photographer.trim(),
      eventDate,
      themeColor,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-xl bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl shadow-amber-500/10 overflow-hidden text-slate-100"
        id="modal-create-album"
      >
        {/* Header Ribbon */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
              <FolderPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-amber-100 font-serif">إنشاء ألبوم جديد</h2>
              <p className="text-xs text-slate-400">الخطوة 1 من 3: إدخال تفاصيل وبيانات الألبوم</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            id="btn-close-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>عنوان الألبوم *</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="مثال: ألبوم حفل الزفاف، رحلة العلا، معرض الصور الفنية..."
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-sans"
              id="input-album-title"
              autoFocus
            />
          </div>

          {/* Description Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>وصف الألبوم (اختياري)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب نبذة أو ذكرى خاصة بهذا الألبوم..."
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-all resize-none font-sans"
              id="input-album-description"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Photographer Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>اسم المصور / المالك</span>
              </label>
              <input
                type="text"
                value={photographer}
                onChange={(e) => setPhotographer(e.target.value)}
                placeholder="مثال: المصور استوديو الإكسير"
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-all"
                id="input-album-photographer"
              />
            </div>

            {/* Event Date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>تاريخ المناسبة</span>
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-sm text-slate-100 focus:outline-none focus:border-amber-400 transition-all"
                id="input-album-date"
              />
            </div>
          </div>

          {/* Theme Color Selector */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-semibold text-slate-300">لون الطابع المرئي للألبوم</label>
            <div className="flex items-center gap-3">
              {[
                { name: 'عنبري ملكي', hex: '#f59e0b' },
                { name: 'زمردي', hex: '#10b981' },
                { name: 'ياقوتي', hex: '#e11d48' },
                { name: 'سافاير فاخر', hex: '#3b82f6' },
                { name: 'بنفسجي داكن', hex: '#8b5cf6' },
              ].map((color) => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => setThemeColor(color.hex)}
                  className={`w-8 h-8 rounded-full transition-transform flex items-center justify-center border-2 ${
                    themeColor === color.hex ? 'scale-110 border-white ring-2 ring-amber-400/50' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              id="btn-cancel-create"
            >
              إلغاء
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              id="btn-proceed-to-upload"
            >
              <span>المتابعة لرفع الصور</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
