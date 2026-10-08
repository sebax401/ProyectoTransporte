import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  constructor(
    private empleadoService: EmpleadoService
  ) {}

  ngOnInit() {
    this.cargarEmpleados();
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
      observaciones: null
    };
  }

  cargarEmpleados() {

    this.empleadoService.obtenerEmpleados()
      .subscribe({
        next: (data) => {
          this.empleados = data;
        },

        error: (error) => {
          console.error(
            'Error al cargar empleados',
            error
          );
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
        .modificarEmpleado(
          this.empleado.idEmpleado,
          this.empleado
        )
        .subscribe({
          next: () => {

            alert('Empleado actualizado correctamente');

            this.cancelarEdicion();

            this.cargarEmpleados();
          },

          error: (error) => {
            console.error(
              'Error al modificar empleado',
              error
            );
          }
        });

    } else {

      this.empleadoService
        .crearEmpleado(this.empleado)
        .subscribe({
          next: () => {

            alert('Empleado registrado correctamente');

            this.empleado = this.empleadoVacio();

            this.cargarEmpleados();
          },

          error: (error) => {
            console.error(
              'Error al registrar empleado',
              error
            );
          }
        });
    }
  }

  editarEmpleado(empleado: Empleado) {

    this.empleado = {
      ...empleado
    };

    this.editando = true;
  }

  cancelarEdicion() {

    this.empleado = this.empleadoVacio();

    this.editando = false;
  }

  eliminarEmpleado(empleado: Empleado) {

    if (
      !confirm(
        `¿Desea eliminar a ${empleado.nombre} ${empleado.apellido}?`
      )
    ) {
      return;
    }

    this.empleadoService
      .eliminarEmpleado(empleado.idEmpleado)
      .subscribe({

        next: () => {

          alert('Empleado eliminado');

          this.cargarEmpleados();
        },

        error: (error) => {

          console.error(
            'Error al eliminar empleado',
            error
          );
        }
      });
  }
}