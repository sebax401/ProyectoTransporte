import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { HttpErrorResponse } from '@angular/common/http';
import { ServicioViaje, ServicioViajeRequest, ServicioViajeService, EstadoServicio } from '../services/servicio-viaje';
import { Vehiculo, VehiculoService } from '../services/vehiculo';
import { Empleado, EmpleadoService } from '../services/empleado'
interface FormularioServicio {
  origen: string;
  destino: string;
  fechaSalida: string;
  fechaLlegadaEstimada: string;
  estado: EstadoServicio;
  idVehiculo: number;
  idEmpleado: number;
  observaciones: string;
}

@Component({
  selector: 'app-servicios-viajes',
  templateUrl: './servicios-viajes.page.html',
  styleUrls: ['./servicios-viajes.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonBadge,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonTextarea,
    IonTitle,
    IonToolbar
  ]
})
export class ServiciosViajesPage implements OnInit, OnDestroy {
  servicios: ServicioViaje[] = [];
  vehiculos: Vehiculo[] = [];
  Empleados: Empleado[] = [];
  filtroVehiculo: number | null = null;
  formulario: FormularioServicio = this.formularioVacio();
  estados: EstadoServicio[] = ['Programado', 'En curso', 'Finalizado', 'Cancelado'];

  editando = false;
  idEditando: number | null = null;
  cargandoLista = false;
  guardando = false;
  mensaje = '';
  tipoMensaje: 'success' | 'danger' = 'success';

  private intervaloActualizacion?: ReturnType<typeof setInterval>;

  constructor(
    private readonly servicioService: ServicioViajeService,
    private readonly vehiculoService: VehiculoService,
    private readonly EmpleadoService: EmpleadoService
  ) {}

  ngOnInit(): void {
    this.cargarVehiculos();
    this.cargarServicios();
    this.cargarEmpleados();
    // Actualiza el estado del listado periódicamente sin obligar al usuario a recargar.
    this.intervaloActualizacion = setInterval(() => this.cargarServicios(false), 30000);
  }

  ngOnDestroy(): void {
    if (this.intervaloActualizacion) {
      clearInterval(this.intervaloActualizacion);
    }
  }

  private formularioVacio(): FormularioServicio {
    return {
      origen: '',
      destino: '',
      fechaSalida: this.fechaHoraLocalActual(),
      fechaLlegadaEstimada: '',
      estado: 'Programado',
      idVehiculo: 0,
      idEmpleado: 0,
      observaciones: ''
    };
  }

  private fechaHoraLocalActual(): string {
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
    return ahora.toISOString().slice(0, 16);
  }

  cargarVehiculos(): void {
    this.vehiculoService.obtenerVehiculos().subscribe({
      next: vehiculos => {
        this.vehiculos = vehiculos ?? [];
      },
      error: error => {
        console.error('Error al cargar vehículos para servicios/viajes:', error);
        this.mostrarError(error, 'No se pudieron cargar los vehículos. Verifica tu sesión y la conexión con la API.');
      }
    });
  }
    cargarEmpleados(): void {
    this.EmpleadoService.obtenerEmpleados().subscribe({
      next: Empleados => {
        this.Empleados = Empleados ?? [];
      },
      error: error => {
        console.error('Error al cargar Conductores para servicios/viajes:', error);
        this.mostrarError(error, 'No se pudieron cargar los Conductores. Verifica tu sesión y la conexión con la API.');
      }
    });
  }

  cargarServicios(mostrarIndicador = true): void {
    if (mostrarIndicador) {
      this.cargandoLista = true;
    }

    this.servicioService.obtenerServicios(this.filtroVehiculo).subscribe({
      next: servicios => {
        this.servicios = servicios ?? [];
        this.cargandoLista = false;
      },
      error: error => {
        console.error('Error al cargar servicios/viajes:', error);
        this.cargandoLista = false;
        if (mostrarIndicador) {
          this.mostrarError(error, 'No se pudieron cargar los servicios. Inténtalo nuevamente.');
        }
      }
    });
  }

  cambiarFiltroVehiculo(valor: number | string | null | undefined): void {
    this.filtroVehiculo = valor === null || valor === undefined || valor === '' || Number(valor) === 0
      ? null
      : Number(valor);
    this.cargarServicios();
  }

