import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../../services/auth.service';
import { AppointmentService, Appointment } from '../../../services/appointment.service';
import { NavItem } from '../../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class CustomerDashboardComponent implements OnInit {
  currentUser: User | null = null;
  appointments: Appointment[] = [];
  loading = true;
  currentAppointment: Appointment | null = null;
  showBookingPopup = false;
  editingAppointment: Appointment | null = null;

  customerNavItems: NavItem[] = [
    { label: 'Dashboard', route: '/customer/dashboard', icon: 'dashboard' },
    { label: 'Book Appointment', route: '/customer/book-appointment', icon: 'event_available' },
    { label: 'Gallery', route: '/customer/gallery', icon: 'collections' },
    { label: 'Messages', route: '/customer/messages', icon: 'message' },
    { label: 'Profile', route: '/customer/profile', icon: 'person' }
  ];

  constructor(
    private authService: AuthService,
    private appointmentService: AppointmentService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading = true;
    this.appointmentService.getMyAppointments().subscribe({
      next: (data: Appointment[]) => {
        this.appointments = data;
        this.currentAppointment = this.getCurrentAppointment();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading appointments:', error);
        this.loading = false;
      }
    });
  }

  getCurrentAppointment(): Appointment | null {
    const active = this.appointments.find(apt => 
      apt.status === 'APPROVED' || apt.status === 'IN_PROGRESS'
    );
    return active || this.appointments.find(apt => apt.status === 'PENDING') || null;
  }

  cancelAppointment(id: number): void {
    this.appointmentService.cancelAppointment(id).subscribe({
      next: () => {
        this.loadAppointments();
      },
      error: (error: any) => console.error('Error canceling appointment:', error)
    });
  }

  openBookingPopup(): void {
    this.editingAppointment = null;
    this.showBookingPopup = true;
  }

  openEditPopup(appointment: Appointment): void {
    this.editingAppointment = appointment;
    this.showBookingPopup = true;
  }

  closeBookingPopup(): void {
    this.showBookingPopup = false;
    this.editingAppointment = null;
  }

  onBookingSuccess(): void {
    this.showBookingPopup = false;
    this.loadAppointments();
  }
}
