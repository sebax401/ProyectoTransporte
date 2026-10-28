import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DatePipe } from '@angular/common';

import {
  IonContent, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle,
  IonTitle, IonMenuButton, IonButtons, IonToolbar, IonHeader,
  IonIcon, IonSpinner, IonSearchbar, IonItem, IonLabel, IonInput, IonGrid, IonRow, IonCol,IonButton
} from '@ionic/angular/standalone';

import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { BarralateralComponent } from '../BarraLateral/barralateral.component';
import { Vehiculo, VehiculoService } from '../services/vehiculo';
import { Reporte, ReporteService } from '../services/reporte';
import { HttpErrorResponse } from '@angular/common/http';

export interface ReporteConVehiculo extends Reporte {
  vehiculoInfo?: string;
  patenteOnly?: string;
}

@Component({
  selector: 'app-reportesvehiculos',
  templateUrl: './reportesvehiculos.page.html',
  styleUrls: ['./reportesvehiculos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonTitle,
    IonMenuButton,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonSpinner,
    IonSearchbar,
    IonItem,
    IonLabel,
    IonInput,
    IonGrid,
    IonRow,
    IonCol,
    BarralateralComponent,
    IonIcon
  ]
})
export class reportesvehiculosPage implements OnInit {
  reportes: ReporteConVehiculo[] = [];
  vehiculos: Vehiculo[] = [];
  cargandoLista = false;
  mensaje = '';
  tipoMensaje: 'success' | 'danger' = 'success';

  // Filtro de Búsqueda y Ordenamiento
  textoBusqueda: string = '';
  columnaOrden: string = '';
  ordenAscendente: boolean = true;

  // Filtro por Rango de Fechas
  fechaDesde: string = '';
  fechaHasta: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private readonly vehiculoService: VehiculoService,
    private readonly reporteService: ReporteService,
  ) { }

  ngOnInit(): void {
    this.establecerRangoMesActual();
    this.cargarDatos();
  }

  // Define el rango inicial por defecto: desde el día 1 del mes actual hasta la fecha actual
  establecerRangoMesActual(): void {
    const ahora = new Date();
    const primerDia = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    // Formato YYYY-MM-DD para <input type="date">
    this.fechaDesde = primerDia.toISOString().split('T')[0];
    this.fechaHasta = ahora.toISOString().split('T')[0];
  }

  cargarDatos(): void {
    this.cargandoLista = true;
    
    this.vehiculoService.obtenerVehiculos().subscribe({
      next: vehiculos => {
        this.vehiculos = vehiculos ?? [];
        this.cargarReportes();
      },
      error: error => {
        console.error('Error al cargar vehículos:', error);
        this.cargandoLista = false;
        this.mostrarError(error, 'No se pudieron cargar los vehículos.');
      }
    });
  }

  cargarReportes(): void {
    this.reporteService.obtenerReportesVehiculos().subscribe({
      next: reportes => {
        const listaReportes = reportes ?? [];

        this.reportes = listaReportes.map(rep => {
          const v = this.vehiculos.find(veh => veh.idVehiculo === rep.idVehiculo);
          return {
            ...rep,
            patenteOnly: v?.patente || '',
            vehiculoInfo: v ? `${v.patente} - ${v.modelo}` : `Vehículo ID: ${rep.idVehiculo}`
          };
        });

        this.cargandoLista = false;
      },
      error: error => {
        console.error('Error al cargar reportes:', error);
        this.cargandoLista = false;
        this.mostrarError(error, 'No se pudieron cargar los reportes.');
      }
    });
  }

  // Getter para obtener la lista filtrada (Búsqueda por Matrícula + Rango de Fechas + Orden)
 // Getter para obtener la lista filtrada
