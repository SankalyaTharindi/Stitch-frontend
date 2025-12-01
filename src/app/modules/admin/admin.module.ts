import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { AdminDashboardComponent } from './dashboard/dashboard.component';
import { StatsGridComponent } from './stats-grid/stats-grid.component';
import { UpcomingDeadlinesComponent } from './upcoming-deadlines/upcoming-deadlines.component';
import { AppointmentsListComponent } from './appointments-list/appointments-list.component';
import { CustomersComponent } from './customers/customers.component';

const routes: Routes = [
  {
    path: 'dashboard',
    component: AdminDashboardComponent
  },
  {
    path: 'customers',
    component: CustomersComponent
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];

@NgModule({
  declarations: [
    AdminDashboardComponent,
    StatsGridComponent,
    UpcomingDeadlinesComponent,
    AppointmentsListComponent,
    CustomersComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class AdminModule { }
