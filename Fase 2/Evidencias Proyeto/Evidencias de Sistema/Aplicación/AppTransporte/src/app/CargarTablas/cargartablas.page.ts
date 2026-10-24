import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { forkJoin } from 'rxjs';
import { 
  IonSpinner, 
  IonButton, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent
} from '@ionic/angular/standalone';

// Importamos los modelos y servicios
import { VehiculoService, Vehiculo } from '../services/vehiculo';
import { EmpleadoService, Empleado } from '../services/empleado';
import { ServicioViajeService, ServicioViajeRequest } from '../services/servicio-viaje';

@Component({
  selector: 'app-carga-excel',
  templateUrl: './cargartablas.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonSpinner,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent
  ]
})
export class CargaExcelPage {
  // Variables para Vehículos
  vehiculosParaSubir: Vehiculo[] = [];
  cargandoVehiculos = false;

  // Variables para Empleados
  empleadosParaSubir: Empleado[] = [];
  cargandoEmpleados = false;

  // Variables para Servicios/Viajes
  serviciosParaSubir: ServicioViajeRequest[] = [];
  cargandoServicios = false;

  constructor(
    private vehiculoService: VehiculoService,
    private empleadoService: EmpleadoService,
    private servicioViajeService: ServicioViajeService
  ) {}

