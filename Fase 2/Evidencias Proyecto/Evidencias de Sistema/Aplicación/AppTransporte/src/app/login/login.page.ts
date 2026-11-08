import { Component } from '@angular/core';
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
import { cameraOutline, checkmarkCircleOutline, warningOutline,refreshOutline} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { FaceRecognitionService } from '../services/reconocimiento_facial.service';
import { CamaraFacialComponent } from '../components/camara-facial/camara-facial.component'; // Importación de tu componente de cámara

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
    IonIcon,
    CamaraFacialComponent // Registrado para usar <app-camara-facial> en el HTML
  ] 
})
export class LoginPage {
  email: string = '';
  password: string = '';

  // Variable de control para mostrar la cámara a pantalla completa
  showCamera: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private faceService: FaceRecognitionService,
  ) {
    addIcons({ cameraOutline, checkmarkCircleOutline, warningOutline,refreshOutline });
  }

  async ngOnInit() {
    
    await this.faceService.loadModels();
  }

  // 1. Login por contraseña tradicional
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

  // 2. Valida que el correo exista antes de abrir la cámara de pantalla completa
  iniciarVistaPreviaCamara() {
    if (!this.email) {
      this.showToast('Por favor, ingresa tu correo primero para identificar tu cuenta.');
      return;
    }
    // Muestra el componente de la cámara a pantalla completa con el óvalo guía
    this.showCamera = true;
  }

  // 3. Recibe la foto en Base64 devuelta por el componente <app-camara-facial>
  async procesarFotoCapturada(imageBase64: string) {
    this.showCamera = false; // Cierra la cámara

    if (!imageBase64) {
      this.showToast('No se pudo capturar la imagen.');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Verificando rostro...' });
    await loading.present();

    try {
      // Validar que el usuario exista en Supabase
      const userId = await this.faceService.getUserIdByEmail(this.email);

      if (!userId) {
        await loading.dismiss();
        this.showToast('No se encontró un usuario asociado a este correo.');
        return;
      }

      // Ejecutar autenticación facial enviando el correo y la imagen capturada
      const success = await this.faceService.authenticateWithFaceAndImage(this.email, imageBase64);
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