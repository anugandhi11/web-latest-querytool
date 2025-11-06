import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Auth Interceptor (Functional Interceptor - Angular 19 style)
 *
 * Automatically adds JWT token to all HTTP requests
 *
 * Configuration (already done in app.config.ts):
 * ```typescript
 * provideHttpClient(withInterceptorsFromDi())
 * ```
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Clone request and add Authorization header if token exists
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};

/**
 * Error Interceptor
 *
 * Handles HTTP errors globally, especially 401 Unauthorized
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    tap({
      error: (error) => {
        if (error.status === 401) {
          // Token expired or invalid - logout user
          authService.logout();
          window.location.href = '/login';
        }
      }
    })
  );
};

// Import tap from rxjs
import { tap } from 'rxjs/operators';
