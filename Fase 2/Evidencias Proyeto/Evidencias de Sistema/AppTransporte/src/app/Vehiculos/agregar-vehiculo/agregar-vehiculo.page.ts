import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem,
  IonLabel, IonInput, IonButton, IonButtons, IonBackButton, IonSelect, IonSelectOption, IonDatetime
} from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { VehiculoService, Vehiculo } from '../../services/vehiculo';

@Component({
  selector: 'app-agregar-vehiculo',
  templateUrl: './agregar-vehiculo.page.html',
  styleUrls: ['./agregar-vehiculo.page.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonItem,
    IonLabel, IonInput, IonButton, IonButtons, IonBackButton, IonSelect, IonSelectOption, IonDatetime, CommonModule
  ]
})
export class AgregarVehiculoPage {

  fotoPreview: string | null = null;
  fotoBlob: Blob | null = null;

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
    estado: true,
    fotoUrl: null,
  };

  constructor(
    private vehiculoService: VehiculoService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
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

  async tomarFoto() {
    try {
      const foto = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });

      if (foto.webPath) {
        this.fotoPreview = foto.webPath;

        const respuesta = await fetch(foto.webPath);
        this.fotoBlob = await respuesta.blob();

        console.log('Foto preparada:', this.fotoBlob);
      }

    } catch (error) {
      console.error('Error al tomar la foto:', error);
    }
  }

  async guardarVehiculo() {
    this.actualizarEstadoRevision();
    
    const session = await this.authService.getSession();
    const token = session?.access_token;

    if (!token) {
      alert("No hay un token activo. Por favor vuelve a iniciar sesión.");
      return;
    }

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
      next: (vehiculoCreado) => {
        console.log('Vehículo creado:', vehiculoCreado);

        if (this.fotoBlob) {
          console.log('Subiendo foto del vehículo...');

          this.vehiculoService
            .subirFotoVehiculo(vehiculoCreado.idVehiculo, this.fotoBlob)
            .subscribe({
              next: (respuesta) => {
                console.log('Foto subida correctamente:', respuesta);
                alert('Vehículo y foto agregados correctamente');

                this.router.navigate(['/ListarVehiculos'], {
                  queryParams: { refresh: new Date().getTime() }
                });
              },
              error: (error) => {
                console.error('Error al subir la foto:', error);
                alert('El vehículo fue creado, pero hubo un error al subir la foto.');

                this.router.navigate(['/ListarVehiculos'], {
                  queryParams: { refresh: new Date().getTime() }
                });
              }
            });

        } else {
          alert('Vehículo agregado correctamente');
          this.router.navigate(['/ListarVehiculos'], {
            queryParams: { refresh: new Date().getTime() }
          });
        }
      },
      error: (error) => {
        console.error('Error completo:', error);
        console.error('Detalle:', error.error);
        alert(JSON.stringify(error.error));
      }
    });
  }
}