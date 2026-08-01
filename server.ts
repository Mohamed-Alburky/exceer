import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// High body size limit for preserving original Full HD / 4K photo quality
app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ limit: '150mb', extended: true }));

// Storage directory setup
const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const ALBUMS_FILE = path.join(DATA_DIR, 'albums.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded photos statically so all devices can fetch them directly
app.use('/uploads', express.static(UPLOADS_DIR));

// Helper to convert Base64 Data URLs into permanent server-side static files
function processBase64Photo(dataUrl: string, albumId: string, photoId: string): string {
  if (!dataUrl || typeof dataUrl !== 'string') return '';
  // If already hosted statically or external URL, return as is
  if (dataUrl.startsWith('/uploads/') || dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
    return dataUrl;
  }

  // Handle data URL (e.g., data:image/jpeg;base64,...)
  const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!matches) {
    return dataUrl;
  }

  try {
    let ext = matches[1].toLowerCase();
    if (ext === 'jpeg') ext = 'jpg';
    if (ext.includes('svg')) ext = 'svg';
    if (ext.includes('png')) ext = 'png';
    if (ext.includes('webp')) ext = 'webp';

    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Clean filename
    const safeAlbumId = albumId.replace(/[^a-zA-Z0-9_-]/g, '');
    const safePhotoId = photoId.replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `photo-${safeAlbumId}-${safePhotoId}-${Date.now()}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    fs.writeFileSync(filePath, buffer);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error('Failed to save base64 photo to disk:', err);
    return dataUrl;
  }
}

function loadAlbums(): Record<string, any> {
  try {
    if (fs.existsSync(ALBUMS_FILE)) {
      const content = fs.readFileSync(ALBUMS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Failed to read albums.json:', err);
  }
  return {};
}

function saveAlbums(albums: Record<string, any>) {
  try {
    fs.writeFileSync(ALBUMS_FILE, JSON.stringify(albums, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write albums.json:', err);
  }
}

// Memory cache
let albumsDatabase = loadAlbums();

// API Endpoints

// GET /api/albums - List all albums
app.get('/api/albums', (req, res) => {
  const list = Object.values(albumsDatabase).map((album: any) => ({
    id: album.id,
    title: album.title,
    description: album.description,
    photographer: album.photographer,
    eventDate: album.eventDate,
    coverPhotoUrl: album.coverPhotoUrl || (album.photos?.[0]?.url ?? ''),
    photosCount: album.photos?.length || 0,
    createdAt: album.createdAt,
    updatedAt: album.updatedAt,
    viewsCount: album.viewsCount || 0,
  }));
  res.json({ success: true, albums: list });
});

// GET /api/albums/:id/public - Public read-only endpoint (used for QR code & shared link visitors)
app.get('/api/albums/:id/public', (req, res) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).json({ success: false, message: 'معرّف الألبوم غير صالحة' });
  }
  const album = albumsDatabase[id];
  if (!album) {
    return res.status(404).json({ success: false, message: 'الألبوم غير موجود' });
  }

  // Increment view counter on public QR scan / view
  album.viewsCount = (album.viewsCount || 0) + 1;
  saveAlbums(albumsDatabase);

  // Return clean read-only payload
  res.json({
    success: true,
    isReadOnly: true,
    album: {
      id: album.id,
      title: album.title,
      description: album.description,
      photographer: album.photographer,
      eventDate: album.eventDate,
      themeColor: album.themeColor,
      photos: album.photos || [],
      coverPhotoUrl: album.coverPhotoUrl,
      createdAt: album.createdAt,
      viewsCount: album.viewsCount,
    },
  });
});

// GET /api/albums/:id - Get specific album for read-only view or edit
app.get('/api/albums/:id', (req, res) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).json({ success: false, message: 'معرّف الألبوم غير صالحة' });
  }
  const album = albumsDatabase[id];
  if (!album) {
    return res.status(404).json({ success: false, message: 'الألبوم غير موجود' });
  }
  res.json({ success: true, album });
});

// POST /api/albums - Save or create album
app.post('/api/albums', (req, res) => {
  const albumData = req.body;
  if (!albumData || typeof albumData !== 'object' || !albumData.title || typeof albumData.title !== 'string') {
    return res.status(400).json({ success: false, message: 'عنوان الألبوم مطلوب ويجب أن يكون نصاً' });
  }

  let id = albumData.id;
  if (id && (typeof id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(id))) {
    return res.status(400).json({ success: false, message: 'معرّف الألبوم غير صالحة' });
  }
  if (!id) {
    id = `elixir-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  }

  const now = new Date().toISOString();

  // Process photos to convert any Base64 strings to disk file URLs
  let processedPhotos: any[] = [];
  if (Array.isArray(albumData.photos)) {
    processedPhotos = albumData.photos.map((photo: any, index: number) => {
      if (!photo || typeof photo !== 'object') return photo;
      const photoId = photo.id || `photo-${index}-${Date.now()}`;
      const fileUrl = processBase64Photo(photo.url, id, photoId);
      return {
        ...photo,
        id: photoId,
        url: fileUrl,
      };
    });
  }

  // Cover photo URL
  let coverUrl = albumData.coverPhotoUrl || '';
  if (coverUrl && coverUrl.startsWith('data:image/')) {
    coverUrl = processBase64Photo(coverUrl, id, 'cover');
  } else if (!coverUrl && processedPhotos.length > 0) {
    coverUrl = processedPhotos[0].url;
  }

  const newAlbum = {
    ...albumData,
    id,
    title: String(albumData.title).trim().slice(0, 200),
    description: albumData.description ? String(albumData.description).trim().slice(0, 1000) : '',
    photographer: albumData.photographer ? String(albumData.photographer).trim().slice(0, 100) : '',
    photos: processedPhotos,
    coverPhotoUrl: coverUrl,
    createdAt: albumData.createdAt || now,
    updatedAt: now,
    viewsCount: typeof albumData.viewsCount === 'number' ? Math.max(0, albumData.viewsCount) : 0,
  };

  albumsDatabase[id] = newAlbum;
  saveAlbums(albumsDatabase);

  res.json({ success: true, album: newAlbum });
});

// PUT /api/albums/:id/view - Increment view count when QR code scanned
app.put('/api/albums/:id/view', (req, res) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).json({ success: false, message: 'معرّف الألبوم غير صالحة' });
  }
  if (albumsDatabase[id]) {
    albumsDatabase[id].viewsCount = (albumsDatabase[id].viewsCount || 0) + 1;
    saveAlbums(albumsDatabase);
    return res.json({ success: true, viewsCount: albumsDatabase[id].viewsCount });
  }
  res.status(404).json({ success: false, message: 'الألبوم غير موجود' });
});

// DELETE /api/albums/:id - Delete album
app.delete('/api/albums/:id', (req, res) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).json({ success: false, message: 'معرّف الألبوم غير صالحة' });
  }
  if (albumsDatabase[id]) {
    delete albumsDatabase[id];
    saveAlbums(albumsDatabase);
    return res.json({ success: true, message: 'تم حذف الألبوم بنجاح' });
  }
  res.status(404).json({ success: false, message: 'الألبوم غير موجود' });
});

// Start Express + Vite
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[الإكسير Server] Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
