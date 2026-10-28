import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonList, IonItem, IonLabel, IonBadge, IonButton
} from '@ionic/angular/standalone';
import { ReporteConVehiculo } from '../reportesvehiculos.page';

@Component({
  selector: 'app-detallereporte',
  templateUrl: './detallereporte.page.html',
  
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonBackButton, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
    IonCardContent, IonList, IonItem, IonLabel, IonBadge, IonButton
  ]
})
export class DetalleReportePage implements OnInit {
  reporte: ReporteConVehiculo | null = null;

  constructor(private router: Router) {}

  ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras?.state?.['reporte']) {
      this.reporte = nav.extras.state['reporte'];
    }
  }

  volver() {
    this.router.navigate(['/ReportesVehiculos']);
  }
}