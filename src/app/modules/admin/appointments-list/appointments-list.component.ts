import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Appointment, AppointmentService } from '../../../services/appointment.service';

@Component({
  selector: 'app-appointments-list',
  templateUrl: './appointments-list.component.html',
  styleUrls: ['./appointments-list.component.scss']
})
export class AppointmentsListComponent {
  constructor(private appointmentService: AppointmentService) {}
  @Input() appointments: Appointment[] = [];
  @Input() selectedStatus: string = 'ALL';
  @Input() loading: boolean = false;
  @Output() statusChange = new EventEmitter<string>();
  @Output() approve = new EventEmitter<number>();
  @Output() decline = new EventEmitter<number>();
  @Output() updateStatus = new EventEmitter<{id: number, status: string}>;

  showImageModal = false;
  modalImageUrl = '';
  imageCache = new Map<number, {[index: number]: string}>();
  currentImageIndex = 0;
  totalImages = 0;
  currentAppointmentId: number | null = null;

  get activeAppointments(): Appointment[] {
    return this.appointments
      .filter(apt => apt.status !== 'COMPLETED')
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }

  get completedAppointments(): Appointment[] {
    return this.appointments
      .filter(apt => apt.status === 'COMPLETED')
      .sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());
  }

  statusOptions = [
    { label: 'All Appointments', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' }
  ];

  onStatusChange(): void {
    this.statusChange.emit(this.selectedStatus);
  }

  onApprove(id: number): void {
    this.approve.emit(id);
  }

  onDecline(id: number): void {
    this.decline.emit(id);
  }

  markInProgress(id: number): void {
    this.updateStatus.emit({id, status: 'IN_PROGRESS'});
  }

  markCompleted(id: number): void {
    if (confirm('Mark this appointment as completed?')) {
      this.updateStatus.emit({id, status: 'COMPLETED'});
    }
  }

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
    // Check cache first
    if (this.imageCache.has(appointmentId) && this.imageCache.get(appointmentId)?.[index]) {
      this.modalImageUrl = this.imageCache.get(appointmentId)![index];
      this.showImageModal = true;
      return;
    }

    // Fetch image as blob with authentication
    this.appointmentService.getImageBlob(appointmentId, true, index).subscribe({
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
}
