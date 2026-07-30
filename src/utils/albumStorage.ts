import { Album, Photo } from '../types';

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

// Read File as raw high quality Data URL preserving 100% original Full HD / 4K resolution
export function readFileAsDataURL(file: File): Promise<{ url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return reject(new Error('فشل قراءة الملف'));

      const img = new Image();
      img.onload = () => {
        resolve({
          url: result, // Preserve 100% original file quality without any canvas compression
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

// Local Storage Fallback & Synced API Calls
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
    console.warn('LocalStorage save warning (may exceed size):', e);
  }
}

// API Calls to Express server
export async function fetchAllAlbums(): Promise<Album[]> {
  try {
    const res = await fetch('/api/albums');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.albums)) {
        return data.albums;
      }
    }
  } catch (err) {
    console.warn('API fetch failed, falling back to local storage', err);
  }

  const idbList = await getAllIndexedDBAlbums();
  if (idbList.length > 0) return idbList;

  return getLocalAlbums();
}

export async function fetchAlbumById(id: string): Promise<Album | null> {
  // 1. Check Public Read-Only API first
  try {
    const res = await fetch(`/api/albums/${id}/public`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.album) {
        await saveIndexedDBAlbum(data.album);
        saveLocalAlbum(data.album);
        return data.album;
      }
    }
  } catch (err) {
    console.warn('Public API fetch failed, trying standard endpoint', err);
  }

  // 2. Check Standard API
  try {
    const res = await fetch(`/api/albums/${id}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.album) {
        await saveIndexedDBAlbum(data.album);
        saveLocalAlbum(data.album);
        return data.album;
      }
    }
  } catch (err) {
    console.warn('API fetch by ID failed', err);
  }

  // 3. Fallback to IndexedDB (preserves photos offline/across tabs)
  const idbAlbum = await getIndexedDBAlbum(id);
  if (idbAlbum && idbAlbum.photos && idbAlbum.photos.length > 0) {
    return idbAlbum;
  }

  // 4. Fallback to LocalStorage
  const local = getLocalAlbums();
  return local.find((a) => a.id === id) || null;
}

export async function saveAlbumToApi(album: Album): Promise<Album> {
  // Save locally first to IndexedDB and LocalStorage
  await saveIndexedDBAlbum(album);
  saveLocalAlbum(album);

  try {
    const res = await fetch('/api/albums', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(album),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.album) {
        await saveIndexedDBAlbum(data.album);
        saveLocalAlbum(data.album);
        return data.album;
      }
    }
  } catch (err) {
    console.warn('API save failed, using local album instance', err);
  }
  return album;
}

export async function incrementAlbumView(id: string) {
  try {
    await fetch(`/api/albums/${id}/view`, { method: 'PUT' });
  } catch (e) {
    // ignore silent view errors
  }
}
