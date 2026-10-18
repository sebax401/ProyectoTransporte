import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'Home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'datos-vehiculo/:id',
    loadComponent: () => import('./Vehiculos/datos-vehiculo/datos-vehiculo.page').then( m => m.DatosVehiculoPage),
    canActivate: [authGuard]
  },
  {
    path: 'agregar-vehiculo',
    loadComponent: () => import('./Vehiculos/agregar-vehiculo/agregar-vehiculo.page').then( m => m.AgregarVehiculoPage),
    canActivate: [authGuard]
  },
  {
    path: 'reportes/:id',
    loadComponent: () => import('./reportes/reportes.page').then( m => m.ReportesPage),
    canActivate: [authGuard]
  },
  {
    path: 'generar-reporte',
    loadComponent: () => import('./generar-reporte/generar-reporte.page').then( m => m.GenerarReportePage),
    canActivate: [authGuard]
  },
  {
  path: 'empleados',
  loadComponent: () =>
    import('./empleados/empleados.page')
      .then(m => m.EmpleadosPage),
    canActivate: [authGuard]
  },
  {
    path: 'ListarVehiculos',
    loadComponent: () => import('./Vehiculos/Ver-vehiculo/Ver-vehiculo.page').then((m) => m.VerVehiculoPage),
    canActivate: [authGuard]
  },

];
