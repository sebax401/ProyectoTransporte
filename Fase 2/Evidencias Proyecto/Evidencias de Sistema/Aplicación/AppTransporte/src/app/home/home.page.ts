import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import {
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonTitle,
  IonMenuButton,
  IonButtons,
  IonToolbar,
  IonHeader,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonSpinner,
} from '@ionic/angular/standalone';

import { RouterLink, Router } from '@angular/router';

import { forkJoin } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { DashboardService, ServicioViaje } from '../services/dashboard';

@Component({
  selector: 'app-home',
  templateUrl: './Home.page.html',
  styleUrls: ['./Home.page.scss'],
  standalone: true,
  imports: [
  RouterLink,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonTitle,
  IonMenuButton,
  IonContent,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  DatePipe,
  IonSpinner,
  CommonModule
]
})
export class HomePage implements OnInit, OnDestroy  {

  private intervaloActualizacion: any;

  actualizando = false;
  ultimaActualizacion: Date | null = null;

  // Indicadores del dashboard
  totalVehiculos = 0;
  vehiculosConFallas = 0;
  vehiculosOperativos = 0;
  totalEmpleados = 0;
  vehiculosSinVencimientos = 0;

  // Información para las secciones del dashboard
  vehiculosConFallasLista: any[] = [];
  ultimosServicios: any[] = [];

  cargando = true;
  errorDashboard = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

    ngOnInit() {

      // Primera carga
      this.cargarDashboard();

      // Actualización automática cada 30 segundos
      this.intervaloActualizacion = setInterval(() => {

        // Evitar actualizar si la aplicación está en segundo plano
        if (!document.hidden) {
          this.cargarDashboard(false);
        }

      }, 30000);

    }
    ngOnDestroy() {

      if (this.intervaloActualizacion) {
        clearInterval(this.intervaloActualizacion);
      }

    }


  async cargarDashboard(mostrarCarga: boolean = true) {

    if (this.actualizando) {
      return;
    }

    this.actualizando = true;

    if (mostrarCarga) {
      this.cargando = true;
    }

    this.errorDashboard = '';

    try {

      const session = await this.authService.getSession();

      if (!session) {
        this.errorDashboard = 'No hay una sesión activa.';
        this.cargando = false;
        this.actualizando = false;
        return;
      }

      const token = session.access_token;

      forkJoin({
        vehiculos: this.dashboardService.obtenerVehiculos(token),
        empleados: this.dashboardService.obtenerEmpleados(token),
        servicios: this.dashboardService.obtenerServicios(token),
        reportes: this.dashboardService.obtenerReportes(token)
      }).subscribe({

        next: (datos) => {

          const vehiculos = datos.vehiculos;
          const empleados = datos.empleados;
          const servicios = datos.servicios;
          const reportes = datos.reportes;

          this.totalVehiculos = vehiculos.length;
          this.totalEmpleados = empleados.length;

          // Obtener los vehículos que tienen reportes pendientes
          const vehiculosConReportesPendientes = new Set(
            reportes
              .filter((reporte: any) =>
                String(reporte.estado ?? '').trim().toLowerCase() === 'pendiente'
              )
              .map((reporte: any) => reporte.idVehiculo)
          );

          // Identificar vehículos con fallas
          this.vehiculosConFallasLista = vehiculos.filter((vehiculo: any) => {

            const revisionVencida =
              String(vehiculo.estadoRevision ?? '').trim().toLowerCase() === 'vencido';

            const extintorVencido =
              String(vehiculo.estadoExtintor ?? '').trim().toLowerCase() === 'vencido';

            const reportePendiente =
              vehiculosConReportesPendientes.has(vehiculo.idVehiculo);

            return revisionVencida || extintorVencido || reportePendiente;

          });

          // Contar vehículos con fallas sin duplicarlos
          this.vehiculosConFallas = this.vehiculosConFallasLista.length;

          // Vehículos sin fallas
          this.vehiculosOperativos =
            this.totalVehiculos - this.vehiculosConFallas;

          this.vehiculosSinVencimientos = this.vehiculosOperativos;

          // Relacionar servicios con vehículos y empleados
          this.ultimosServicios = servicios
            .map((servicio: ServicioViaje) => {

              const vehiculo = vehiculos.find(
                (v: any) => v.idVehiculo === servicio.idVehiculo
              );

              const empleado = empleados.find(
                (e: any) => e.idEmpleado === servicio.idEmpleado
              );

              return {
                ...servicio,
                patente: vehiculo?.patente ?? 'Vehículo no encontrado',
                nombreConductor: empleado
                  ? `${empleado.nombre} ${empleado.apellido}`
                  : 'Conductor no encontrado'
              };

            })
            .sort((a, b) =>
              new Date(b.fechaSalida).getTime() -
              new Date(a.fechaSalida).getTime()
            )
            .slice(0, 5);

          this.ultimaActualizacion = new Date();

          this.cargando = false;
          this.actualizando = false;

        },

        error: (error) => {

          console.error('Error al cargar dashboard:', error);

          this.errorDashboard =
            'No fue posible obtener los datos del dashboard.';

          this.cargando = false;
          this.actualizando = false;

        }

      });

    } catch (error) {

      console.error('Error al obtener sesión:', error);

      this.errorDashboard = 'No fue posible verificar la sesión.';

      this.cargando = false;
      this.actualizando = false;

    }

  }


  // Cerrar sesión
  async logout() {

    try {

      await this.authService.logout();

      this.router.navigateByUrl('/login', {
        replaceUrl: true
      });

    } catch (error) {

      console.error('Error al cerrar sesión:', error);

    }

  }

}