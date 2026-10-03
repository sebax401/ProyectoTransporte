import { Component, ViewEncapsulation  } from '@angular/core';
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem,
  IonLabel, IonInput, IonButton, IonButtons, IonBackButton, IonSelect, IonSelectOption, IonDatetime
} from '@ionic/angular/standalone';

import { VehiculoService, Vehiculo } from '../services/vehiculo';

import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-agregar-vehiculo',
  templateUrl: './agregar-vehiculo.page.html',
  styleUrls: ['./agregar-vehiculo.page.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonItem,
    IonLabel, IonInput, IonButton, IonButtons, IonBackButton, IonSelect, IonSelectOption, IonDatetime, CommonModule ]
})
export class AgregarVehiculoPage {
  

  vehiculo: Vehiculo = {
    idVehiculo: null as any,
    patente: '',
    marca: '',
    modelo: '',
    anio: 2026,
    proximoKilometraje: 0,
    fechaRevisionTecnica: null,
    fechaUltimaMantencion: null,
    fechaProximaMantencion: null,
    estadoDpf: '',
    estadoRevision: '',
    estadoExtintor: '',
    observacion: '',
    idConductor: 0,
    estado: true
  };

  constructor(
    private vehiculoService: VehiculoService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  actualizarEstadoRevision() {
    if (!this.vehiculo.fechaRevisionTecnica) return;

    const hoy = new Date();
    const fechaRevision = new Date(this.vehiculo.fechaRevisionTecnica);

    hoy.setHours(0, 0, 0, 0);
    fechaRevision.setHours(0, 0, 0, 0);

    this.vehiculo.estadoRevision =
      fechaRevision >= hoy ? 'Vigente' : 'Vencido';
  }

  guardarVehiculo() {
    this.actualizarEstadoRevision();

    const vehiculoEnviar = {
      ...this.vehiculo,
      idVehiculo: 0,
      anio: Number(this.vehiculo.anio),
      proximoKilometraje: Number(this.vehiculo.proximoKilometraje),
      idConductor: null,
      estado: true
    };

    console.log('Enviando vehículo:', vehiculoEnviar);

    this.vehiculoService.agregarVehiculo(vehiculoEnviar).subscribe({
      next: () => {
        alert('Vehículo agregado correctamente');
        this.router.navigate(['/home'], {
          queryParams: { refresh: new Date().getTime() }
        });
      },
      error: (error) => {
        console.error('Error completo:', error);
        console.error('Detalle:', error.error);
        alert(JSON.stringify(error.error));
      }
    });
  }
  
}