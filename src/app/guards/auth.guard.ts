import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    const isLoggedIn = this.authService.isLoggedIn();
    console.log('AuthGuard - isLoggedIn:', isLoggedIn, 'for URL:', state.url);
    console.log('AuthGuard - token:', localStorage.getItem('token'));
    
    if (isLoggedIn) {
      return true;
    }

    return this.router.createUrlTree(['/auth/login'], { 
      queryParams: { returnUrl: state.url } 
    });
  }
}