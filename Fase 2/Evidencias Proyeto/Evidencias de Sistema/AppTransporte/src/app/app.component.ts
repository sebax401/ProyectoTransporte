import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet,   IonButtons, IonContent, IonHeader, IonMenu, IonMenuButton, IonTitle, IonToolbar, IonItem, IonList} from '@ionic/angular/standalone';

import {RouterLink} from '@angular/router';
import { BarralateralComponent } from './BarraLateral/barralateral.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, IonButtons, IonContent, IonHeader, IonMenu, IonMenuButton, IonTitle, IonToolbar, IonItem, IonList , RouterLink, BarralateralComponent ],
})
export class AppComponent {
  constructor() {}
}
