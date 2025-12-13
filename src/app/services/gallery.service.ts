import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GalleryImage {
  id?: number;
  fileName: string;
  title?: string;
  description?: string;
  createdAt?: string;
  uploadedAt?: string;  // Keep for backward compatibility
  likeCount?: number;
  likedByCurrentUser?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GalleryService {
  private readonly API_URL = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // Admin: Upload gallery image
  uploadImage(file: File, title?: string, description?: string): Observable<GalleryImage> {
    const formData = new FormData();
    formData.append('file', file);
    if (title) {
      formData.append('title', title);
    }
    if (description) {
      formData.append('description', description);
    }
    return this.http.post<GalleryImage>(`${this.API_URL}/gallery`, formData);
  }

  // Public: Get all gallery images
  getAllImages(): Observable<GalleryImage[]> {
    // Add timestamp to prevent browser caching of like status
    const timestamp = new Date().getTime();
    return this.http.get<GalleryImage[]>(`${this.API_URL}/gallery?_t=${timestamp}`);
  }

  // Public: Get single gallery image details
  getImageById(id: number): Observable<GalleryImage> {
    return this.http.get<GalleryImage>(`${this.API_URL}/gallery/${id}`);
  }

  // Public: Get image file URL
  getImageUrl(fileName: string): string {
    return `${this.API_URL}/gallery/file/${fileName}`;
  }

  // Get image as blob with authentication
  getImageBlob(fileName: string): Observable<Blob> {
    return this.http.get(`${this.API_URL}/gallery/file/${fileName}`, {
      responseType: 'blob'
    });
  }

  // Customer: Toggle like
  toggleLike(id: number): Observable<number> {
    return this.http.post<number>(`${this.API_URL}/gallery/${id}/like`, {}, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Admin: Update gallery image details
  updateImage(id: number, title?: string, description?: string): Observable<GalleryImage> {
    const updateData: any = {};
    if (title !== undefined) {
      updateData.title = title;
    }
    if (description !== undefined) {
      updateData.description = description;
    }
    return this.http.put<GalleryImage>(`${this.API_URL}/gallery/${id}`, updateData, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Admin: Delete gallery image (if endpoint exists)
  deleteImage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/gallery/${id}`);
  }
}
