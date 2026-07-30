import { Album, Photo } from '../types';
import { supabase } from '../lib/supabase';

const LOCAL_STORAGE_KEY = 'elixir_local_albums_v1';
const IDB_NAME = 'elixir_albums_db_v1';
const IDB_STORE = 'albums';

// Open IndexedDB database for large multi-MB photo album storage
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof window === 'undefined' || !('indexedDB' in window) || !window.indexedDB) {
        return reject(new Error('IndexedDB not supported'));
      }
      const request = window.indexedDB.open(IDB_NAME, 1);
      request.onupgradeneeded = () => {
        try {
          const db = request.result;
          if (!db.objectStoreNames.contains(IDB_STORE)) {
            db.createObjectStore(IDB_STORE, { keyPath: 'id' });
          }
        } catch (err) {
          console.warn('IDB upgrade failed:', err);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IDB open request error'));
    } catch (err) {
      reject(err);
    }
  });
}

export async function saveIndexedDBAlbum(album: Album): Promise<void> {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(album);
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (e) {
    console.warn('IndexedDB save warning:', e);
  }
}

export async function getIndexedDBAlbum(id: string): Promise<Album | null> {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(id);
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

export async function getAllIndexedDBAlbums(): Promise<Album[]> {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).getAll();
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (e) {
    return [];
  }
}

export async function deleteIndexedDBAlbum(id: string): Promise<void> {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(id);
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (e) {
    console.warn('IndexedDB delete warning:', e);
  }
}

// Format file size nicely
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Determine Quality Tag based on dimensions
export function detectQualityTag(width: number, height: number): Photo['qualityTag'] {
  const maxDim = Math.max(width, height);
  if (maxDim >= 3840) return '4K Ultra HD';
  if (maxDim >= 1800) return 'Full HD 1080p';
  if (maxDim >= 1200) return 'HD 720p';
  return 'قياسية';
}

// Read File as raw high quality Data URL
export function readFileAsDataURL(file: File): Promise<{ url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return reject(new Error('فشل قراءة الملف'));

      const img = new Image();
      img.onload = () => {
        resolve({
          url: result,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
        });
      };
      img.onerror = () => reject(new Error('تعذر قراءة أبعاد الصورة'));
      img.src = result;
    };
    reader.onerror = () => reject(new Error('خطأ في قراءة الصورة'));
    reader.readAsDataURL(file);
  });
}

// Local Storage Fallback
export function getLocalAlbums(): Album[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load local albums from localStorage', e);
    return [];
  }
}

export function saveLocalAlbum(album: Album) {
  try {
    const albums = getLocalAlbums();
    const idx = albums.findIndex((a) => a.id === album.id);
    if (idx >= 0) {
      albums[idx] = album;
    } else {
      albums.unshift(album);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(albums));
  } catch (e) {
    console.warn('LocalStorage save warning:', e);
  }
}

