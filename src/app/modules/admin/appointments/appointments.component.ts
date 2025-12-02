import { Component, OnInit } from '@angular/core';
import { AppointmentService, Appointment } from '../../../services/appointment.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-appointments',
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss']
})
export class AppointmentsComponent implements OnInit {
  appointments: Appointment[] = [];
  loading: boolean = true;

  // Image modal properties
  showImageModal: boolean = false;
  modalImageUrl: string = '';
  currentImageIndex: number = 0;
  totalImages: number = 0;
  currentAppointmentId: number | null = null;
  imageCache: Map<number, { [index: number]: string }> = new Map();

  adminNavItems: NavItem[] = [
    { label: 'Dashboard', route: '/admin/dashboard', icon: 'dashboard' },
    { label: 'Appointments', route: '/admin/appointments', icon: 'event' },
    { label: 'Customers', route: '/admin/customers', icon: 'people' },
    { label: 'Calendar', route: '/admin/calendar', icon: 'calendar_today' },
    { label: 'Gallery', route: '/admin/gallery', icon: 'collections' }
  ];

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading = true;
    this.appointmentService.getAllAppointments().subscribe({
      next: (data) => {
        this.appointments = data.sort((a, b) => 
          new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        );
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.loading = false;
      }
    });
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'PENDING': '#ffc107',
      'APPROVED': '#28a745',
      'IN_PROGRESS': '#17a2b8',
      'COMPLETED': '#6c757d',
      'DECLINED': '#dc3545'
    };
    return colors[status] || '#6c757d';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'PENDING': 'Pending',
      'APPROVED': 'Approved',
      'IN_PROGRESS': 'In Progress',
      'COMPLETED': 'Completed',
      'DECLINED': 'Declined'
    };
    return labels[status] || status;
  }

  hasImages(appointment: Appointment): boolean {
    return !!appointment.inspoImageUrl && appointment.inspoImageUrl.trim() !== '';
  }

  getImageCount(inspoImageUrl: string): number {
    if (!inspoImageUrl || inspoImageUrl.trim() === '') {
      return 0;
    }
    return inspoImageUrl.split(',').filter(img => img.trim() !== '').length;
  }

  viewImage(appointment: Appointment): void {
    if (!this.hasImages(appointment) || !appointment.id) return;

    this.currentAppointmentId = appointment.id;
    this.totalImages = this.getImageCount(appointment.inspoImageUrl || '');
    this.currentImageIndex = 0;
    
    this.loadImage(appointment.id, 0);
  }

  loadImage(appointmentId: number, index: number): void {
    // Check cache first
    const cachedImages = this.imageCache.get(appointmentId);
    if (cachedImages && cachedImages[index]) {
      this.modalImageUrl = cachedImages[index];
      this.showImageModal = true;
      return;
    }

    // Load from service
    this.appointmentService.getImageBlob(appointmentId, true, index).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        
        // Cache the image
        if (!this.imageCache.has(appointmentId)) {
          this.imageCache.set(appointmentId, {});
        }
        this.imageCache.get(appointmentId)![index] = url;
        
        this.modalImageUrl = url;
        this.showImageModal = true;
      },
      error: (error) => {
        console.error('Error loading image:', error);
      }
    });
  }

  nextImage(): void {
    if (this.currentImageIndex < this.totalImages - 1 && this.currentAppointmentId) {
      this.currentImageIndex++;
      this.loadImage(this.currentAppointmentId, this.currentImageIndex);
    }
  }

  previousImage(): void {
    if (this.currentImageIndex > 0 && this.currentAppointmentId) {
      this.currentImageIndex--;
      this.loadImage(this.currentAppointmentId, this.currentImageIndex);
    }
  }

  closeImageModal(): void {
    this.showImageModal = false;
    this.modalImageUrl = '';
  }
}
