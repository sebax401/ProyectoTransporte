import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { Chart, registerables } from 'chart.js';

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
  IonItem, 
  IonSelect, 
  IonSelectOption
} from '@ionic/angular/standalone';

import { RouterLink, Router } from '@angular/router';

import { forkJoin } from 'rxjs';
import { addIcons } from 'ionicons';
import { 
  carOutline, 
  peopleOutline, 
  timeOutline, 
  refreshOutline, 
  warningOutline, 
  checkmarkCircleOutline 
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { DashboardService, ServicioViaje } from '../services/dashboard';

Chart.register(...registerables);

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
  CommonModule,
  IonItem,       // <--- Necesario para que reconozca <ion-item>
  IonSelect,     // <--- Necesario para <ion-select>
  IonSelectOption
]
})
export class homePage implements OnInit, OnDestroy  {

  private graficoFlota?: Chart;
  private graficoVehiculosFallas?: Chart;
  private graficoFallas?: Chart;

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

    
  ) {addIcons({
      'car-outline': carOutline,
      'people-outline': peopleOutline,
      'time-outline': timeOutline,
      'refresh-outline': refreshOutline,
      'warning-outline': warningOutline,
      'checkmark-circle-outline': checkmarkCircleOutline
    });}

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

          // Actualizar gráficos cuando Angular haya renderizado los canvas
          setTimeout(() => {
            this.crearGraficoFlota(
              this.vehiculosOperativos,
              this.vehiculosConFallas
            );

            this.crearGraficoVehiculosFallas(reportes, vehiculos);

            this.crearGraficoFallas(reportes);
          }, 0);

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

  crearGraficoVehiculosFallas(reportes: any[], vehiculos: any[]) {
  this.graficoVehiculosFallas?.destroy();

  const canvas = document.getElementById('graficoVehiculosFallas') as HTMLCanvasElement;
  if (!canvas) return;

  const conteo = new Map<number, number>();

  // Contar los reportes asociados a cada vehículo
  reportes.forEach((reporte: any) => {
    const idVehiculo = Number(reporte.idVehiculo);

    if (idVehiculo) {
      conteo.set(idVehiculo, (conteo.get(idVehiculo) || 0) + 1);
    }
  });

  // Asociar los reportes con las patentes
  const datos = vehiculos
      .map((vehiculo: any) => ({
        patente: vehiculo.patente,
        cantidad: conteo.get(Number(vehiculo.idVehiculo)) || 0
      }))
      .filter((vehiculo: any) => vehiculo.cantidad > 0)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    this.graficoVehiculosFallas = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: datos.map(v => v.patente),
        datasets: [{
          label: 'Cantidad de reportes',
          data: datos.map(v => v.cantidad),
          backgroundColor: '#e76f51',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }

  crearGraficoFlota(operativos: number, fallas: number) {

    this.graficoFlota?.destroy();

    const canvas = document.getElementById('graficoFlota') as HTMLCanvasElement;

    if (!canvas) return;

    this.graficoFlota = new Chart(canvas, {
      type: 'doughnut',

      data: {
        labels: ['Operativos', 'Con fallas'],

        datasets: [{
          data: [operativos, fallas],
          backgroundColor: ['#16a34a', '#dc2626'],
          borderWidth: 0
        }]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
  

  crearGraficoFallas(reportes: any[]) {

  this.graficoFallas?.destroy();

  const canvas = document.getElementById('graficoFallas') as HTMLCanvasElement;

  if (!canvas) return;

  const cantidades: { [tipo: string]: number } = {};

  reportes.forEach(reporte => {

    const tipo =
      reporte.tipoReporte?.trim() || 'Sin categoría';

    cantidades[tipo] = (cantidades[tipo] || 0) + 1;

  });

  this.graficoFallas = new Chart(canvas, {

      type: 'bar',

      data: {
        labels: Object.keys(cantidades),

        datasets: [{
          label: 'Reportes registrados',
          data: Object.values(cantidades),
          backgroundColor: '#f59e0b',
          borderRadius: 6
        }]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
          legend: {
            display: false
          }
        },

        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }

    });
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