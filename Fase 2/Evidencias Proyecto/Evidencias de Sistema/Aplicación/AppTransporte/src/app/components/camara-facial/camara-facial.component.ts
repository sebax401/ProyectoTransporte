import { Component, ElementRef, OnInit, ViewChild, Output, EventEmitter, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-camara-facial',
  templateUrl: './camara-facial.component.html',
  styleUrls: ['./camara-facial.component.scss'],
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
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // Enviamos la imagen capturada al componente padre
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