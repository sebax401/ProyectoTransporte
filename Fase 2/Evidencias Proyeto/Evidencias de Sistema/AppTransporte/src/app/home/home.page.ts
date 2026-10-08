import { Component, OnInit } from '@angular/core';
import { 
  IonContent, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, 
  IonTitle, IonMenuButton, IonButton, IonButtons, IonToolbar, IonHeader, IonSearchbar, 
  IonRefresher, IonRefresherContent, IonChip, IonLabel, IonIcon 
} from '@ionic/angular/standalone';

import { RouterLink, ActivatedRoute } from '@angular/router';

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
    IonIcon
  ]
})
export class HomePage {}