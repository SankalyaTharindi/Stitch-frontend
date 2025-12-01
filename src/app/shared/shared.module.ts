import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedSidebarComponent } from './components/sidebar/sidebar.component';

@NgModule({
  declarations: [
    SharedSidebarComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
    SharedSidebarComponent
  ]
})
export class SharedModule { }
