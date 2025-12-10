import { Component, OnInit } from '@angular/core';
import { AppointmentService, Appointment } from '../../../services/appointment.service';
import { NavItem } from '../../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  loading = true;
  selectedStatus = 'ALL';
  showImageModal = false;
  modalImageUrl = '';
  imageCache = new Map<number, {[index: number]: string}>();
  currentImageIndex = 0;
  totalImages = 0;
  currentAppointmentId: number | null = null;

  // Bill upload properties
  showBillUploadModal: boolean = false;
  selectedBillFile: File | null = null;
  uploadingBill: boolean = false;
  billErrorMessage: string = '';
  currentBillAppointment: Appointment | null = null;

  adminNavItems: NavItem[] = [
    { label: 'Dashboard', route: '/admin/dashboard', icon: 'dashboard' },
    { label: 'Appointments', route: '/admin/appointments', icon: 'event' },
    { label: 'Customers', route: '/admin/customers', icon: 'people' },
    { label: 'Calendar', route: '/admin/calendar', icon: 'calendar_today' },
    { label: 'Gallery', route: '/admin/gallery', icon: 'collections' },
    { label: 'Messages', route: '/admin/messages', icon: 'message' },
    { label: 'Profile', route: '/admin/profile', icon: 'person' }
  ];

  statusOptions = [
    { value: 'ALL', label: 'All Appointments' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' }
  ];

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading = true;
    this.appointmentService.getAllAppointments().subscribe({
      next: (data: Appointment[]) => {
        this.appointments = data;
        this.filterAppointments();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading appointments:', error);
        this.loading = false;
      }
    });
  }

  filterAppointments(): void {
    if (this.selectedStatus === 'ALL') {
      this.filteredAppointments = this.appointments;
    } else {
      this.filteredAppointments = this.appointments.filter(
        apt => apt.status === this.selectedStatus
      );
    }
  }

  onStatusChange(status: string): void {
    this.selectedStatus = status;
    this.filterAppointments();
  }

  approveAppointment(id: number): void {
    this.appointmentService.approveAppointment(id).subscribe({
      next: () => {
        this.loadAppointments();
        // Trigger notification
      },
      error: (error: any) => console.error('Error approving appointment:', error)
    });
  }

  declineAppointment(id: number): void {
    const reason = prompt('Please provide a reason for declining:');
    if (reason) {
      this.appointmentService.declineAppointment(id, reason).subscribe({
        next: () => {
          this.loadAppointments();
          // Trigger notification
        },
        error: (error: any) => console.error('Error declining appointment:', error)
      });
    }
  }

  updateAppointmentStatus(event: {id: number, status: string}): void {
    this.appointmentService.updateAppointmentStatus(event.id, event.status).subscribe({
      next: () => {
        this.loadAppointments();
      },
      error: (error: any) => console.error('Error updating appointment status:', error)
    });
  }

  getPendingCount(): number {
    return this.appointments.filter(apt => apt.status === 'PENDING').length;
  }

  getApprovedCount(): number {
    return this.appointments.filter(apt => apt.status === 'APPROVED').length;
  }

  getCompletedCount(): number {
    return this.appointments.filter(apt => apt.status === 'COMPLETED').length;
  }

  getUpcomingDeadlines(): Appointment[] {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return this.appointments
      .filter(apt => {
        const deadline = new Date(apt.deadline);
        return deadline >= today && deadline <= nextWeek && apt.status !== 'COMPLETED';
      })
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 5);
  }

  getCompletedAppointments(): Appointment[] {
    return this.appointments
      .filter(apt => apt.status === 'COMPLETED')
      .sort((a, b) => (b.id || 0) - (a.id || 0));
  }

  getDeclinedAppointments(): Appointment[] {
    return this.appointments
      .filter(apt => apt.status === 'DECLINED')
      .sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());
  }

  viewImage(appointment: Appointment): void {
    if (!appointment.id || !appointment.inspoImageUrl) return;
    
    this.currentAppointmentId = appointment.id;
    this.currentImageIndex = 0;
    this.totalImages = this.appointmentService.getImageCount(appointment.inspoImageUrl);
    
    this.loadImage(appointment.id, 0);
  }

  loadImage(appointmentId: number, index: number): void {
    if (this.imageCache.has(appointmentId) && this.imageCache.get(appointmentId)?.[index]) {
      this.modalImageUrl = this.imageCache.get(appointmentId)![index];
      this.showImageModal = true;
      return;
    }

    this.appointmentService.getImageBlob(appointmentId, true, index).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        
        if (!this.imageCache.has(appointmentId)) {
          this.imageCache.set(appointmentId, {});
        }
        this.imageCache.get(appointmentId)![index] = objectUrl;
        
        this.modalImageUrl = objectUrl;
        this.showImageModal = true;
      },
      error: (err) => {
        console.error('Error loading image:', err);
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

  // Bill management methods
  openBillUploadModal(appointment: Appointment): void {
    this.currentBillAppointment = appointment;
    this.showBillUploadModal = true;
    this.selectedBillFile = null;
    this.billErrorMessage = '';
  }

  closeBillUploadModal(): void {
    this.showBillUploadModal = false;
    this.currentBillAppointment = null;
    this.selectedBillFile = null;
    this.billErrorMessage = '';
  }

  onBillFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        this.billErrorMessage = 'Please select a PDF or image file';
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        this.billErrorMessage = 'File size must be less than 10MB';
        return;
      }
      
      this.selectedBillFile = file;
      this.billErrorMessage = '';
    }
  }

  uploadBill(): void {
    if (!this.selectedBillFile || !this.currentBillAppointment?.id) {
      this.billErrorMessage = 'Please select a file';
      return;
    }

    this.uploadingBill = true;
    this.billErrorMessage = '';

    this.appointmentService.uploadBill(this.currentBillAppointment.id, this.selectedBillFile).subscribe({
      next: (updatedAppointment) => {
        const index = this.appointments.findIndex(a => a.id === updatedAppointment.id);
        if (index !== -1) {
          this.appointments[index] = updatedAppointment;
        }
        this.uploadingBill = false;
        this.closeBillUploadModal();
      },
      error: (error) => {
        console.error('Error uploading bill:', error);
        this.billErrorMessage = 'Failed to upload bill. Please try again.';
        this.uploadingBill = false;
      }
    });
  }

  viewBill(appointment: Appointment): void {
    if (!appointment.id) return;
    
    this.appointmentService.getBillBlob(appointment.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      },
      error: (error) => {
        console.error('Error viewing bill:', error);
      }
    });
  }

  deleteBill(appointment: Appointment): void {
    if (!appointment.id) return;
    
    if (confirm('Are you sure you want to delete this bill?')) {
      this.appointmentService.deleteBill(appointment.id).subscribe({
        next: (updatedAppointment) => {
          const index = this.appointments.findIndex(a => a.id === updatedAppointment.id);
          if (index !== -1) {
            this.appointments[index] = updatedAppointment;
          }
        },
        error: (error) => {
          console.error('Error deleting bill:', error);
          alert('Failed to delete bill');
        }
      });
    }
  }

  // Measurements management methods
  viewMeasurements(appointment: Appointment): void {
    if (!appointment.id) return;
    
    this.appointmentService.getMeasurementsBlob(appointment.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      },
      error: (error) => {
        console.error('Error viewing measurements:', error);
      }
    });
  }

  deleteMeasurements(appointment: Appointment): void {
    if (!appointment.id) return;
    
    if (confirm('Are you sure you want to delete this measurements file?')) {
      this.appointmentService.deleteMeasurements(appointment.id).subscribe({
        next: (updatedAppointment) => {
          const index = this.appointments.findIndex(a => a.id === updatedAppointment.id);
          if (index !== -1) {
            this.appointments[index] = updatedAppointment;
          }
        },
        error: (error) => {
          console.error('Error deleting measurements:', error);
          alert('Failed to delete measurements');
        }
      });
    }
  }
}