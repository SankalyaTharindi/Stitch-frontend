import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppointmentService, Appointment } from '../../../services/appointment.service';
import { AuthService } from '../../../services/auth.service';
import { NavItem } from '../../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-book-appointment',
  templateUrl: './book-appointment.component.html',
  styleUrls: ['./book-appointment.component.scss']
})
export class BookAppointmentComponent implements OnInit {
  customerNavItems: NavItem[] = [
    { label: 'Dashboard', route: '/customer/dashboard', icon: 'dashboard' },
    { label: 'Book Appointment', route: '/customer/book-appointment', icon: 'event_available' },
    { label: 'Gallery', route: '/customer/gallery', icon: 'collections' },
    { label: 'Messages', route: '/customer/messages', icon: 'message' },
    { label: 'Profile', route: '/customer/profile', icon: 'person' }
  ];

  formData = {
    customerName: '',
    age: 0,
    phoneNumber: '',
    deadline: '',
    notes: '',
    inspoImageUrl: ''
  };

  selectedFiles: File[] = [];
  previewUrls: string[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.formData.customerName = currentUser.fullName || '';
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      console.log('Files selected:', input.files.length);
      Array.from(input.files).forEach(file => {
        this.selectedFiles.push(file);
        
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          this.previewUrls.push(e.target?.result as string);
          console.log('Preview URLs count:', this.previewUrls.length);
        };
        reader.readAsDataURL(file);
      });
      
      input.value = '';
    }
  }

  removeImage(index: number): void {
    this.previewUrls.splice(index, 1);
    this.selectedFiles.splice(index, 1);
    if (this.previewUrls.length === 0) {
      this.formData.inspoImageUrl = '';
    }
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    
    const token = this.authService.getToken();
    const currentUser = this.authService.currentUserValue;
    
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

    if (this.previewUrls.length > 0) {
      this.formData.inspoImageUrl = this.previewUrls[0];
    }

    const appointment: Appointment = {
      customerName: this.formData.customerName,
      age: this.formData.age || 0,
      phoneNumber: this.formData.phoneNumber,
      deadline: this.formData.deadline,
      notes: this.formData.notes || '',
      inspoImageUrl: this.formData.inspoImageUrl || '',
      status: 'PENDING'
    };

    this.appointmentService.createAppointment(appointment, this.selectedFiles.length > 0 ? this.selectedFiles : undefined).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = 'Appointment booked successfully!';
        
        // Reset form
        setTimeout(() => {
          this.router.navigate(['/customer/dashboard']);
        }, 1500);
      },
      error: (error: any) => {
        console.error('Error creating appointment:', error);
        
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
          this.errorMessage = 'Failed to create appointment. Please try again.';
        }
        
        this.loading = false;
      }
    });
  }
}
