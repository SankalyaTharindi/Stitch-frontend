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

  // Bill upload properties
  showBillUploadModal: boolean = false;
  selectedBillFile: File | null = null;
  uploadingBill: boolean = false;
  billErrorMessage: string = '';
  currentBillAppointment: Appointment | null = null;

  // Measurements upload properties
  showMeasurementsUploadModal: boolean = false;
  selectedMeasurementsFile: File | null = null;
  uploadingMeasurements: boolean = false;
  measurementsErrorMessage: string = '';
  currentMeasurementsAppointment: Appointment | null = null;

  adminNavItems: NavItem[] = [
    { label: 'Dashboard', route: '/admin/dashboard', icon: 'dashboard' },
    { label: 'Appointments', route: '/admin/appointments', icon: 'event' },
    { label: 'Customers', route: '/admin/customers', icon: 'people' },
    { label: 'Calendar', route: '/admin/calendar', icon: 'calendar_today' },
    { label: 'Gallery', route: '/admin/gallery', icon: 'collections' },
    { label: 'Profile', route: '/admin/profile', icon: 'person' }
  ];

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading = true;
    this.appointmentService.getAllAppointments().subscribe({
      next: (data) => {
        // Sort by ID in descending order (most recently booked first)
        this.appointments = data.sort((a, b) => (b.id || 0) - (a.id || 0));
        console.log('Loaded appointments:', this.appointments);
        const completedApts = this.appointments.filter(a => a.status === 'COMPLETED');
        console.log('Completed appointments:', completedApts);
        this.appointments.forEach(apt => {
          if (apt.status === 'COMPLETED') {
            console.log(`COMPLETED Appointment ${apt.id}: billFileName="${apt.billFileName}"`);
          }
        });
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
      
      // Validate file type (PDF, images)
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        this.billErrorMessage = 'Please select a PDF or image file';
        return;
      }
      
      // Validate file size (10MB)
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
        console.log('Bill uploaded successfully');
        // Update the appointment in the list
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
        // Clean up after a delay to allow the window to open
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
  openMeasurementsUploadModal(appointment: Appointment): void {
    this.currentMeasurementsAppointment = appointment;
    this.showMeasurementsUploadModal = true;
    this.selectedMeasurementsFile = null;
    this.measurementsErrorMessage = '';
  }

  closeMeasurementsUploadModal(): void {
    this.showMeasurementsUploadModal = false;
    this.currentMeasurementsAppointment = null;
    this.selectedMeasurementsFile = null;
    this.measurementsErrorMessage = '';
  }

  onMeasurementsFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file type (PDF, images)
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        this.measurementsErrorMessage = 'Please select a PDF or image file';
        return;
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.measurementsErrorMessage = 'File size must be less than 10MB';
        return;
      }
      
      this.selectedMeasurementsFile = file;
      this.measurementsErrorMessage = '';
    }
  }

  uploadMeasurements(): void {
    if (!this.selectedMeasurementsFile || !this.currentMeasurementsAppointment?.id) {
      this.measurementsErrorMessage = 'Please select a file';
      return;
    }

    this.uploadingMeasurements = true;
    this.measurementsErrorMessage = '';

    this.appointmentService.uploadMeasurements(this.currentMeasurementsAppointment.id, this.selectedMeasurementsFile).subscribe({
      next: (updatedAppointment) => {
        console.log('Measurements uploaded successfully');
        // Update the appointment in the list
        const index = this.appointments.findIndex(a => a.id === updatedAppointment.id);
        if (index !== -1) {
          this.appointments[index] = updatedAppointment;
        }
        this.uploadingMeasurements = false;
        this.closeMeasurementsUploadModal();
      },
      error: (error) => {
        console.error('Error uploading measurements:', error);
        this.measurementsErrorMessage = 'Failed to upload measurements. Please try again.';
        this.uploadingMeasurements = false;
      }
    });
  }

  viewMeasurements(appointment: Appointment): void {
    if (!appointment.id) return;
    
    this.appointmentService.getMeasurementsBlob(appointment.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Clean up after a delay to allow the window to open
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
