import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-order-status',
  templateUrl: './order-status.component.html',
  styleUrls: ['./order-status.component.scss']
})
export class OrderStatusComponent {
  @Input() status: string = 'PENDING';
  @Input() deadline: string = '';

  getProgressPercentage(): number {
    const statusMap: { [key: string]: number } = {
      'PENDING': 25,
      'APPROVED': 50,
      'IN_PROGRESS': 75,
      'COMPLETED': 100
    };
    return statusMap[this.status] || 0;
  }

  getStatusSteps() {
    return [
      { label: 'Pending', value: 'PENDING', icon: 'schedule' },
      { label: 'Approved', value: 'APPROVED', icon: 'check_circle' },
      { label: 'In Progress', value: 'IN_PROGRESS', icon: 'construction' },
      { label: 'Completed', value: 'COMPLETED', icon: 'celebration' }
    ];
  }

  isStepActive(stepValue: string): boolean {
    const steps = ['PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED'];
    const currentIndex = steps.indexOf(this.status);
    const stepIndex = steps.indexOf(stepValue);
    return stepIndex <= currentIndex;
  }
}
