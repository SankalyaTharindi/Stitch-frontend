import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { CustomerDashboardComponent } from './dashboard/dashboard.component';
import { CustomerNavComponent } from './customer-nav/customer-nav.component';
import { MyAppointmentsComponent } from './my-appointments/my-appointments.component';
import { OrderStatusComponent } from './order-status/order-status.component';
import { BookAppointmentPopupComponent } from './book-appointment-popup/book-appointment-popup.component';
import { BookAppointmentComponent } from './book-appointment/book-appointment.component';
import { CustomerGalleryComponent } from './gallery/gallery.component';

const routes: Routes = [
  {
    path: 'dashboard',
    component: CustomerDashboardComponent
  },
  {
    path: 'book-appointment',
    component: BookAppointmentComponent
  },
  {
    path: 'gallery',
    component: CustomerGalleryComponent
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];

@NgModule({
  declarations: [
    CustomerDashboardComponent,
    CustomerNavComponent,
    MyAppointmentsComponent,
    OrderStatusComponent,
    BookAppointmentPopupComponent,
    BookAppointmentComponent,
    CustomerGalleryComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class CustomerModule { }
