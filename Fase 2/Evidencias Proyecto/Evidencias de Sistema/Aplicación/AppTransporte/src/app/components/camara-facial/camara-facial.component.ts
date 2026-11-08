import { Component, ElementRef, OnInit, OnDestroy, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-camara-facial',
  templateUrl: './camara-facial.component.html',
  styleUrls: ['./camara-facial.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonButton // Esto elimina el error NG8001 de ion-button
  ]
})
export class CamaraFacialComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
  
  // Eventos para avisarle a la página que llamó al componente
  @Output() onCapture = new EventEmitter<string>();
  @Output() onClose = new EventEmitter<void>();

  private mediaStream: MediaStream | null = null;

  ngOnInit() {
    this.iniciarCamara();
  }

  ngOnDestroy() {
    this.apagarCamara();
  }

  async iniciarCamara() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });

      setTimeout(() => {
        if (this.videoElement && this.videoElement.nativeElement) {
          this.videoElement.nativeElement.srcObject = this.mediaStream;
          this.videoElement.nativeElement.play();
        }
      }, 150);
    } catch (error) {
      console.error('No se pudo acceder a la cámara:', error);
      alert('Verifica los permisos de la cámara en tu navegador.');
      this.cerrar();
    }
  }

capturarRostro() {
    const video = this.videoElement.nativeElement;
    const canvas = document.createElement('canvas');
    
    // 1. Definimos un tamaño de salida estándar y cuadrado (ej. 640x640) para ambos dispositivos
    const outputSize = 840;
    canvas.width = outputSize;
    canvas.height = outputSize;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const vWidth = video.videoWidth;
      const vHeight = video.videoHeight;

      // 2. Calculamos el lado menor para hacer un recorte cuadrado perfecto del centro del video
      // Esto elimina por igual los excesos laterales (en PC) o superiores (en Móvil)
      const squareSize = Math.min(vWidth, vHeight);
      
      const offsetX = (vWidth - squareSize) / 2;
      const offsetY = (vHeight - squareSize) / 2;

      // 3. Dibujamos el recorte cuadrado exacto escalándolo al canvas de 640x640
      ctx.drawImage(
        video, 
        offsetX, offsetY, squareSize, squareSize, // Coordenadas de recorte del video original
        0, 0, outputSize, outputSize             // Coordenadas de destino en el canvas cuadrado
      );
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      this.onCapture.emit(dataUrl);
      this.apagarCamara();
    }
  }

  cerrar() {
    this.apagarCamara();
    this.onClose.emit();
  }

  private apagarCamara() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }
}