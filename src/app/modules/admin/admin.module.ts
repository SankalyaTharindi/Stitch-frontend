import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { AdminDashboardComponent } from './dashboard/dashboard.component';
import { StatsGridComponent } from './stats-grid/stats-grid.component';
import { UpcomingDeadlinesComponent } from './upcoming-deadlines/upcoming-deadlines.component';
import { AppointmentsListComponent } from './appointments-list/appointments-list.component';
import { CustomersComponent } from './customers/customers.component';
import { AppointmentsComponent } from './appointments/appointments.component';
import { CalendarComponent } from './calendar/calendar.component';
import { AdminGalleryComponent } from './gallery/gallery.component';
import { AdminProfileComponent } from './profile/profile.component';

const routes: Routes = [
  {
    path: 'dashboard',
    component: AdminDashboardComponent
  },
  {
    path: 'appointments',
    component: AppointmentsComponent
  },
  {
    path: 'customers',
    component: CustomersComponent
  },
  {
    path: 'calendar',
    component: CalendarComponent
  },
  {
    path: 'gallery',
    component: AdminGalleryComponent
  },
  {
    path: 'profile',
    component: AdminProfileComponent
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
    CustomersComponent,
    AppointmentsComponent,
    CalendarComponent,
    AdminGalleryComponent,
    AdminProfileComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class AdminModule { }
