import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedSidebarComponent } from './components/sidebar/sidebar.component';
import { NotificationDropdownComponent } from './components/notification-dropdown/notification-dropdown.component';
import { ClickOutsideDirective } from './directives/click-outside.directive';

@NgModule({
  declarations: [
    SharedSidebarComponent,
    NotificationDropdownComponent,
    ClickOutsideDirective
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
    SharedSidebarComponent,
    NotificationDropdownComponent
  ]
})
export class SharedModule { }
