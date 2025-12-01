import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Appointment } from '../../../services/appointment.service';

@Component({
  selector: 'app-my-appointments',
  templateUrl: './my-appointments.component.html',
  styleUrls: ['./my-appointments.component.scss']
})
export class MyAppointmentsComponent {
  @Input() appointments: Appointment[] = [];
  @Input() loading: boolean = false;
  @Output() cancel = new EventEmitter<number>();
  @Output() edit = new EventEmitter<Appointment>();

  get currentAppointments(): Appointment[] {
    return this.appointments.filter(apt => 
      apt.status === 'PENDING' || apt.status === 'APPROVED' || apt.status === 'IN_PROGRESS'
    );
  }

  get pastAppointments(): Appointment[] {
    return this.appointments.filter(apt => apt.status === 'COMPLETED');
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
      'COMPLETED': '#6c757d'
    };
    return colors[status] || '#6c757d';
  }
}
