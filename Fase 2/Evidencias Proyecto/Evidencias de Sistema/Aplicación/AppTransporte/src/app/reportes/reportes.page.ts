import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonLabel, IonItem, IonCard, IonCardContent, IonCardTitle, 
        IonCardHeader, IonAccordion, IonAccordionGroup, IonInput, IonSelect, IonSelectOption, IonButtons, IonBackButton } from '@ionic/angular/standalone';
import { Reporte, ReporteService } from '../services/reporte';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.page.html',
  styleUrls: ['./reportes.page.scss'],
  standalone: true,
  imports: [  IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButton, IonLabel, IonItem,
  IonInput, IonCard, IonCardContent, IonCardTitle, IonCardHeader, IonAccordion, IonAccordionGroup, IonSelect, IonSelectOption, IonButtons, IonBackButton,
  RouterLink ]
})

export class ReportesPage implements OnInit {
  
  private apiUrl = 'https://proyectotransporte.onrender.com/api/Reportes';

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

  constructor(  private reporteService: ReporteService, private route: ActivatedRoute, private authService: AuthService,private router: Router,) { 
  }

  repuestoEditando: number | null = null;

  repuestoForm = {
    nombreRepuesto: '',
    valorRepuesto: null as number | null,
    lugarCompra: ''
  };

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.reporteService.obtenerReportesVehiculo(id).subscribe({
      next: (data) => {
        this.reportes = data;
      },
      error: (error) => {
        console.error('Error al cargar reportes', error);
      }
    });
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
  }

  async generarReporte() {
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
      subTipoReporte : this.reporte.subTipoReporte,
      fechaGeneracion: '',
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
  async logout() {
    try {
      await this.authService.logout(); 
      this.router.navigateByUrl('/login', { replaceUrl: true }); 
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}
