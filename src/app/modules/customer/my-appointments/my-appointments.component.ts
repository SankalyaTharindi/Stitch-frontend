import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Appointment, AppointmentService } from '../../../services/appointment.service';

@Component({
  selector: 'app-my-appointments',
  templateUrl: './my-appointments.component.html',
  styleUrls: ['./my-appointments.component.scss']
})
export class MyAppointmentsComponent {
  constructor(private appointmentService: AppointmentService) {}
  @Input() appointments: Appointment[] = [];
  @Input() loading: boolean = false;
  @Output() cancel = new EventEmitter<number>();
  @Output() edit = new EventEmitter<Appointment>();

  showImageModal = false;
  modalImageUrl = '';
  imageCache = new Map<number, {[index: number]: string}>();

  get currentAppointments(): Appointment[] {
    return this.appointments.filter(apt => 
      apt.status === 'PENDING' || apt.status === 'APPROVED' || apt.status === 'IN_PROGRESS'
    );
  }

  get pastAppointments(): Appointment[] {
    return this.appointments.filter(apt => apt.status === 'COMPLETED' || apt.status === 'DECLINED');
  }

  onEdit(appointment: Appointment): void {
    this.edit.emit(appointment);
  }

  onCancel(id: number): void {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      this.cancel.emit(id);
    }
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
    return status.replace(/_/g, ' ');
  }

  currentImageIndex = 0;
  totalImages = 0;
  currentAppointmentId: number | null = null;

  viewImage(appointment: Appointment): void {
    if (!appointment.id || !appointment.inspoImageUrl) return;
    
    this.currentAppointmentId = appointment.id;
    this.currentImageIndex = 0;
    this.totalImages = this.appointmentService.getImageCount(appointment.inspoImageUrl);
    
    console.log('inspoImageUrl:', appointment.inspoImageUrl);
    console.log('Total images:', this.totalImages);
    
    // Load first image
    this.loadImage(appointment.id, 0);
  }

  loadImage(appointmentId: number, index: number): void {
    const cacheKey = `${appointmentId}-${index}`;
    
    // Check cache first
    if (this.imageCache.has(appointmentId) && this.imageCache.get(appointmentId)?.[index]) {
      this.modalImageUrl = this.imageCache.get(appointmentId)![index];
      this.showImageModal = true;
      return;
    }

    // Fetch image as blob with authentication (customer endpoint)
    this.appointmentService.getImageBlob(appointmentId, false, index).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        
        // Store in cache
        if (!this.imageCache.has(appointmentId)) {
          this.imageCache.set(appointmentId, {});
        }
        this.imageCache.get(appointmentId)![index] = objectUrl;
        
        this.modalImageUrl = objectUrl;
        this.showImageModal = true;
      },
      error: (err) => {
        console.error('Error loading image:', err);
        alert('Failed to load image');
      }
    });
  }

  nextImage(): void {
    if (this.currentAppointmentId && this.currentImageIndex < this.totalImages - 1) {
      this.currentImageIndex++;
      this.loadImage(this.currentAppointmentId, this.currentImageIndex);
    }
  }

  previousImage(): void {
    if (this.currentAppointmentId && this.currentImageIndex > 0) {
      this.currentImageIndex--;
      this.loadImage(this.currentAppointmentId, this.currentImageIndex);
    }
  }

  closeImageModal(): void {
    this.showImageModal = false;
    this.modalImageUrl = '';
  }

  downloadBill(appointment: Appointment): void {
    if (!appointment.id) return;
    
    this.appointmentService.getBillBlob(appointment.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bill_appointment_${appointment.id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading bill:', error);
        alert('Failed to download bill');
      }
    });
  }
}
