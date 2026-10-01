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
  LoadingController 
} from '@ionic/angular/standalone'; 
import { AuthService } from '../services/auth.service';

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
    IonButton 
  ]
})
export class LoginPage {
  email: string = '';
  password: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

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
      this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (error: any) {
      await loading.dismiss();
      this.showToast(error.message || 'Error al iniciar sesión.');
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