  // ==========================================
  // SECCIÓN: VEHÍCULOS
  // ==========================================
  onVehiculoFileChange(event: any) {
    const target: DataTransfer = <DataTransfer>(event.target);
    if (target.files.length !== 1) {
      alert('Solo puedes subir un archivo a la vez');
      return;
    }

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const arrayBuffer = e.target.result;
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const hoja = workbook.Sheets[workbook.SheetNames[0]];
      const datosExcel = XLSX.utils.sheet_to_json(hoja);

      this.vehiculosParaSubir = datosExcel.map((fila: any): Vehiculo => ({
        idVehiculo: 0,
        patente: fila.Patente || '',
        marca: fila.Marca || '',
        modelo: fila.Modelo || '',
        anio: fila.Anio || 0,
        proximoKilometraje: fila.ProximoKilometraje || 0,
        fechaUltimaMantencion: fila.FechaUltimaMantencion ? new Date(fila.FechaUltimaMantencion) : null,
        fechaProximaMantencion: fila.FechaProximaMantencion ? new Date(fila.FechaProximaMantencion) : null,
        fechaRevisionTecnica: fila.FechaRevisionTecnica ? new Date(fila.FechaRevisionTecnica) : null,
        estadoDpf: fila.EstadoDpf || '',
        estadoRevision: fila.EstadoRevision || '',
        estadoExtintor: fila.EstadoExtintor || '',
        observacion: fila.Observacion || '',
        idConductor: fila.IdConductor || null,
        estado: fila.Estado !== undefined ? fila.Estado : true,
        fotoUrl: null
      }));
    };
    reader.readAsArrayBuffer(target.files[0]);
  }

  subirVehiculos() {
    if (this.vehiculosParaSubir.length === 0) return;
    this.cargandoVehiculos = true;

    const peticiones = this.vehiculosParaSubir.map(vehiculo => 
      this.vehiculoService.agregarVehiculo(vehiculo)
    );

    forkJoin(peticiones).subscribe({
      next: () => {
        this.cargandoVehiculos = false;
        alert(`${this.vehiculosParaSubir.length} vehículos cargados correctamente.`);
        this.vehiculosParaSubir = [];
      },
      error: (err) => {
        this.cargandoVehiculos = false;
        console.error('Error al subir vehículos:', err);
        alert('Ocurrió un error al cargar algunos vehículos. Revisa la consola.');
      }
    });
  }

  // ==========================================
  // SECCIÓN: EMPLEADOS
  // ==========================================
  onEmpleadoFileChange(event: any) {
    const target: DataTransfer = <DataTransfer>(event.target);
    if (target.files.length !== 1) {
      alert('Solo puedes subir un archivo a la vez');
      return;
    }

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const arrayBuffer = e.target.result;
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const hoja = workbook.Sheets[workbook.SheetNames[0]];
      const datosExcel = XLSX.utils.sheet_to_json(hoja);

      this.empleadosParaSubir = datosExcel.map((fila: any): Empleado => ({
        idEmpleado: 0,
        nombre: String(fila.Nombre || '').trim(),
        apellido: String(fila.Apellido || '').trim(),
        rut: String(fila.Rut || '').trim(),
        cargo: String(fila.Cargo || '').trim(),
        tipoContrato: String(fila.TipoContrato || '').trim(),
        estado: fila.Estado ? String(fila.Estado).trim() : 'Activo',
        fechaIngreso: fila.FechaIngreso ? new Date(fila.FechaIngreso).toISOString() : new Date().toISOString(),
        fechaTermino: fila.FechaTermino ? new Date(fila.FechaTermino).toISOString() : null,
        razonDespido: fila.RazonDespido || null,
        observaciones: fila.Observaciones || null,
        fotoUrl: null
      }));
    };
    reader.readAsArrayBuffer(target.files[0]);
  }

  subirEmpleados() {
    if (this.empleadosParaSubir.length === 0) return;
    this.cargandoEmpleados = true;

    const peticiones = this.empleadosParaSubir.map(empleado => 
      this.empleadoService.crearEmpleado(empleado)
    );

    forkJoin(peticiones).subscribe({
      next: () => {
        this.cargandoEmpleados = false;
        alert(`${this.empleadosParaSubir.length} empleados cargados correctamente.`);
        this.empleadosParaSubir = []; 
      },
      error: (err) => {
        this.cargandoEmpleados = false;
        console.error('Error al subir empleados:', err);
        alert('Ocurrió un error al cargar algunos empleados. Revisa la consola.');
      }
    });
  }

  // ==========================================
  // SECCIÓN: SERVICIOS / VIAJES
  // ==========================================
  onServicioFileChange(event: any) {
    const target: DataTransfer = <DataTransfer>(event.target);
    if (target.files.length !== 1) {
      alert('Solo puedes subir un archivo a la vez');
      return;
    }

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const arrayBuffer = e.target.result;
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const hoja = workbook.Sheets[workbook.SheetNames[0]];
      const datosExcel = XLSX.utils.sheet_to_json(hoja);

      this.serviciosParaSubir = datosExcel.map((fila: any): ServicioViajeRequest => ({
        idServicio: 0,
        origen: String(fila.Origen || '').trim(),
        destino: String(fila.Destino || '').trim(),
        fechaSalida: fila.FechaSalida ? new Date(fila.FechaSalida).toISOString() : new Date().toISOString(),
        fechaLlegadaEstimada: fila.FechaLlegadaEstimada ? new Date(fila.FechaLlegadaEstimada).toISOString() : null,
        estado: fila.Estado ? String(fila.Estado).trim() : 'Programado',
        idVehiculo: Number(fila.IdVehiculo || 0),
        idEmpleado: Number(fila.IdEmpleado || 0),
        observaciones: fila.Observaciones ? String(fila.Observaciones).trim() : null
      }));
    };
    reader.readAsArrayBuffer(target.files[0]);
  }

  subirServicios() {
    if (this.serviciosParaSubir.length === 0) return;
    this.cargandoServicios = true;

    const peticiones = this.serviciosParaSubir.map(servicio => 
      this.servicioViajeService.crearServicio(servicio)
    );

    forkJoin(peticiones).subscribe({
      next: () => {
        this.cargandoServicios = false;
        alert(`${this.serviciosParaSubir.length} servicios/viajes cargados correctamente.`);
        this.serviciosParaSubir = [];
      },
      error: (err) => {
        this.cargandoServicios = false;
        console.error('Error al subir servicios:', err);
        alert('Ocurrió un error al cargar algunos servicios/viajes. Revisa la consola.');
      }
    });
  }
}