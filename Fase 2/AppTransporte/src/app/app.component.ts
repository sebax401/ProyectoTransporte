import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet,   IonButtons, IonContent, IonHeader, IonMenu, IonMenuButton, IonTitle, IonToolbar, IonItem, IonList} from '@ionic/angular/standalone';

import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, IonButtons, IonContent, IonHeader, IonMenu, IonMenuButton, IonTitle, IonToolbar, IonItem, IonList , RouterLink ],
})
export class AppComponent {
  constructor() {}
}
