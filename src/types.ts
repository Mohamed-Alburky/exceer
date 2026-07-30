export interface Photo {
  id: string;
  url: string; // Base64 or object URL or server URL
  name: string;
  size: number; // bytes
  width: number;
  height: number;
  mimeType: string;
  caption?: string;
  createdAt: string;
  qualityTag: '4K Ultra HD' | 'Full HD 1080p' | 'HD 720p' | 'قياسية';
}

export interface Album {
  id: string;
  title: string;
  description?: string;
  category?: string;
  photographer?: string;
  eventDate?: string;
  coverPhotoUrl?: string;
  createdAt: string;
  updatedAt: string;
  photos: Photo[];
  photos_count?: number;
  themeColor?: string;
  viewsCount?: number;
}

export interface QRDesignConfig {
  fgColor: string;
  bgColor: string;
  margin: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  includeTitleInPrint: boolean;
  printFormat: 'A4' | 'Card' | 'Badge';
}

export type ViewMode = 'home' | 'create-details' | 'upload' | 'qr-ready' | 'read-only-viewer';
