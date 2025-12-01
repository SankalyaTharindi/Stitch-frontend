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

  selectedFiles: File[] = [];
  previewUrls: string[] = [];
  existingImageIndices: number[] = []; // Track which preview URLs are existing images (-1 = new, 0+ = existing index)
  deletedImageIndices: number[] = []; // Track which existing images user wants to delete
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
      if (this.appointmentData.inspoImageUrl && this.appointmentData.id) {
        // Load all existing images as blobs and create object URLs for preview
        const imageCount = this.appointmentService.getImageCount(this.appointmentData.inspoImageUrl);
        for (let i = 0; i < imageCount; i++) {
          this.appointmentService.getImageBlob(this.appointmentData.id, false, i).subscribe({
            next: (blob) => {
              const currentIndex = this.previewUrls.length;
              this.previewUrls.push(URL.createObjectURL(blob));
              this.existingImageIndices.push(i); // Mark this as an existing image
            },
            error: (err) => {
              console.error(`Error loading existing image ${i}:`, err);
            }
          });
        }
      }
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      console.log('Files selected:', input.files.length);
      // Add new files to the array
      Array.from(input.files).forEach(file => {
        this.selectedFiles.push(file);
        
        // Create preview for each file
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          this.previewUrls.push(e.target?.result as string);
          this.existingImageIndices.push(-1); // -1 indicates a new file, not existing
          console.log('Preview URLs count:', this.previewUrls.length);
        };
        reader.readAsDataURL(file);
      });
      
      // Reset input to allow selecting the same file again
      input.value = '';
    }
  }

  removeImage(index: number): void {
    const existingIndex = this.existingImageIndices[index];
    
    // If it's an existing image (not -1), mark it for deletion
    if (existingIndex >= 0) {
      this.deletedImageIndices.push(existingIndex);
      console.log('Marked existing image for deletion:', existingIndex);
    } else {
      // It's a new file, remove from selectedFiles
      // Count how many new files are before this index
      let newFileIndex = 0;
      for (let i = 0; i < index; i++) {
        if (this.existingImageIndices[i] === -1) {
          newFileIndex++;
        }
      }
      this.selectedFiles.splice(newFileIndex, 1);
      console.log('Removed new file at index:', newFileIndex);
    }
    
    // Remove from preview arrays
    this.previewUrls.splice(index, 1);
    this.existingImageIndices.splice(index, 1);
    
    if (this.previewUrls.length === 0) {
      this.formData.inspoImageUrl = '';
    }
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

    // For now, using the first preview URL. In production, you'd upload to a server first
    if (this.previewUrls.length > 0) {
      this.formData.inspoImageUrl = this.previewUrls[0];
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
    console.log('Selected NEW files count:', this.selectedFiles.length);
    console.log('Existing images count:', this.existingImageIndices.filter(i => i >= 0).length);
    console.log('Images to delete:', this.deletedImageIndices);
    
    // In edit mode: Backend will APPEND new images to existing ones and DELETE specified images
    // Send indices of images to delete along with new images to add
    
    const apiCall = this.editMode && this.appointmentData?.id
      ? this.appointmentService.updateAppointment(
          this.appointmentData.id, 
          appointment, 
          this.selectedFiles.length > 0 ? this.selectedFiles : undefined,
          this.deletedImageIndices.length > 0 ? this.deletedImageIndices : undefined
        )
      : this.appointmentService.createAppointment(appointment, this.selectedFiles.length > 0 ? this.selectedFiles : undefined);

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
