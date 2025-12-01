import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stats-grid',
  templateUrl: './stats-grid.component.html',
  styleUrls: ['./stats-grid.component.scss']
})
export class StatsGridComponent {
  @Input() pendingCount: number = 0;
  @Input() approvedCount: number = 0;
  @Input() completedCount: number = 0;
  @Input() totalCount: number = 0;
}
