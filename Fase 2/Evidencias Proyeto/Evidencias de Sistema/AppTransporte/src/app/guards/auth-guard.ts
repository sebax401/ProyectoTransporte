import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificamos si existe una sesión activa en Supabase
  const session = await authService.getSession();

  if (session && session.access_token) {
    return true; // Usuario autenticado, permite ver la vista
  }

  // Usuario no autenticado: redirige al login
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};