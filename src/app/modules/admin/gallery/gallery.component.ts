import { Component, OnInit, OnDestroy } from '@angular/core';
import { GalleryService, GalleryImage } from '../../../services/gallery.service';
import { MessageService } from '../../../services/message.service';
import { NavItem } from '../../../shared/components/sidebar/sidebar.component';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class AdminGalleryComponent implements OnInit, OnDestroy {
  images: GalleryImage[] = [];
  loading: boolean = true;
  uploading: boolean = false;
  
  // Image blob URLs
  imageUrls: Map<string, string> = new Map();
  
  // Auto-refresh
  private refreshSubscription?: Subscription;
  private messageRefreshSubscription?: Subscription;
  private readonly REFRESH_INTERVAL = 30000; // 30 seconds
  
  // Upload form
  showUploadModal: boolean = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  uploadTitle: string = '';
  uploadDescription: string = '';
  errorMessage: string = '';

  // Edit form
  showEditModal: boolean = false;
  editingImage: GalleryImage | null = null;
  editTitle: string = '';
  editDescription: string = '';
  updating: boolean = false;

  adminNavItems: NavItem[] = [
    { label: 'Dashboard', route: '/admin/dashboard', icon: 'dashboard' },
    { label: 'Appointments', route: '/admin/appointments', icon: 'event' },
    { label: 'Customers', route: '/admin/customers', icon: 'people' },
    { label: 'Calendar', route: '/admin/calendar', icon: 'calendar_today' },
    { label: 'Gallery', route: '/admin/gallery', icon: 'collections' },
    { label: 'Messages', route: '/admin/messages', icon: 'message' },
    { label: 'Profile', route: '/admin/profile', icon: 'person' }
  ];

  constructor(
    private galleryService: GalleryService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadImages();
    this.loadUnreadMessageCount();
    
    // Subscribe to new messages for real-time updates
    this.messageService.getNewMessages().subscribe(() => {
      this.loadUnreadMessageCount();
    });
    
    // Auto-refresh gallery every 30 seconds
    this.refreshSubscription = interval(this.REFRESH_INTERVAL).subscribe(() => {
      this.loadImages();
    });
    
    // Auto-refresh message count every 30 seconds as backup
    this.messageRefreshSubscription = interval(30000).subscribe(() => {
      this.loadUnreadMessageCount();
    });
  }

  loadUnreadMessageCount(): void {
    this.messageService.getCustomersWithMessages().subscribe({
      next: (customers) => {
        const totalUnread = customers.reduce((sum, customer) => sum + (customer.unreadCount || 0), 0);
        const messagesNavItem = this.adminNavItems.find(item => item.route === '/admin/messages');
        if (messagesNavItem) {
          messagesNavItem.badge = totalUnread > 0 ? totalUnread : undefined;
        }
      }
    });
  }

  loadImages(): void {
    this.loading = true;
    this.galleryService.getAllImages().subscribe({
      next: (data) => {
        console.log('Admin gallery loaded images:', data);
        this.images = data;
        // Load image blobs with authentication
        this.images.forEach(image => {
          console.log('Image:', image.title, 'Like count:', image.likeCount);
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

  openUploadModal(): void {
    this.showUploadModal = true;
    this.resetUploadForm();
  }

  closeUploadModal(): void {
    this.showUploadModal = false;
    this.resetUploadForm();
  }

  resetUploadForm(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.uploadTitle = '';
    this.uploadDescription = '';
    this.errorMessage = '';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Please select a valid image file';
        return;
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.errorMessage = 'File size must be less than 10MB';
        return;
      }
      
      this.selectedFile = file;
      this.errorMessage = '';
      
      // Generate preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  uploadImage(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select an image to upload';
      return;
    }

    this.uploading = true;
    this.errorMessage = '';

    this.galleryService.uploadImage(
      this.selectedFile,
      this.uploadTitle.trim() || undefined,
      this.uploadDescription.trim() || undefined
    ).subscribe({
      next: (image) => {
        console.log('Image uploaded successfully:', image);
        this.uploading = false;
        this.closeUploadModal();
        this.loadImages();
      },
      error: (error) => {
        console.error('Error uploading image:', error);
        this.errorMessage = 'Failed to upload image. Please try again.';
        this.uploading = false;
      }
    });
  }

  openEditModal(image: GalleryImage): void {
    this.editingImage = image;
    this.editTitle = image.title || '';
    this.editDescription = image.description || '';
    this.showEditModal = true;
    this.errorMessage = '';
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingImage = null;
    this.editTitle = '';
    this.editDescription = '';
    this.errorMessage = '';
  }

  updateImage(): void {
    if (!this.editingImage || !this.editingImage.id) {
      this.errorMessage = 'Invalid image';
      return;
    }

    this.updating = true;
    this.errorMessage = '';

    this.galleryService.updateImage(
      this.editingImage.id,
      this.editTitle.trim() || undefined,
      this.editDescription.trim() || undefined
    ).subscribe({
      next: (updatedImage) => {
        console.log('Image updated successfully:', updatedImage);
        this.updating = false;
        this.closeEditModal();
        this.loadImages();
      },
      error: (error) => {
        console.error('Error updating image:', error);
        const errorMsg = error.error?.message || error.message || 'Unknown error';
        this.errorMessage = `Failed to update image: ${errorMsg}`;
        this.updating = false;
      }
    });
  }

  deleteImage(id: number | undefined): void {
    if (!id) return;
    
    if (confirm('Are you sure you want to delete this image?')) {
      this.galleryService.deleteImage(id).subscribe({
        next: () => {
          this.loadImages();
        },
        error: (error) => {
          console.error('Error deleting image:', error);
          alert('Failed to delete image');
        }
      });
    }
  }

  getImageUrl(fileName: string): string {
    return this.imageUrls.get(fileName) || '';
  }

  ngOnDestroy(): void {
    // Clean up blob URLs to prevent memory leaks
    this.imageUrls.forEach(url => URL.revokeObjectURL(url));
    this.imageUrls.clear();
    // Clean up auto-refresh subscription
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    if (this.messageRefreshSubscription) {
      this.messageRefreshSubscription.unsubscribe();
    }
  }
}
