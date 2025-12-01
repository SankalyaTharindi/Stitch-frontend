import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Appointment } from '../../../services/appointment.service';

@Component({
  selector: 'app-appointments-list',
  templateUrl: './appointments-list.component.html',
  styleUrls: ['./appointments-list.component.scss']
})
export class AppointmentsListComponent {
  @Input() appointments: Appointment[] = [];
  @Input() selectedStatus: string = 'ALL';
  @Input() loading: boolean = false;
  @Output() statusChange = new EventEmitter<string>();
  @Output() approve = new EventEmitter<number>();
  @Output() decline = new EventEmitter<number>();

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
}
