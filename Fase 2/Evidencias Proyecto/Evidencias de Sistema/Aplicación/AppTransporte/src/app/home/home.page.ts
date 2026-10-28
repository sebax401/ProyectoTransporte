import { Component, OnInit } from '@angular/core';
import { 
  IonContent, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, 
  IonTitle, IonMenuButton, IonButton, IonButtons, IonToolbar, IonHeader, IonSearchbar, 
  IonRefresher, IonRefresherContent, IonChip, IonLabel, IonIcon, IonGrid, IonRow, IonCol, IonItem, IonAvatar, IonList, IonMenuToggle, IonFooter, IonText
} from '@ionic/angular/standalone';

import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { BarralateralComponent } from '../BarraLateral/barralateral.component';


@Component({
  selector: 'app-home',
  templateUrl: './Home.page.html',
  styleUrls: ['./Home.page.scss'],
  standalone: true,
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonTitle,
    IonMenuButton,
    IonContent,
    BarralateralComponent,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
  ]
})
export class HomePage {
  totalVehiculos = 0;
  vehiculosOperativos = 0;
  mantenimientosPendientes = 0;
  totalEmpleados = 0;

  constructor(
    private router: Router,
    private authService: AuthService,
  ) { }

   async logout() {
    try {
      await this.authService.logout(); 
      this.router.navigateByUrl('/login', { replaceUrl: true }); 
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}