import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, 
  IonTitle, IonMenuButton, IonButton, IonButtons, IonToolbar, IonHeader, IonLabel, IonItem, IonInput, IonAccordion, IonAccordionGroup,
  IonSelect, IonSelectOption, IonBackButton, IonChip, IonIcon 
} from '@ionic/angular/standalone';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { addIcons } from 'ionicons';
import { trashBinOutline } from 'ionicons/icons';

import { VehiculoService, Vehiculo } from '../../services/vehiculo';

@Component({
  selector: 'app-datos-vehiculo',
  templateUrl: './datos-vehiculo.page.html',
  styleUrls: ['./datos-vehiculo.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonTitle, 
    IonMenuButton, IonButton, IonButtons, IonToolbar, IonHeader, IonLabel, CommonModule, FormsModule, RouterLink, IonItem, IonInput, 
    IonAccordion, IonAccordionGroup, IonSelect, IonSelectOption, IonBackButton, IonIcon, IonChip 
  ]
})
export class DatosVehiculoPage implements OnInit {

  vehiculo?: Vehiculo;
  vehiculos: Vehiculo[] = [];
  results: Vehiculo[] = [];

  constructor(
    private vehiculoService: VehiculoService, 
    private route: ActivatedRoute,
    private router: Router
  ) {
    addIcons({ trashBinOutline });
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
}