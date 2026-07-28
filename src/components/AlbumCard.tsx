import React from 'react';
import { Album } from '../types';
import { formatFileSize } from '../utils/albumStorage';
import { QrCode, Eye, Image as ImageIcon, Trash2, Edit3, Calendar, Sparkles } from 'lucide-react';

interface AlbumCardProps {
  album: Album;
  onSelect: (album: Album) => void;
  onOpenQR: (album: Album) => void;
  onViewReadOnly: (album: Album) => void;
  onDelete: (id: string) => void;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({
  album,
  onSelect,
  onOpenQR,
  onViewReadOnly,
  onDelete,
}) => {
  const coverUrl = album.coverPhotoUrl || album.photos?.[0]?.url || '';
  const photoCount = album.photos?.length || 0;

  return (
    <div className="group relative rounded-3xl bg-slate-900 border border-amber-500/20 hover:border-amber-500/60 transition-all overflow-hidden shadow-xl hover:shadow-amber-500/10 flex flex-col justify-between">
      
      {/* Cover Image */}
      <div 
        onClick={() => onViewReadOnly(album)}
        className="relative aspect-[16/10] bg-slate-950 overflow-hidden cursor-pointer"
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={album.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-950">
            <ImageIcon className="w-12 h-12" />
          </div>
        )}

        {/* Count Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-amber-300 text-xs font-bold border border-amber-500/30">
          <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
          <span>{photoCount} صورة</span>
        </div>

        {/* Views Count */}
        {album.viewsCount !== undefined && album.viewsCount > 0 && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/80 text-slate-300 text-[10px] font-mono border border-slate-800">
            <Eye className="w-3 h-3 text-amber-400" />
            <span>{album.viewsCount} مشاهدة</span>
          </div>
        )}

        {/* Read only tag overlay */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="px-4 py-2 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-1.5">
            <Eye className="w-4 h-4" />
            <span>عرض الألبوم</span>
          </span>
        </div>
      </div>

      {/* Info Body */}
      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-amber-100 line-clamp-1 font-serif group-hover:text-amber-300 transition-colors">
            {album.title}
          </h3>

          {album.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              {album.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-3">
            {album.eventDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-400" />
                <span>{album.eventDate}</span>
              </span>
            )}
            <span>•</span>
            <span>تم التحديث: {new Date(album.updatedAt).toLocaleDateString('ar-SA')}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
          
          <button
            onClick={() => onOpenQR(album)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 transition-colors cursor-pointer"
            title="طباعة رمز QR الخاص بهذا الألبوم"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>رمز QR والطباعة</span>
          </button>

          <button
            onClick={() => onSelect(album)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="تعديل الصور والبيانات"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(album.id)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
            title="حذف الألبوم"
          >
            <Trash2 className="w-4 h-4" />
          </button>

        </div>
      </div>

    </div>
  );
};
