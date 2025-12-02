import { Component, OnInit } from '@angular/core';
import { AppointmentService, Appointment } from '../../../services/appointment.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  appointments: Appointment[];
}

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
  appointments: Appointment[] = [];
  loading: boolean = true;
  
  currentDate: Date = new Date();
  calendarDays: CalendarDay[] = [];
  monthNames: string[] = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
  weekDays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  selectedDay: CalendarDay | null = null;

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
        this.appointments = data;
        this.generateCalendar();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.loading = false;
      }
    });
  }

  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    this.calendarDays = [];
    const currentDate = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    while (currentDate <= endDate) {
      const dayAppointments = this.appointments.filter(apt => {
        const aptDate = new Date(apt.deadline);
        return aptDate.getFullYear() === currentDate.getFullYear() &&
               aptDate.getMonth() === currentDate.getMonth() &&
               aptDate.getDate() === currentDate.getDate();
      });
      
      const calDay: CalendarDay = {
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.getTime() === today.getTime(),
        appointments: dayAppointments
      };
      
      this.calendarDays.push(calDay);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  previousMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendar();
    this.selectedDay = null;
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendar();
    this.selectedDay = null;
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.generateCalendar();
    this.selectedDay = null;
  }

  selectDay(day: CalendarDay): void {
    if (day.appointments.length > 0) {
      this.selectedDay = day;
    }
  }

  closeDetails(): void {
    this.selectedDay = null;
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
