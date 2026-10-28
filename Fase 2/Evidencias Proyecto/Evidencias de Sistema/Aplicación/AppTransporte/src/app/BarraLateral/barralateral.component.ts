import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { 
  IonMenu, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonList, 
  IonItem,
  MenuController,
  IonLabel,
  IonMenuToggle
} from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-barralateral',
  templateUrl: './barralateral.component.html',
  standalone: true,
  imports: [
    IonMenu, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonList, 
    IonItem,
    RouterLink,
    IonLabel,
    IonMenuToggle
  ]
})
export class BarralateralComponent {

  constructor(
    private authService: AuthService,
    private router: Router,
    private menuCtrl: MenuController
  ) {}

  async logout() {
    try {
      await this.menuCtrl.close(); // Cierra el menú lateral desplegado
      await this.authService.logout(); // Llama a supabase.auth.signOut()
      this.router.navigateByUrl('/login', { replaceUrl: true }); // Redirige al Login
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}