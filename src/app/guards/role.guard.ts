import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRole = route.data['role'];
    const currentUser = this.authService.currentUserValue;
    console.log('RoleGuard - Required role:', requiredRole, 'Current user:', currentUser);
    
    if (this.authService.hasRole(requiredRole)) {
      console.log('RoleGuard - Access granted');
      return true;
    }

    console.log('RoleGuard - Access denied, redirecting to login');
    this.router.navigate(['/auth/login']);
    return false;
  }
}