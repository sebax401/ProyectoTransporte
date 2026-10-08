import { Component, OnInit } from '@angular/core';
import { 
  IonContent, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, 
  IonTitle, IonMenuButton, IonButton, IonButtons, IonToolbar, IonHeader, IonSearchbar, 
  IonRefresher, IonRefresherContent, IonChip, IonLabel, IonIcon ,IonFab, IonFabButton, IonText
} from '@ionic/angular/standalone';


import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule, NgFor } from '@angular/common';

import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { cartOutline, addCircleOutline } from 'ionicons/icons';

import { VehiculoService, Vehiculo } from '../../services/vehiculo';
import { NotificacionService } from '../../services/notificacion';
import { BarralateralComponent } from '../../BarraLateral/barralateral.component';

@Component({
  selector: 'app-ver-vehiculo', 
  templateUrl: './Ver-vehiculo.page.html',
  styleUrls: ['./Ver-vehiculo.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, 
    IonTitle, IonMenuButton, IonButton, IonButtons, IonToolbar, IonHeader, IonSearchbar, 
    IonRefresher, IonRefresherContent, IonChip, IonLabel, IonIcon,
    RouterLink, CommonModule, NgFor, BarralateralComponent, IonFab, IonFabButton, IonText
    
  ]
})
export class VerVehiculoPage implements OnInit {

  handleRefresh(event: any) {
    this.cargarVehiculos();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
  
  vehiculos: Vehiculo[] = [];
  results: Vehiculo[] = [];

  ionViewWillEnter() {
    this.cargarVehiculos();
  }

  constructor(
    private vehiculoService: VehiculoService, 
    private notificacionService: NotificacionService,
    private route: ActivatedRoute
  ) {
    addIcons({ cartOutline, addCircleOutline });
  }

  async ngOnInit() {
    await this.notificacionService.solicitarPermisos();

    this.route.queryParams.subscribe(() => {
      this.cargarVehiculos();
    });
  }

  fechaVencida(fecha?: string | Date | null): boolean {
    if (!fecha) return false;

    const hoy = new Date();
    const fechaRevision = new Date(fecha);

    hoy.setHours(0, 0, 0, 0);
    fechaRevision.setHours(0, 0, 0, 0);

    return fechaRevision < hoy;
  }

  cargarVehiculos() {
    this.vehiculoService.obtenerVehiculos().subscribe({
      next: (data) => {
        console.log('Vehículos Android:', data);

        data.forEach(v => {
          console.log(
            'ID:',
            v.idVehiculo,
            '| Patente:',
            v.patente,
            '| Foto:',
            v.fotoUrl
          );
        });

        this.vehiculos = data;
        this.results = data;

        this.vehiculos.forEach(v => {
          if (this.fechaVencida(v.fechaRevisionTecnica)) {
            this.notificacionService.mostrarNotificacion(
              'Revisión técnica vencida',
              `El vehículo ${v.patente} tiene la revisión técnica vencida`
            );
          }
        });
      },
      error: (error) => {
        console.error('Error Android:', error);
      }
    });
  }

  handleInput(event: Event) {
    const target = event.target as HTMLIonSearchbarElement;
    const query = target.value?.toLowerCase() || '';

    this.results = this.vehiculos.filter(v =>
      v.patente.toLowerCase().includes(query)
    );
  }
}