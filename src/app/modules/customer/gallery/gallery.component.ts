import { Component, OnInit, OnDestroy } from '@angular/core';
import { GalleryService, GalleryImage } from '../../../services/gallery.service';
import { AuthService } from '../../../services/auth.service';
import { interval, Subscription } from 'rxjs';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-customer-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class CustomerGalleryComponent implements OnInit, OnDestroy {
  images: GalleryImage[] = [];
  loading: boolean = true;
  isAuthenticated: boolean = false;
  
  // Image viewer
  showImageModal: boolean = false;
  selectedImage: GalleryImage | null = null;
  
  // Image blob URLs
  imageUrls: Map<string, string> = new Map();
  
  // Auto-refresh
  private refreshSubscription?: Subscription;
  private readonly REFRESH_INTERVAL = 30000; // 30 seconds

  customerNavItems: NavItem[] = [
    { label: 'Dashboard', route: '/customer/dashboard', icon: 'dashboard' },
    { label: 'Book Appointment', route: '/customer/book-appointment', icon: 'event_available' },
    { label: 'Gallery', route: '/customer/gallery', icon: 'collections' },
    { label: 'Profile', route: '/customer/profile', icon: 'person' }
  ];

  constructor(
    private galleryService: GalleryService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = !!this.authService.getToken();
    this.loadImages();
    // Auto-refresh every 30 seconds
    this.refreshSubscription = interval(this.REFRESH_INTERVAL).subscribe(() => {
      this.loadImages();
    });
  }

  loadImages(): void {
    this.loading = true;
    this.galleryService.getAllImages().subscribe({
      next: (data) => {
        this.images = data;
        console.log('Loaded gallery images:', data);
        // Load image blobs with authentication
        this.images.forEach(image => {
          this.loadImageBlob(image.fileName);
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading gallery images:', error);
        this.loading = false;
      }
    });
  }

  loadImageBlob(fileName: string): void {
    this.galleryService.getImageBlob(fileName).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.imageUrls.set(fileName, url);
      },
      error: (error) => {
        console.error('Error loading image blob:', fileName, error);
      }
    });
  }

  toggleLike(image: GalleryImage): void {
    if (!this.isAuthenticated || !image.id) {
      return;
    }

    this.galleryService.toggleLike(image.id).subscribe({
      next: (likeCount) => {
        // Update the image's like count and liked status
        image.likeCount = likeCount;
        image.likedByCurrentUser = !image.likedByCurrentUser;
        
        // Update the selectedImage if it's the same image
        if (this.selectedImage && this.selectedImage.id === image.id) {
          this.selectedImage.likeCount = likeCount;
          this.selectedImage.likedByCurrentUser = image.likedByCurrentUser;
        }
        
        // Update the image in the images array
        const index = this.images.findIndex(img => img.id === image.id);
        if (index !== -1) {
          this.images[index].likeCount = likeCount;
          this.images[index].likedByCurrentUser = image.likedByCurrentUser;
        }
      },
      error: (error) => {
        console.error('Error toggling like:', error);
      }
    });
  }

  openImageModal(image: GalleryImage): void {
    this.selectedImage = image;
    this.showImageModal = true;
  }

  closeImageModal(): void {
    this.showImageModal = false;
    this.selectedImage = null;
  }

  getImageUrl(fileName: string): string {
    return this.imageUrls.get(fileName) || '';
  }

  onImageError(event: any, image: GalleryImage): void {
    console.error('Failed to load image:', image.fileName, 'URL:', this.getImageUrl(image.fileName));
  }

  ngOnDestroy(): void {
    // Clean up blob URLs to prevent memory leaks
    this.imageUrls.forEach(url => URL.revokeObjectURL(url));
    this.imageUrls.clear();
    // Clean up auto-refresh subscription
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }
}
