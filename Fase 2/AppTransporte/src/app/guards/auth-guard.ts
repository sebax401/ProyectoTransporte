// src/app/guards/auth-guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';

export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);
  
  // Instancia de Supabase
  const supabase = createClient(
    environment.SUPABASE_URL, 
    environment.SUPABASE_PUBLISHABLE_KEY
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    return true; // Usuario autenticado
  } else {
    router.navigateByUrl('/Inicio/CierreSesión'); // Redirige al Login si no hay sesión
    return false;
  }
};