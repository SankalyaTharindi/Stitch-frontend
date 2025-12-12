import { Component, Input, HostListener } from '@angular/core';
import { Router } from '@angular/router';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: number;
}

@Component({
  selector: 'app-shared-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SharedSidebarComponent {
  @Input() title: string = 'Stitch';
  @Input() navItems: NavItem[] = [];
  isCollapsed: boolean = false;
  isMobile: boolean = false;

  constructor(private router: Router) {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    if (this.isMobile) {
      this.isCollapsed = true;
    }
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  navigate(route: string): void {
    this.router.navigate([route]);
    if (this.isMobile) {
      this.isCollapsed = true;
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    this.router.navigate(['/auth/login']);
  }
}
