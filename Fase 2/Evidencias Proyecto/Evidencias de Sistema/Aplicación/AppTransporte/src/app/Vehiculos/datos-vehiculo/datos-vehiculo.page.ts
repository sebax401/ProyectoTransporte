import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, 
  IonTitle, IonMenuButton, IonButton, IonButtons, IonToolbar, IonHeader, IonLabel, IonItem, IonInput, IonAccordion, IonAccordionGroup,
  IonSelect, IonSelectOption, IonBackButton, IonChip, IonIcon ,IonGrid, 
  IonRow, IonCol
} from '@ionic/angular/standalone';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { addIcons } from 'ionicons';
import { carOutline, trashBinOutline } from 'ionicons/icons';
import { VehiculoService, Vehiculo } from '../../services/vehiculo';
import { AuthService } from '../../services/auth.service';
import { Reporte,ReporteService } from 'src/app/services/reporte';
@Component({
  selector: 'app-datos-vehiculo',
  templateUrl: './datos-vehiculo.page.html',
  styleUrls: ['./datos-vehiculo.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonTitle, 
    IonMenuButton, IonButton, IonButtons, IonToolbar, IonHeader, IonLabel, CommonModule, FormsModule, RouterLink, IonItem, IonInput, 
    IonAccordion, IonAccordionGroup, IonSelect, IonSelectOption, IonBackButton, IonIcon, IonChip, IonGrid, IonRow, IonCol
  ]
})
export class DatosVehiculoPage implements OnInit {
  
  subTipo: string = ''
  
    reporte = {
      idReporte: 0,
      tipoReporte: "falla",
      subTipoReporte: "Motor",
      fechaGeneracion: "...",
      descripcion: "",
      idVehiculo: 1,
      nombreRepuesto: "",
      valorRepuesto: null,
      lugarCompra: ""
    };
  
    reportes: Reporte[] = [];

  vehiculo?: Vehiculo;
  vehiculos: Vehiculo[] = [];
  results: Vehiculo[] = [];
  repuestoEditando: number | null = null;

  repuestoForm = {
    nombreRepuesto: '',
    valorRepuesto: null as number | null,
    lugarCompra: ''
  };

  constructor(
    private vehiculoService: VehiculoService, 
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private reporteService: ReporteService,
  )
  
  
  {
    addIcons({ carOutline,trashBinOutline });
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (id) {
      this.vehiculoService.obtenerVehiculo(id).subscribe({
        next: (data) => {
          this.vehiculo = data;
        },
        error: (error) => {
          console.error('Error al obtener vehículo:', error);
        }
      });
    }
    this.reporteService.obtenerReportesVehiculo(id).subscribe({
      next: (data) => {
        this.reportes = data;
      },
      error: (error) => {
        console.error('Error al cargar reportes', error);
      }
    });
  }

  cargarVehiculos() {
    this.vehiculoService.obtenerVehiculos().subscribe({
      next: (data) => {
        this.vehiculos = data;
      },
      error: (error) => {
        console.error('Error al cargar vehículos:', error);
      }
    });
  }

  actualizarEstadoRevision() {
    if (!this.vehiculo?.fechaRevisionTecnica) return;

    const hoy = new Date();
    const fechaRevision = new Date(this.vehiculo.fechaRevisionTecnica);

    hoy.setHours(0, 0, 0, 0);
    fechaRevision.setHours(0, 0, 0, 0);

    this.vehiculo.estadoRevision = fechaRevision >= hoy ? 'Vigente' : 'Vencido';
  }

  modificarVehiculo() {
    if (!this.vehiculo) return;

    this.actualizarEstadoRevision();
    this.vehiculo.proximoKilometraje = Number(this.vehiculo.proximoKilometraje);
    this.vehiculo.anio = Number(this.vehiculo.anio);

    this.vehiculoService.modificarVehiculo(
      this.vehiculo.idVehiculo,
      this.vehiculo
    ).subscribe({
      next: () => {
        alert('Vehículo modificado correctamente');
        this.router.navigate(['/ListarVehiculos'], {
          queryParams: { refresh: new Date().getTime() }
        });
      },
      error: (error) => {
        console.error('Error al modificar:', error);
        alert('Error al modificar vehículo');
      }
    });
  }

  eliminarVehiculo() {
    if (!this.vehiculo) return;

    const confirmar = confirm('¿Seguro que deseas eliminar este vehículo?');
    if (!confirmar) return;

    this.vehiculoService.eliminarVehiculo(this.vehiculo.idVehiculo).subscribe({
      next: () => {
        alert('Vehículo eliminado correctamente');
        this.router.navigate(['/ListarVehiculos'], {
          queryParams: { refresh: new Date().getTime() }
        });
      },
      error: (error) => {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar vehículo');
      }
    });
  }
  async logout() {
    try {
      await this.authService.logout(); 
      this.router.navigateByUrl('/login', { replaceUrl: true }); 
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
  async cargarReportes() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.reporteService.obtenerReportesVehiculo(id).subscribe({
      next: (data) => {
        this.reportes = data;
      },
      error: (error) => {
        console.error('Error al cargar reportes', error);
      }
    });
  }async generarReporte() {
    const session = await this.authService.getSession();
    const token = session?.access_token;
    
    if (!token) {
      alert("No hay un token activo. Por favor vuelve a iniciar sesión.");
      return;
    }

    const idVehiculo = Number(this.route.snapshot.paramMap.get('id'));

    const descripcionFinal =
      `${this.reporte.descripcion}`;

    const reporteEnviar = {
      idReporte: 0,
      tipoReporte: this.reporte.tipoReporte,
      subTipoReporte :this.reporte.subTipoReporte,
      fechaGeneracion: new Date().toISOString(),
      descripcion: descripcionFinal,
      idVehiculo: idVehiculo,
      nombreRepuesto: '',
      valorRepuesto: null,
      lugarCompra: ''
    };

    console.log('Reporte enviado:', reporteEnviar);

    this.reporteService.crearReporte(reporteEnviar).subscribe({
      next: () => {
        alert('Reporte generado correctamente');
        this.cargarReportes();
      },
      error: (error) => {
        console.error('Error completo:', error);
        console.error('Detalle:', error.error);
        alert(JSON.stringify(error.error));
      }
    });
  }

  async mostrarFormularioRepuesto(reporte: Reporte) {
    const session = await this.authService.getSession();
    const token = session?.access_token;
    
    this.repuestoEditando = reporte.idReporte;

    this.repuestoForm = {
      nombreRepuesto: reporte.nombreRepuesto || '',
      valorRepuesto: reporte.valorRepuesto,
      lugarCompra: reporte.lugarCompra || ''
    };
  }

  async guardarRepuesto(reporte: Reporte) {
    const session = await this.authService.getSession();
    const token = session?.access_token;

    const reporteActualizado: Reporte = {
      ...reporte,
      nombreRepuesto: this.repuestoForm.nombreRepuesto,
      valorRepuesto: this.repuestoForm.valorRepuesto,
      lugarCompra: this.repuestoForm.lugarCompra
    };

    this.reporteService.actualizarReporte(reporte.idReporte, reporteActualizado).subscribe({
      next: () => {
        alert('Repuesto guardado correctamente');
        this.repuestoEditando = null;
        this.cargarReportes();
      },
      error: (error) => {
        console.error('Error al guardar repuesto', error);
      }
    });
  }
}