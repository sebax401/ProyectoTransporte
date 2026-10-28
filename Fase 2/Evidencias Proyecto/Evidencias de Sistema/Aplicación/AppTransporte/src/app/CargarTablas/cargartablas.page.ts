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
import { ReporteService, Reporte } from '../services/reporte';

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

  // Variables para Reportes/mantenimiento
  ReportesParaSubir: Reporte[] = [];
  cargandoReportes = false;

  constructor(
    private vehiculoService: VehiculoService,
    private empleadoService: EmpleadoService,
    private servicioViajeService: ServicioViajeService,
    private reporteService: ReporteService
  ) { }

  // ==========================================
  // HELPER ÚNICO Y REUTILIZABLE PARA FECHAS
  // ==========================================
  private parsearFechaExcel(val: any): string | null {
  if (!val || String(val).trim() === '') return null;

  const str = String(val).trim();

  // 1. Si viene como ISO (YYYY-MM-DD)
  if (str.includes('T')) return str.split('T')[0];

  // 2. Si viene con barras o guiones desde Excel (Formato EE.UU. MM/DD/YYYY)
  if (str.includes('/') || str.includes('-')) {
    const separador = str.includes('/') ? '/' : '-';
    const partes = str.split(' ')[0].split(separador);

    if (partes.length === 3) {
      // Si el año está al final (ej: "10/19/2026")
      if (partes[2].length === 4) {
        const mes = partes[0].padStart(2, '0');  // Primer número es MES
        const dia = partes[1].padStart(2, '0');  // Segundo número es DÍA
        const anio = partes[2];
        return `${anio}-${mes}-${dia}`;
      }
      
      // Si el año está al inicio (ej: "2026-10-19")
      if (partes[0].length === 4) {
        const anio = partes[0];
        const mes = partes[1].padStart(2, '0');
        const dia = partes[2].padStart(2, '0');
        return `${anio}-${mes}-${dia}`;
      }
    }
  }

  // 3. Fallback con Date
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const anio = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  return null;
}
  // ==========================================
  // HELPER ÚNICO Y REUTILIZABLE PARA FECHAS y HORA
  // ========================================== 
  private parsearFechaServicio(val: any): string | null {
  if (!val || String(val).trim() === '') return null;

  const str = String(val).trim();

  // Caso 1: Cadena ISO ya formateada
  if (str.includes('T')) {
    const d = new Date(str);
    return !isNaN(d.getTime()) ? str : null;
  }

  // Caso 2: Formatos de Excel como "3/13/26 8:00" o "13/03/2026 08:00"
  const partesEspacio = str.split(' ');
  const parteFecha = partesEspacio[0];
  const parteHora = partesEspacio[1] || '00:00';

  if (parteFecha.includes('/') || parteFecha.includes('-')) {
    const separador = parteFecha.includes('/') ? '/' : '-';
    const componentes = parteFecha.split(separador);

    if (componentes.length === 3) {
      let mes = parseInt(componentes[0], 10);
      let dia = parseInt(componentes[1], 10);
      let anio = parseInt(componentes[2], 10);

      if (anio < 100) anio += 2000;

      if (mes > 12) {
        const temp = mes;
        mes = dia;
        dia = temp;
      }

      const [horas, minutos] = parteHora.split(':').map(n => parseInt(n, 10) || 0);

      const aStr = String(anio);
      const mStr = String(mes).padStart(2, '0');
      const dStr = String(dia).padStart(2, '0');
      const hStr = String(horas).padStart(2, '0');
      const minStr = String(minutos).padStart(2, '0');

      // Construimos ISO local sin desfase UTC
      return `${aStr}-${mStr}-${dStr}T${hStr}:${minStr}:00`;
    }
  }

  return null;
  }
  








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
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      const hoja = workbook.Sheets[workbook.SheetNames[0]];
      const datosExcel = XLSX.utils.sheet_to_json(hoja, { raw: false });

      this.vehiculosParaSubir = datosExcel.map((fila: any): Vehiculo => ({
        idVehiculo: 0,
        patente: String(fila.Patente || '').trim(),
        marca: String(fila.Marca || '').trim(),
        modelo: String(fila.Modelo || '').trim(),
        anio: Number(fila.Anio || 0),
        proximoKilometraje: Number(fila.ProximoKilometraje || 0),

        // Uso de la función reutilizable
        fechaUltimaMantencion: this.parsearFechaExcel(fila.FechaUltimaMantencion) as any,
        fechaProximaMantencion: this.parsearFechaExcel(fila.FechaProximaMantencion) as any,
        fechaRevisionTecnica: this.parsearFechaExcel(fila.FechaRevisionTecnica) as any,

        estadoDpf: String(fila.EstadoDpf || '').trim(),
        estadoRevision: String(fila.EstadoRevision || '').trim(),
        estadoExtintor: String(fila.EstadoExtintor || '').trim(),
        observacion: String(fila.Observacion || '').trim(),
        idConductor: fila.IdConductor ? Number(fila.IdConductor) : null,
        estado: fila.Estado !== undefined ? Boolean(fila.Estado) : true,
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
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      const hoja = workbook.Sheets[workbook.SheetNames[0]];
      const datosExcel = XLSX.utils.sheet_to_json(hoja, { raw: false });

      this.empleadosParaSubir = datosExcel.map((fila: any): Empleado => ({
        idEmpleado: 0,
        nombre: String(fila.Nombre || '').trim(),
        apellido: String(fila.Apellido || '').trim(),
        rut: String(fila.Rut || '').trim(),
        cargo: String(fila.Cargo || '').trim(),
        tipoContrato: String(fila.TipoContrato || '').trim(),
        estado: fila.Estado ? String(fila.Estado).trim() : 'Activo',

        // Uso de la función reutilizable
        fechaIngreso: this.parsearFechaExcel(fila.FechaIngreso) ?? new Date().toISOString().split('T')[0],
        fechaTermino: this.parsearFechaExcel(fila.FechaTermino),

        razonDespido: fila.RazonDespido ? String(fila.RazonDespido).trim() : null,
        observaciones: fila.Observaciones ? String(fila.Observaciones).trim() : null,
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
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
    const hoja = workbook.Sheets[workbook.SheetNames[0]];
    const datosExcel = XLSX.utils.sheet_to_json(hoja, { raw: false });

    this.serviciosParaSubir = datosExcel.map((fila: any): ServicioViajeRequest => {
      // Parseamos la fecha de salida y de llegada estimada
      const fechaSalidaParsed = this.parsearFechaServicio(fila.FechaSalida || fila.fechaSalida);
      const fechaLlegadaParsed = this.parsearFechaServicio(fila.FechaLlegadaEstimada || fila.fechaLlegadaEstimada);

      return {
        idServicio: 0,
        origen: String(fila.Origen || fila.origen || '').trim(),
        destino: String(fila.Destino || fila.destino || '').trim(),
        
        // Enviamos la fecha parseada si existe; de lo contrario ISO actual
        fechaSalida: fechaSalidaParsed ?? new Date().toISOString(),
        fechaLlegadaEstimada: fechaLlegadaParsed,
        
        estado: (fila.Estado || fila.estado) ? String(fila.Estado || fila.estado).trim() : 'Programado',
        idVehiculo: Number(fila.IdVehiculo || fila.idVehiculo || 0),
        idEmpleado: Number(fila.IdEmpleado || fila.idEmpleado || fila.IdConductor || fila.idConductor || 0),
        observaciones: (fila.Observaciones || fila.observaciones) ? String(fila.Observaciones || fila.observaciones).trim() : null
      };
    });
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

  // ==========================================
  // SECCIÓN: REPORTES / MANTENIMIENTOS
  // ==========================================
  onReportesFileChange(event: any) {
    const target: DataTransfer = <DataTransfer>(event.target);
    if (target.files.length !== 1) {
      alert('Solo puedes subir un archivo a la vez');
      return;
    }

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const arrayBuffer = e.target.result;
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      const hoja = workbook.Sheets[workbook.SheetNames[0]];
      const datosExcel = XLSX.utils.sheet_to_json(hoja, { raw: false });

      this.ReportesParaSubir = datosExcel.map((fila: any): Reporte => ({
        idReporte: 0,
        tipoReporte: String(fila.tipoReporte || fila.TipoReporte || '').trim(),
        subTipoReporte: String(fila.subTipoReporte || fila.SubTipoReporte || '').trim(),

        // Uso de la función reutilizable (evita el HTTP 400 y el 31/12/1969)
        fechaGeneracion: this.parsearFechaExcel(fila.fechaGeneracion || fila.FechaGeneracion) ?? new Date().toISOString().split('T')[0],

        descripcion: String(fila.descripcion || fila.Descripcion || '').trim(),
        idVehiculo: Number(fila.idVehiculo || fila.IdVehiculo || 0),
        nombreRepuesto: String(fila.nombreRepuesto || fila.NombreRepuesto || '').trim(),
        valorRepuesto: (fila.valorRepuesto || fila.ValorRepuesto) ? Number(fila.valorRepuesto || fila.ValorRepuesto) : null,
        lugarCompra: String(fila.lugarCompra || fila.LugarCompra || '').trim()
      }));
    };
    reader.readAsArrayBuffer(target.files[0]);
  }

  subirReportes() {
    if (this.ReportesParaSubir.length === 0) return;
    this.cargandoReportes = true;

    const peticiones = this.ReportesParaSubir.map(reporte =>
      this.reporteService.crearReporte(reporte)
    );

    forkJoin(peticiones).subscribe({
      next: () => {
        this.cargandoReportes = false;
        alert(`${this.ReportesParaSubir.length} reportes cargados correctamente.`);
        this.ReportesParaSubir = [];
      },
      error: (err) => {
        this.cargandoReportes = false;
        console.error('Error al subir los reportes:', err);
        alert('Ocurrió un error al cargar algunos reportes. Revisa la consola.');
      }
    });
  }
}