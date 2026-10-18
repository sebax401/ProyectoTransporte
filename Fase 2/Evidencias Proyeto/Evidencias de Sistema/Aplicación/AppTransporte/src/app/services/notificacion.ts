import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {

  async solicitarPermisos() {
    await LocalNotifications.requestPermissions();
  }

  async mostrarNotificacion(titulo: string, mensaje: string) {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1,
          title: titulo,
          body: mensaje,
          schedule: { at: new Date(Date.now() + 1000) }
        }
      ]
    });
  }
}