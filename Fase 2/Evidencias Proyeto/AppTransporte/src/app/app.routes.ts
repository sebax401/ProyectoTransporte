import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'Inicio',
    loadComponent: () => import('./Inicio/login.page').then(m => m.LoginPage)
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'Inicio',
    pathMatch: 'full',
  },
  {
    path: 'datos-vehiculo/:id',
    loadComponent: () => import('./datos-vehiculo/datos-vehiculo.page').then( m => m.DatosVehiculoPage)
  },
  {
    path: 'agregar-vehiculo',
    loadComponent: () => import('./agregar-vehiculo/agregar-vehiculo.page').then( m => m.AgregarVehiculoPage)
  },
  {
    path: 'reportes/:id',
    loadComponent: () => import('./reportes/reportes.page').then( m => m.ReportesPage)
  },
  {
    path: 'generar-reporte',
    loadComponent: () => import('./generar-reporte/generar-reporte.page').then( m => m.GenerarReportePage)
  },
  {
  path: 'empleados',
  loadComponent: () =>
    import('./empleados/empleados.page')
      .then(m => m.EmpleadosPage)
  },
  
];
