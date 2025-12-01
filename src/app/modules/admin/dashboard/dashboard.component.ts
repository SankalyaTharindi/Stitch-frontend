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

  adminNavItems: NavItem[] = [
    { label: 'Dashboard', route: '/admin/dashboard', icon: 'dashboard' },
    { label: 'Appointments', route: '/admin/appointments', icon: 'event' },
    { label: 'Customers', route: '/admin/customers', icon: 'people' },
    { label: 'Calendar', route: '/admin/calendar', icon: 'calendar_today' },
    { label: 'Gallery', route: '/admin/gallery', icon: 'collections' }
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
}