import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard (Functional Guard - Angular 19 style)
 *
 * Protects routes that require authentication
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'sql-editor',
 *   component: SqlEditorComponent,
 *   canActivate: [authGuard]
 * }
 * ```
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  // Store the attempted URL for redirecting after login
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });

  return false;
};

/**
 * Role Guard Factory
 *
 * Creates a guard that checks for specific roles
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'admin',
 *   component: AdminComponent,
 *   canActivate: [roleGuard(['admin'])]
 * }
 * ```
 */
export function roleGuard(requiredRoles: string[]): CanActivateFn {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
      router.navigate(['/login']);
      return false;
    }

    const user = authService.getCurrentUser();
    const hasRole = requiredRoles.some(role =>
      user?.roles?.includes(role)
    );

    if (!hasRole) {
      router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  };
}
