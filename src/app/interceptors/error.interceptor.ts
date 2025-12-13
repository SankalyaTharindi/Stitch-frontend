import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Only log out on 401 for authentication endpoints or if error message indicates token expiration
        if (error.status === 401) {
          const isAuthEndpoint = request.url.includes('/auth/') || request.url.includes('/login');
          const tokenExpired = error.error?.message?.toLowerCase().includes('expired') ||
                              error.error?.message?.toLowerCase().includes('invalid token');
          
          if (isAuthEndpoint || tokenExpired) {
            console.warn('401 Unauthorized - Token expired or invalid. Logging out.');
            this.authService.logout();
            this.router.navigate(['/auth/login']);
          } else {
            console.error('403/401 Error on:', request.url, '- Check backend authorization configuration');
          }
        }
        return throwError(() => error);
      })
    );
  }
}
