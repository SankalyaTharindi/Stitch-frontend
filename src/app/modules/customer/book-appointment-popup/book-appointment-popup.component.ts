import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppointmentService, Appointment } from '../../../services/appointment.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-book-appointment-popup',
  templateUrl: './book-appointment-popup.component.html',
  styleUrls: ['./book-appointment-popup.component.scss']
})
export class BookAppointmentPopupComponent implements OnInit {
  @Input() editMode = false;
  @Input() appointmentData: Appointment | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  formData = {
    customerName: '',
    age: 0,
    phoneNumber: '',
    deadline: '',
    notes: '',
    inspoImageUrl: ''
  };

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  loading = false;
  errorMessage = '';

  constructor(
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.editMode && this.appointmentData) {
      this.formData = {
        customerName: this.appointmentData.customerName,
        age: this.appointmentData.age,
        phoneNumber: this.appointmentData.phoneNumber,
        deadline: this.appointmentData.deadline,
        notes: this.appointmentData.notes || '',
        inspoImageUrl: this.appointmentData.inspoImageUrl || ''
      };
      if (this.appointmentData.inspoImageUrl) {
        this.previewUrl = this.appointmentData.inspoImageUrl;
      }
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  removeImage(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.formData.inspoImageUrl = '';
  }

  onSubmit(): void {
    this.errorMessage = '';
    
    // Check if user is logged in
    const token = this.authService.getToken();
    const currentUser = this.authService.currentUserValue;
    
    console.log('Token exists:', !!token);
    console.log('Current user:', currentUser);
    
    if (!token || !currentUser) {
      this.errorMessage = 'Please login to book an appointment.';
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 2000);
      return;
    }
    
    if (!this.formData.customerName || !this.formData.phoneNumber || !this.formData.deadline) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    this.loading = true;

    // For now, using the preview URL. In production, you'd upload to a server first
    if (this.previewUrl) {
      this.formData.inspoImageUrl = this.previewUrl;
    }

    // Create proper Appointment object with required status field
    const appointment: Appointment = {
      customerName: this.formData.customerName,
      age: this.formData.age || 0,
      phoneNumber: this.formData.phoneNumber,
      deadline: this.formData.deadline,
      notes: this.formData.notes || '',
      inspoImageUrl: this.formData.inspoImageUrl || '',
      status: 'PENDING'
    };

    console.log('Submitting appointment:', appointment);

    const apiCall = this.editMode && this.appointmentData?.id
      ? this.appointmentService.updateAppointment(this.appointmentData.id, appointment, this.selectedFile || undefined)
      : this.appointmentService.createAppointment(appointment, this.selectedFile || undefined);

    apiCall.subscribe({
      next: (response) => {
        console.log(this.editMode ? 'Appointment updated successfully:' : 'Appointment created successfully:', response);
        this.loading = false;
        this.success.emit();
        this.onClose();
      },
      error: (error: any) => {
        console.error(this.editMode ? 'Error updating appointment:' : 'Error creating appointment:', error);
        console.error('Error details:', error.error);
        console.error('Status:', error.status);
        
        if (error.status === 0) {
          this.errorMessage = 'Cannot connect to server. Please check if the backend is running.';
        } else if (error.status === 401 || error.status === 403) {
          this.errorMessage = 'Session expired. Please login again.';
          this.loading = false;
          setTimeout(() => {
            this.authService.logout();
          }, 2000);
          return;
        } else if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = this.editMode ? 'Failed to update appointment. Please try again.' : 'Failed to create appointment. Please try again.';
        }
        
        this.loading = false;
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