export function deleteLocalAlbum(id: string) {
  try {
    const albums = getLocalAlbums();
    const updated = albums.filter((a) => a.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage delete warning:', e);
  }
}

// Supabase Direct Storage Bucket Upload ('reports' bucket)
export async function uploadImageToSupabaseBucket(fileOrBlob: File | Blob, albumId: string, photoId: string): Promise<string | null> {
  try {
    const mime = fileOrBlob.type || 'image/jpeg';
    const ext = mime.split('/')[1] || 'jpg';
    const fileName = `album-${albumId}/${photoId}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('reports')
      .upload(fileName, fileOrBlob, {
        contentType: mime,
        upsert: true,
      });

    if (error) {
      console.warn('Supabase storage upload error:', error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('reports')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn('Supabase storage upload exception:', err);
    return null;
  }
}

// Convert Base64 Data URL to Blob for Supabase Bucket Upload
export async function uploadDataUrlToSupabase(dataUrl: string, albumId: string, photoId: string): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const uploadedUrl = await uploadImageToSupabaseBucket(blob, albumId, photoId);
    return uploadedUrl || dataUrl;
  } catch (err) {
    console.warn('Failed to upload dataUrl to Supabase:', err);
    return dataUrl;
  }
}

// Map Supabase 'monthly_reports' row to Album model
function mapRowToAlbum(row: any): Album {
  return {
    id: String(row.id),
    title: row.title || row.name || 'ألبوم بدون عنوان',
    description: row.description || row.desc || '',
    photographer: row.photographer || row.author || '',
    eventDate: row.event_date || row.eventDate || row.date || '',
    themeColor: row.theme_color || row.themeColor || '#f59e0b',
    photos: Array.isArray(row.photos) ? row.photos : (typeof row.photos === 'string' ? JSON.parse(row.photos) : []),
    coverPhotoUrl: row.cover_photo_url || row.coverPhotoUrl || row.cover_url || '',
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
    viewsCount: Number(row.views_count || row.viewsCount || row.views || 0),
  };
}

// Helper to safely parse any album ID into a numeric number/bigint for Supabase query inputs
export function toBigIntId(id: string | number): number {
  if (typeof id === 'number') return Math.floor(id);
  const parsed = Number(id);
  if (!isNaN(parsed) && isFinite(parsed)) {
    return Math.floor(parsed);
  }
  // If string contains non-digit characters like 'elixir-1721234567', extract digits
  const digitsOnly = String(id).replace(/\D/g, '');
  if (digitsOnly.length > 0) {
    const num = Number(digitsOnly.slice(-15));
    if (!isNaN(num) && num > 0) return num;
  }
  // Fallback hashing for string text
  let hash = 0;
  const str = String(id);
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 2147483647;
  }
  return Math.abs(hash) || Date.now();
}

// Fetch all albums directly from Supabase 'monthly_reports'
export async function fetchAllAlbums(): Promise<Album[]> {
  try {
    const { data, error } = await supabase
      .from('monthly_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      const albums = data.map(mapRowToAlbum);
      for (const alb of albums) {
        saveIndexedDBAlbum(alb);
        saveLocalAlbum(alb);
      }
      return albums;
    }
  } catch (err) {
    console.warn('Supabase fetchAllAlbums failed, using offline local storage', err);
  }

  const idbList = await getAllIndexedDBAlbums();
  if (idbList.length > 0) return idbList;

  return getLocalAlbums();
}

// Fetch single album by ID directly from Supabase 'monthly_reports'
export async function fetchAlbumById(id: string): Promise<Album | null> {
  try {
    const numericId = toBigIntId(id);
    const { data, error } = await supabase
      .from('monthly_reports')
      .select('*')
      .eq('id', numericId)
      .maybeSingle();

    if (!error && data) {
      const album = mapRowToAlbum(data);
      await saveIndexedDBAlbum(album);
      saveLocalAlbum(album);
      return album;
    }
  } catch (err) {
    console.warn('Supabase fetchAlbumById failed, checking local cache', err);
  }

  const idbAlbum = await getIndexedDBAlbum(id);
  if (idbAlbum && idbAlbum.photos && idbAlbum.photos.length > 0) {
    return idbAlbum;
  }

  const local = getLocalAlbums();
  return local.find((a) => a.id === id) || null;
}

// Save album & upload photos directly to Supabase client-side
export async function saveAlbumToApi(album: Album): Promise<Album> {
  // 1. Upload base64 photos to Supabase Storage Bucket 'reports'
  const processedPhotos: Photo[] = await Promise.all(
    album.photos.map(async (photo) => {
      if (photo.url && photo.url.startsWith('data:')) {
        const publicUrl = await uploadDataUrlToSupabase(photo.url, album.id, photo.id);
        return { ...photo, url: publicUrl };
      }
      return photo;
    })
  );

  const coverUrl = album.coverPhotoUrl && album.coverPhotoUrl.startsWith('data:')
    ? processedPhotos[0]?.url || album.coverPhotoUrl
    : album.coverPhotoUrl || processedPhotos[0]?.url || '';

  const updatedAlbum: Album = {
    ...album,
    photos: processedPhotos,
    coverPhotoUrl: coverUrl,
    updatedAt: new Date().toISOString(),
  };

  // 2. Cache in IndexedDB & LocalStorage
  await saveIndexedDBAlbum(updatedAlbum);
  saveLocalAlbum(updatedAlbum);

  // 3. Upsert directly into Supabase 'monthly_reports' table
  try {
    const numericId = toBigIntId(updatedAlbum.id);
    const row = {
      id: numericId,
      title: updatedAlbum.title,
      description: updatedAlbum.description || '',
      photographer: updatedAlbum.photographer || '',
      event_date: updatedAlbum.eventDate || '',
      theme_color: updatedAlbum.themeColor || '#f59e0b',
      photos: updatedAlbum.photos,
      cover_photo_url: updatedAlbum.coverPhotoUrl || '',
      created_at: updatedAlbum.createdAt,
      updated_at: updatedAlbum.updatedAt,
      views_count: updatedAlbum.viewsCount || 0,
    };

    const { error } = await supabase
      .from('monthly_reports')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase monthly_reports upsert error:', error.message);
    }
  } catch (err) {
    console.warn('Supabase save album error:', err);
  }

  return updatedAlbum;
}

// Delete album directly from Supabase
export async function deleteAlbumFromApi(id: string): Promise<void> {
  deleteLocalAlbum(id);
  await deleteIndexedDBAlbum(id);

  try {
    const numericId = toBigIntId(id);
    const { error } = await supabase
      .from('monthly_reports')
      .delete()
      .eq('id', numericId);

    if (error) {
      console.warn('Supabase delete album error:', error.message);
    }
  } catch (err) {
    console.warn('Failed to delete album from Supabase:', err);
  }
}

// Increment album view count directly in Supabase
export async function incrementAlbumView(id: string): Promise<void> {
  try {
    const album = await fetchAlbumById(id);
    if (album) {
      const newCount = (album.viewsCount || 0) + 1;
      album.viewsCount = newCount;
      await saveIndexedDBAlbum(album);
      saveLocalAlbum(album);

      const numericId = toBigIntId(id);
      await supabase
        .from('monthly_reports')
        .update({ views_count: newCount })
        .eq('id', numericId);
    }
  } catch (e) {
    // ignore
  }
}