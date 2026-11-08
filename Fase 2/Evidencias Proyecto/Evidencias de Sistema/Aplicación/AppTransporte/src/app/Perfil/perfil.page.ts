import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonTitle,
  IonMenuButton,
  IonButtons,
  IonToolbar,
  IonHeader,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  ToastController,
  LoadingController,
} from '@ionic/angular/standalone';

import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FaceRecognitionService } from '../services/reconocimiento_facial.service';
import { CamaraFacialComponent } from '../components/camara-facial/camara-facial.component'; // Importa el componente de cámara

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  standalone: true,
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonTitle,
    IonMenuButton,
    IonContent,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    FormsModule,
    CommonModule,
    CamaraFacialComponent // Registrado aquí para usar <app-camara-facial> en el HTML del perfil
  ]
})
export class PerfilPage implements OnInit {
  // Variable de control para mostrar u ocultar la cámara a pantalla completa
  showCamera: boolean = false;
  tieneRostro: boolean = false;

  userEmail: string = '';
  userId: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private faceService: FaceRecognitionService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  async ngOnInit() {
    await this.loadUserData();
    await this.checkBiometricStatus();
  }

  // Obtener datos del usuario actual
  async loadUserData() {
    try {
      const user = await this.authService.getUser();
      if (user) {
        this.userEmail = user.email || '';
        this.userId = user.id || '';
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
    }
  }

  // Verificar si ya tiene rostro registrado en Supabase
  async checkBiometricStatus() {
    if (!this.userId) return;

    try {
      const { data, error } = await this.faceService.verificarRostro(this.userId);
      this.tieneRostro = !!data;
    } catch (e) {
      console.error('Error al verificar biometría:', e);
    }
  }

  // Cambiar contraseña
  async updatePassword() {
    if (!this.newPassword || this.newPassword.length < 6) {
      this.showToast('La contraseña debe tener al menos 6 caracteres.', 'danger');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.showToast('Las contraseñas no coinciden.', 'danger');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Actualizando contraseña...' });
    await loading.present();

    try {
      await this.authService.updatePassword(this.newPassword);
      await loading.dismiss();
      this.showToast('¡Contraseña actualizada con éxito!', 'success');
      this.newPassword = '';
      this.confirmPassword = '';
    } catch (error: any) {
      await loading.dismiss();
      this.showToast(error.message || 'Error al actualizar la contraseña.', 'danger');
    }
  }

  // Activa el componente de la cámara a pantalla completa para registro/actualización facial
  iniciarVistaPreviaCamara() {
    if (!this.userId) {
      this.showToast('No se ha identificado el ID del usuario.', 'danger');
      return;
    }
    this.showCamera = true;
  }

  // Recibe la foto en base64 enviada por el componente <app-camara-facial> al hacer click en capturar
  async procesarFotoCapturada(imageBase64: string) {
    this.showCamera = false; // Cierra la cámara

    if (!imageBase64) {
      this.showToast('No se pudo capturar la imagen.', 'danger');
      return;
    }

    await this.guardarNuevoRostro(imageBase64);
  }

  // Guardar el nuevo rostro procesado en Supabase
  async guardarNuevoRostro(imageBase64: string) {
    const loading = await this.loadingCtrl.create({ message: 'Procesando biometría y guardando...' });
    await loading.present();

    try {
      // Pasamos el base64 de la foto exacta tomada dentro del óvalo guía
      const exito = await this.faceService.registrarRostro(this.userId, imageBase64);
      await loading.dismiss();

      if (exito) {
        this.tieneRostro = true;
        this.showToast('¡Rostro guardado con éxito!', 'success');
      } else {
        this.showToast('Error al registrar el rostro.', 'danger');
      }
    } catch (e) {
      await loading.dismiss();
      this.showToast('Ocurrió un error inesperado.', 'danger');
    }
  }

  // Cerrar sesión
  async logout() {
    try {
      await this.authService.logout();
      this.router.navigateByUrl('/login', { replaceUrl: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color
    });
    toast.present();
  }
}