  guardarServicio(): void {
    this.mensaje = '';

    const validacion = this.validarFormulario();
    if (validacion) {
      this.mostrarMensaje(validacion, 'danger');
      return;
    }

    const datos: ServicioViajeRequest = {
      idServicio: this.idEditando ?? 0,
      origen: this.formulario.origen.trim(),
      destino: this.formulario.destino.trim(),
      fechaSalida: this.formulario.fechaSalida,
      fechaLlegadaEstimada: this.formulario.fechaLlegadaEstimada || null,
      estado: this.formulario.estado,
      idVehiculo: Number(this.formulario.idVehiculo),
      idEmpleado: Number(this.formulario.idEmpleado),
      observaciones: this.formulario.observaciones.trim() || null
    };

    this.guardando = true;
    const peticion = this.editando && this.idEditando !== null
      ? this.servicioService.actualizarServicio(this.idEditando, datos)
      : this.servicioService.crearServicio(datos);

    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarMensaje(
          this.editando ? 'Servicio actualizado correctamente.' : 'Servicio registrado correctamente.',
          'success'
        );
        this.limpiarFormulario();
        this.cargarServicios();
      },
      error: error => {
        this.guardando = false;
        console.error('Error al guardar servicio/viaje:', error);
        this.mostrarError(error, 'No fue posible guardar el servicio. Revisa los datos e inténtalo nuevamente.');
      }
    });
  }

  editarServicio(servicio: ServicioViaje): void {
    this.editando = true;
    this.idEditando = servicio.idServicio;
    this.formulario = {
      origen: servicio.origen,
      destino: servicio.destino,
      fechaSalida: this.fechaParaInput(servicio.fechaSalida),
      fechaLlegadaEstimada: this.fechaParaInput(servicio.fechaLlegadaEstimada),
      estado: this.estadoPermitido(servicio.estado),
      idVehiculo: Number(servicio.idVehiculo),
      idEmpleado: Number(servicio.idEmpleado),
      observaciones: servicio.observaciones ?? ''
    };
    this.mensaje = '';
  }

  cancelarEdicion(): void {
    this.limpiarFormulario();
  }

  limpiarFormulario(): void {
    this.formulario = this.formularioVacio();
    this.editando = false;
    this.idEditando = null;
  }

  colorEstado(estado: string): string {
    switch (estado) {
      case 'En curso': return 'warning';
      case 'Finalizado': return 'success';
      case 'Cancelado': return 'danger';
      default: return 'primary';
    }
  }

  nombreVehiculo(idVehiculo: number, patenteRespuesta?: string): string {
    if (patenteRespuesta) {
      return patenteRespuesta;
    }
    const vehiculo = this.vehiculos.find(item => item.idVehiculo === idVehiculo);
    return vehiculo ? `${vehiculo.patente} - ${vehiculo.marca ?? ''} ${vehiculo.modelo}`.trim() : `Vehículo #${idVehiculo}`;
  }
    nombreEmpleado(idEmpleado: number) {
    const Empleado = this.Empleados.find(item => item.idEmpleado === idEmpleado);

    if (Empleado) {
      return `${Empleado.nombre} ${Empleado.apellido}`;
    }

    return `empleado #${idEmpleado}`;
  }

  private validarFormulario(): string | null {
    if (!this.formulario.origen.trim() || !this.formulario.destino.trim()) {
      return 'Completa los campos de origen y destino.';
    }
    if (this.formulario.origen.trim().length > 120 || this.formulario.destino.trim().length > 120) {
      return 'El origen y el destino no pueden superar los 120 caracteres.';
    }
    if (this.formulario.origen.trim().toLocaleLowerCase() === this.formulario.destino.trim().toLocaleLowerCase()) {
      return 'El origen y el destino deben ser diferentes.';
    }
    if (!this.formulario.idEmpleado || !this.Empleados.some(e => e.idEmpleado === Number(this.formulario.idEmpleado))) {
      return 'Selecciona un conductor registrado.';
    }
    if (!this.formulario.fechaSalida || Number.isNaN(new Date(this.formulario.fechaSalida).getTime())) {
      return 'Selecciona una fecha y hora de salida válidas.';
    }
    if (this.formulario.fechaLlegadaEstimada) {
      const salida = new Date(this.formulario.fechaSalida).getTime();
      const llegada = new Date(this.formulario.fechaLlegadaEstimada).getTime();
      if (Number.isNaN(llegada) || llegada <= salida) {
        return 'La llegada estimada debe ser posterior a la salida.';
      }
    }
    if (!this.formulario.idVehiculo || !this.vehiculos.some(v => v.idVehiculo === Number(this.formulario.idVehiculo))) {
      return 'Selecciona un vehículo registrado.';
    }
    if (!this.estados.includes(this.formulario.estado)) {
      return 'Selecciona un estado válido para el servicio.';
    }
    if (this.formulario.observaciones.length > 500) {
      return 'Las observaciones no pueden superar los 500 caracteres.';
    }
    return null;
  }

  private fechaParaInput(valor: string | null): string {
    if (!valor) {
      return '';
    }
    // La API guarda fechas locales de programación como ISO sin zona horaria.
    if (!/[zZ]$|[+-]\d{2}:?\d{2}$/.test(valor)) {
      return valor.slice(0, 16);
    }
    const fecha = new Date(valor);
    const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }

  private estadoPermitido(estado: string): EstadoServicio {
    return this.estados.find(item => item.toLowerCase() === (estado ?? '').toLowerCase()) ?? 'Programado';
  }

  private mostrarMensaje(texto: string, tipo: 'success' | 'danger'): void {
    this.mensaje = texto;
    this.tipoMensaje = tipo;
  }

  private mostrarError(error: unknown, mensajeAlternativo: string): void {
    const httpError = error as HttpErrorResponse;
    if (httpError?.status === 401 || httpError?.status === 403) {
      this.mostrarMensaje('Tu sesión no es válida o expiró. Inicia sesión nuevamente.', 'danger');
      return;
    }

    const mensajeApi = httpError?.error?.mensaje ?? httpError?.error?.title;
    if (!(error instanceof HttpErrorResponse) && error instanceof Error && error.message) {
      this.mostrarMensaje(error.message, 'danger');
      return;
    }
    this.mostrarMensaje(typeof mensajeApi === 'string' ? mensajeApi : mensajeAlternativo, 'danger');
  }
}

