import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonItem, 
  IonLabel, 
  IonInput, 
  IonButton,
  ToastController, 
  LoadingController,
  IonCardContent,
  IonCardTitle,
  IonCardHeader,
  IonCard,
  IonGrid, 
  IonRow, 
  IonCol,
  IonIcon
} from '@ionic/angular/standalone'; 
import { addIcons } from 'ionicons';
import { cameraOutline, checkmarkCircleOutline, warningOutline } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { FaceRecognitionService } from '../services/reconocimiento_facial.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  standalone: true, 
  imports: [
    CommonModule,
    FormsModule, 
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonCardContent,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonGrid, 
    IonRow, 
    IonCol,
    IonIcon
  ] 
})
export class LoginPage {
  email: string = '';
  password: string = '';

  // Variables para la cámara en vivo
  showCamera: boolean = false;
  mediaStream: MediaStream | null = null;
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private faceService: FaceRecognitionService,
  ) {
    addIcons({ cameraOutline, checkmarkCircleOutline, warningOutline });
  }

  async ngOnInit() {
    // Cargar los modelos ONNX en segundo plano al abrir el login
    await this.faceService.loadModels();
  }

  // 1. Login tradicional por contraseña
  async onLogin() {
    if (!this.email || !this.password) {
      this.showToast('Por favor, completa todos los campos.');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Ingresando...' });
    await loading.present();

    try {
      await this.authService.login(this.email, this.password);
      await loading.dismiss();
      this.router.navigateByUrl('/Home', { replaceUrl: true });
    } catch (error: any) {
      await loading.dismiss();
      this.showToast(error.message || 'Error al iniciar sesión.');
    }
  }

  // 2. Iniciar la vista previa de la cámara para el reconocimiento facial
  async iniciarVistaPreviaCamara() {
    if (!this.email) {
      this.showToast('Por favor, ingresa tu correo primero para identificar tu cuenta.');
      return;
    }

    this.showCamera = true;
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
      this.showToast('No se pudo acceder a la cámara web. Revisa los permisos.');
    }
  }

  // 3. Apagar la cámara y limpiar recursos
  stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.showCamera = false;
  }

  // 4. Capturar el fotograma del video en vivo y ejecutar la autenticación biométrica
  async onLoginWithFace() {
    if (!this.email) {
      this.showToast('Por favor, ingresa tu correo primero para identificar tu cuenta.');
      return;
    }

    if (!this.videoElement) {
      this.showToast('La cámara no está activa.');
      return;
    }

    const video = this.videoElement.nativeElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      this.showToast('Error al inicializar el procesador de imagen.');
      return;
    }

    // Dibujar el fotograma actual en el canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageBase64 = canvas.toDataURL('image/jpeg');

    // Apagar la cámara tras capturar
    this.stopCamera();

    const loading = await this.loadingCtrl.create({ message: 'Verificando rostro...' });
    await loading.present();

    try {
      // 1. Obtener el ID del usuario en Supabase a partir de su correo
      const userId = await this.faceService.getUserIdByEmail(this.email);

      if (!userId) {
        await loading.dismiss();
        this.showToast('No se encontró un usuario asociado o no tiene biometría.');
        return;
      }

      // 2. Ejecutar autenticación facial enviando el base64 capturado en vivo
      const success = await this.faceService.authenticateWithFaceAndImage(userId, imageBase64);
      await loading.dismiss();

      if (success) {
        this.showToast('¡Rostro reconocido con éxito!');
        this.router.navigateByUrl('/Home', { replaceUrl: true });
      } else {
        this.showToast('El rostro no coincide con nuestros registros.');
      }
    } catch (error: any) {
      await loading.dismiss();
      console.error(error);
      this.showToast('Error en el reconocimiento facial.');
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    toast.present();
  }
}