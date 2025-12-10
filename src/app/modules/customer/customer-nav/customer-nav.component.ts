import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-customer-nav',
  templateUrl: './customer-nav.component.html',
  styleUrls: ['./customer-nav.component.scss']
})
export class CustomerNavComponent {
  constructor(private router: Router) {}

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  navigate(route: string): void {
    console.log('Navigating to:', route);
    this.router.navigate([route]).then(success => {
      console.log('Navigation success:', success);
      console.log('Current URL:', this.router.url);
    }).catch(error => {
      console.error('Navigation error:', error);
    });
  }
}