get reportesFiltrados(): ReporteConVehiculo[] {
  let resultado = [...this.reportes];

  // 1. Filtrar por rango de fechas (comparando sólo año, mes y día en YYYY-MM-DD)
  if (this.fechaDesde) {
    resultado = resultado.filter(r => {
      if (!r.fechaGeneracion) return false;
      const fechaRep = new Date(r.fechaGeneracion).toISOString().split('T')[0];
      return fechaRep >= this.fechaDesde;
    });
  }

  if (this.fechaHasta) {
    resultado = resultado.filter(r => {
      if (!r.fechaGeneracion) return false;
      const fechaRep = new Date(r.fechaGeneracion).toISOString().split('T')[0];
      return fechaRep <= this.fechaHasta;
    });
  }

  // 2. Filtrar por matrícula (patente)
  if (this.textoBusqueda.trim() !== '') {
    const termino = this.textoBusqueda.toLowerCase().trim();
    resultado = resultado.filter(r => 
      r.patenteOnly && r.patenteOnly.toLowerCase().includes(termino)
    );
  }

  // 3. Ordenamiento por columna
  if (this.columnaOrden) {
    resultado.sort((a, b) => {
      let valA: any = a[this.columnaOrden as keyof ReporteConVehiculo] ?? '';
      let valB: any = b[this.columnaOrden as keyof ReporteConVehiculo] ?? '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return this.ordenAscendente ? -1 : 1;
      if (valA > valB) return this.ordenAscendente ? 1 : -1;
      return 0;
    });
  }

  return resultado;
}

  ordenarPor(columna: string): void {
    if (this.columnaOrden === columna) {
      this.ordenAscendente = !this.ordenAscendente;
    } else {
      this.columnaOrden = columna;
      this.ordenAscendente = true;
    }
  }

  limpiarFiltroFechas(): void {
    this.fechaDesde = '';
    this.fechaHasta = '';
  }

  exportarPDF(): void {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  doc.setFontSize(16);
  doc.setTextColor(26, 26, 26);
  doc.text('Historial de Reportes e Incidencias', 14, 15);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Listado consolidado de mantenimientos, fallas y repuestos', 14, 21);

  // Información de filtros aplicados
  let infoFiltros = `Fecha de exportación: ${new Date().toLocaleDateString('es-CL')}`;
  if (this.textoBusqueda.trim()) {
    infoFiltros += ` | Busqueda: "${this.textoBusqueda}"`;
  }
  if (this.fechaDesde || this.fechaHasta) {
    infoFiltros += ` | Rango: ${this.fechaDesde || 'Inicio'} a ${this.fechaHasta || 'Hoy'}`;
  }
  doc.text(infoFiltros, 14, 27);

  // Mapeo de filas usando la lista filtrada de la pantalla (reportesFiltrados)
  const filas = this.reportesFiltrados.map(r => {
    // Formatear la fecha para la tabla en PDF
    let fechaTxt = '';
    if (r.fechaGeneracion) {
      const partes = String(r.fechaGeneracion).split('T')[0].split('-');
      fechaTxt = partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : String(r.fechaGeneracion);
    }

    const valorTxt = r.valorRepuesto ? `$${r.valorRepuesto}` : 'Pendiente';
    const repuestoDesc = r.nombreRepuesto ? `${r.nombreRepuesto}: ${r.descripcion}` : r.descripcion;

    return [
      r.lugarCompra || 'N/A',
      valorTxt,
      r.vehiculoInfo || '',
      fechaTxt,
      r.tipoReporte || '',
      r.subTipoReporte || 'N/A',
      repuestoDesc
    ];
  });

  // Generación de la tabla con autoTable
  autoTable(doc, {
    startY: 32,
    head: [['Lugar de Compra', 'Valor Repuesto', 'Vehículo', 'Fecha Gen.', 'Tipo', 'Subtipo', 'Repuesto / Descripción']],
    body: filas,
    headStyles: {
      fillColor: [45, 211, 111], // Verde de tu aplicación (#2dd36f)
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [40, 40, 40]
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250]
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 28 },
      2: { cellWidth: 45 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 30 },
      6: { cellWidth: 'auto' }
    }
  });

  // Guardar y descargar el archivo PDF
  const nombreArchivo = `Reporte_Incidencias_${new Date().getTime()}.pdf`;
  doc.save(nombreArchivo);
}

verDetalleReporte(reporte: ReporteConVehiculo): void {
  // Redirige al componente DetalleReporte pasando los datos del reporte
  this.router.navigate(['/DetalleReporte', reporte.idReporte], {
    state: { reporte }
  });
}



  private mostrarError(error: unknown, mensajeAlternativo: string): void {
    const httpError = error as HttpErrorResponse;
    if (httpError?.status === 401 || httpError?.status === 403) {
      this.mostrarMensaje('Tu sesión no es válida o expiró. Inicia sesión nuevamente.', 'danger');
      return;
    }
    this.mostrarMensaje(mensajeAlternativo, 'danger');
  }

  private mostrarMensaje(texto: string, tipo: 'success' | 'danger'): void {
    this.mensaje = texto;
    this.tipoMensaje = tipo;
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigateByUrl('/login', { replaceUrl: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}