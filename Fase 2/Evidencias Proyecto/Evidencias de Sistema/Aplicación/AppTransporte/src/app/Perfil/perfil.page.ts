import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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
    CommonModule
  ]
})
export class PerfilPage implements OnInit {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
  
  showCamera: boolean = false;
  tieneRostro: boolean = false;
  private mediaStream: MediaStream | null = null;

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

  // Iniciar la vista previa de la cámara en vivo (Feedback visual)
  async iniciarVistaPreviaCamara() {
    this.showCamera = true;
    
    setTimeout(async () => {
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480, facingMode: 'user' } 
        });
        
        if (this.videoElement && this.videoElement.nativeElement) {
          this.videoElement.nativeElement.srcObject = this.mediaStream;
        }
      } catch (error) {
        console.error('No se pudo acceder a la cámara:', error);
        this.showCamera = false;
        this.showToast('No se pudo acceder a la cámara web.', 'danger');
      }
    }, 300);
  }

  // Capturar imagen desde el elemento video
  async captureImageFromStream() {
    if (!this.videoElement) return;

    const video = this.videoElement.nativeElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');

      // Apagar la cámara
      this.stopCamera();

      // Guardar el rostro capturado
      await this.guardarNuevoRostro(dataUrl);
    }
  }

  // Detener el streaming de la cámara
  stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.showCamera = false;
  }

  // Guardar el nuevo rostro procesado
  async guardarNuevoRostro(imageBase64: string) {
    const loading = await this.loadingCtrl.create({ message: 'Procesando biometría y guardando...' });
    await loading.present();

    try {
      // Pasamos el base64 para que use la foto exacta que el usuario vio en pantalla
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