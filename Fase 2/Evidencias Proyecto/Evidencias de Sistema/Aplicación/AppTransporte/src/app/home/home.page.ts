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
    this.ultimaActualizacion = new Date();
    this.cargando = false;
    this.actualizando = false;

    if (mostrarCarga) {
      this.cargando = true;
    }

    this.errorDashboard = '';

    this.cargando = true;
    this.errorDashboard = '';

    try {

      // Obtener sesión de Supabase
      const session = await this.authService.getSession();

      if (!session) {
        this.errorDashboard = 'No hay una sesión activa.';
        this.cargando = false;
        return;
      }

      const token = session.access_token;

      // Consultar información de la API
      forkJoin({
        vehiculos: this.dashboardService.obtenerVehiculos(token),
        empleados: this.dashboardService.obtenerEmpleados(token),
        servicios: this.dashboardService.obtenerServicios(token)
      }).subscribe({

        next: (datos) => {

          const vehiculos = datos.vehiculos;
          const empleados = datos.empleados;
          const servicios = datos.servicios;

          // Total de vehículos
          this.totalVehiculos = vehiculos.length;

          // Total de empleados
          this.totalEmpleados = empleados.length;

          // Identificar vehículos con revisión o extintor vencido
          this.vehiculosConFallasLista = vehiculos.filter((vehiculo: any) => {

            const revisionVencida =
              String(vehiculo.estadoRevision ?? '').trim().toLowerCase() === 'vencido';

            const extintorVencido =
              String(vehiculo.estadoExtintor ?? '').trim().toLowerCase() === 'vencido';

            return revisionVencida || extintorVencido;

          });

          // Cantidad de vehículos con fallas
          this.vehiculosConFallas = this.vehiculosConFallasLista.length;

          // Vehículos sin vencimientos
          this.vehiculosOperativos =
            this.totalVehiculos - this.vehiculosConFallas;

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

            // Ordenar por fecha más reciente
            .sort((a, b) =>
              new Date(b.fechaSalida).getTime() -
              new Date(a.fechaSalida).getTime()
            )

            // Mostrar los últimos 5 servicios
            .slice(0, 5);

          this.cargando = false;

        },

        error: (error) => {
          this.cargando = false;
          this.actualizando = false;

          console.error('Error al cargar dashboard:', error);

          this.errorDashboard =
            'No fue posible obtener los datos del dashboard.';

          this.cargando = false;

        }

      });

    } catch (error) {
      this.cargando = false;
      this.actualizando = false;

      console.error('Error al obtener sesión:', error);

      this.errorDashboard = 'No fue posible verificar la sesión.';

      this.cargando = false;

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