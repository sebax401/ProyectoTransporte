import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonBackButton,
  IonMenuButton,
  IonButtons
} from '@ionic/angular/standalone';
import { BarralateralComponent } from '../BarraLateral/barralateral.component';
import {
  Empleado,
  EmpleadoService
} from '../services/empleado';

@Component({
  selector: 'app-empleados',
  templateUrl: './empleados.page.html',
  styleUrls: ['./empleados.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonInput,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonBackButton,
    IonMenuButton,
    IonButtons,
    BarralateralComponent
  ]
})
export class EmpleadosPage implements OnInit {

  empleados: Empleado[] = [];
  empleado: Empleado = this.empleadoVacio();

  editando = false;
  fotoPreview: string | null = null;
  fotoBlob: Blob | null = null;

  constructor(
    private empleadoService: EmpleadoService
  ) {}

  ngOnInit() {
    this.cargarEmpleados();
  }

  // Método auxiliar para limpiar formatos ISO (T00:00:00)
  private formatearFechaInput(fecha: string | null | undefined): string | null {
    if (!fecha) return null;
    return fecha.split('T')[0];
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

  empleadoVacio(): Empleado {
    return {
      idEmpleado: 0,
      nombre: '',
      apellido: '',
      rut: '',
      cargo: '',
      tipoContrato: '',
      estado: 'Activo',
      fechaIngreso: new Date().toISOString().split('T')[0],
      fechaTermino: null,
      razonDespido: null,
      observaciones: null,
      fotoUrl: null,
    };
  }

  cargarEmpleados() {
    this.empleadoService.obtenerEmpleados().subscribe({
      next: (data) => {
        // Normalizamos las fechas al cargar la lista
        this.empleados = data.map(e => ({
          ...e,
          fechaIngreso: this.formatearFechaInput(e.fechaIngreso) || '',
          fechaTermino: this.formatearFechaInput(e.fechaTermino)
        }));
      },
      error: (error) => {
        console.error('Error al cargar empleados', error);
      }
    });
  }

  guardarEmpleado() {
    if (
      !this.empleado.nombre ||
      !this.empleado.apellido ||
      !this.empleado.rut ||
      !this.empleado.cargo ||
      !this.empleado.tipoContrato
    ) {
      alert('Complete todos los campos obligatorios');
      return;
    }

    if (this.editando) {
      this.empleadoService
        .modificarEmpleado(this.empleado.idEmpleado, this.empleado)
        .subscribe({
          next: () => {
            if (this.fotoBlob) {
              this.subirFoto(this.empleado.idEmpleado);
            } else {
              alert('Empleado actualizado correctamente');
              this.cancelarEdicion();
              this.cargarEmpleados();
            }
          },
          error: (error) => {
            console.error('Error al modificar empleado', error);
          }
        });
    } else {
      this.empleadoService.crearEmpleado(this.empleado).subscribe({
        next: (empCreado: any) => {
          const id = empCreado?.idEmpleado || empCreado?.id;

          if (this.fotoBlob && id) {
            this.subirFoto(id);
          } else {
            alert('Empleado registrado correctamente');
            this.cancelarEdicion();
            this.cargarEmpleados();
          }
        },
        error: (error) => {
          console.error('Error al registrar empleado', error);
        }
      });
    }
  }

  subirFoto(idEmpleado: number) {
    if (!this.fotoBlob) return;

    this.empleadoService.subirFotoEmpleado(idEmpleado, this.fotoBlob).subscribe({
      next: () => {
        alert('Empleado y foto guardados correctamente');
        this.cancelarEdicion();
        this.cargarEmpleados();
      },
      error: (error: any) => {
        console.error('Error al subir la foto:', error);
        alert('Se guardó el empleado, pero hubo un problema al subir la foto.');
        this.cancelarEdicion();
        this.cargarEmpleados();
      }
    });
  }

  editarEmpleado(empleado: Empleado) {
    // Formateamos las fechas antes de cargarlas en los inputs del formulario
    this.empleado = {
      ...empleado,
      fechaIngreso: this.formatearFechaInput(empleado.fechaIngreso) || '',
      fechaTermino: this.formatearFechaInput(empleado.fechaTermino)
    };

    this.editando = true;
  }

  cancelarEdicion() {
    this.empleado = this.empleadoVacio();
    this.fotoPreview = null;
    this.fotoBlob = null;
    this.editando = false;
  }

  eliminarEmpleado(empleado: Empleado) {
    if (!confirm(`¿Desea eliminar a ${empleado.nombre} ${empleado.apellido}?`)) {
      return;
    }

    this.empleadoService.eliminarEmpleado(empleado.idEmpleado).subscribe({
      next: () => {
        alert('Empleado eliminado');
        this.cargarEmpleados();
      },
      error: (error) => {
        console.error('Error al eliminar empleado', error);
      }
    });
  }
}