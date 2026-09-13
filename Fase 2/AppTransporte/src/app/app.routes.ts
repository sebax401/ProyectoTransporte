import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
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
];
