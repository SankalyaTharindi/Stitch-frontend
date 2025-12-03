import { Component, Input } from '@angular/core';
import { Appointment } from '../../../services/appointment.service';

@Component({
  selector: 'app-upcoming-deadlines',
  templateUrl: './upcoming-deadlines.component.html',
  styleUrls: ['./upcoming-deadlines.component.scss']
})
export class UpcomingDeadlinesComponent {
  @Input() deadlines: Appointment[] = [];

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }
}
