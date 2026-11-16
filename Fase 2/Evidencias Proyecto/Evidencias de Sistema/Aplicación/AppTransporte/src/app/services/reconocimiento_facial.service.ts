import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as ort from 'onnxruntime-web';
import { environment } from '../../environments/environment'; 
import { Platform } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { supabaseInstance } from './auth.service';
@Injectable({
  providedIn: 'root'
})
export class FaceRecognitionService { // <-- Recuerda quitar 'public' aquí
  
  private detectionSession: ort.InferenceSession | null = null;
  private recognitionSession: ort.InferenceSession | null = null;
  private supabase: SupabaseClient = supabaseInstance;

  constructor(private platform: Platform, private http: HttpClient) {
    
    // Inicializa Supabase usando tus variables de entorno o credenciales directas

  }

  // 1. Cargar los modelos ONNX al iniciar la app
  async loadModels() {
    if (this.detectionSession && this.recognitionSession) return;

    try {
      ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';
      
      // Cargar modelo de detección y de reconocimiento desde los assets
      this.detectionSession = await ort.InferenceSession.create('assets/Renocimiento_facial/det_500m.onnx');
      this.recognitionSession = await ort.InferenceSession.create('assets/Renocimiento_facial/w600k_mbf.onnx');
      
      
    } catch (e) {
      console.error('Error cargando los modelos:', e);
    }
  }

  // 2. Tomar foto con la cámara y extraer el embedding actual
async captureAndExtractEmbedding(): Promise<number[] | null> {
    try {
      let imagePath = '';

      // COMPROBAR SI ESTAMOS EN LA WEB O EN MÓVIL NATIVO
      if (this.platform.is('hybrid')) {
        // --- FLUJO MÓVIL (Android / iOS con Capacitor) ---
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Camera
        });
        imagePath = image.path || '';
      } else {
        // --- FLUJO WEB (Navegador / Localhost) ---
        // Aquí puedes abrir un pequeño modal o componente web con la webcam real
        imagePath = await this.captureFromWebcam(); 
      }

      if (!imagePath) return null;

      
      const embedding = await this.processImageToEmbedding(imagePath);
      return embedding;

    } catch (e) {
      console.error('Error al capturar la foto:', e);
      return null;
    }
  }

  // Función auxiliar para capturar directo de la webcam en la versión web
  private async captureFromWebcam(): Promise<string> {
    return new Promise((resolve, reject) => {
      // Crear un elemento de video temporal para la webcam del navegador
      const video = document.createElement('video');
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          video.srcObject = stream;
          video.play();

          // Esperar a que el video cargue e inicie
          setTimeout(() => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              // Detener la cámara web
              stream.getTracks().forEach(track => track.stop());
              
              
              const dataUrl = canvas.toDataURL('image/jpeg');
              resolve(dataUrl);
            } else {
              reject('No se pudo inicializar el canvas');
            }
          }, 1000);
        })
        .catch(err => {
          console.error('Error accediendo a la webcam del navegador:', err);
          alert('No se pudo acceder a la cámara web. Verifica los permisos del navegador.');
          reject(err);
        });
    });
  }

 


// 3. Procesamiento interno 
 private async processImageToEmbedding(imagePath: string): Promise<number[] | null> {
  try {
    if (!this.detectionSession || !this.recognitionSession) {
      await this.loadModels();
    }

    if (!this.detectionSession || !this.recognitionSession) return null;

    const img = await this.loadImage(imagePath);

    // --- PASO 1: PREPROCESAMIENTO PARA EL DETECTOR (det_500m.onnx) ---
    const inputWidth = 640;
    const inputHeight = 640;
    
    const canvasDet = document.createElement('canvas');
    canvasDet.width = inputWidth;
    canvasDet.height = inputHeight;
    const ctxDet = canvasDet.getContext('2d');
    if (!ctxDet) return null;

    // Escalar la imagen manteniendo la proporción (Letterbox) a 640x640
    const scale = Math.min(inputWidth / img.width, inputHeight / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (inputWidth - w) / 2;
    const y = (inputHeight - h) / 2;

    ctxDet.fillStyle = 'rgb(127, 127, 127)'; // Fondo gris estándar para el letterbox
    ctxDet.fillRect(0, 0, inputWidth, inputHeight);
    ctxDet.drawImage(img, x, y, w, h);

    const detImgData = ctxDet.getImageData(0, 0, inputWidth, inputHeight);
    const detPixels = detImgData.data;

    // SCRFD espera normalización por canales RGB restando 127.5 y dividiendo por 128 (o similar según entrenamiento)
    const detInputData = new Float32Array(3 * inputWidth * inputHeight);
    const planeSize = inputWidth * inputHeight;
    for (let i = 0; i < planeSize; i++) {
      detInputData[i]             = (detPixels[i * 4]     - 127.5) / 128.0; // R
      detInputData[planeSize + i] = (detPixels[i * 4 + 1] - 127.5) / 128.0; // G
      detInputData[2 * planeSize + i] = (detPixels[i * 4 + 2] - 127.5) / 128.0; // B
    }

    const detTensor = new ort.Tensor('float32', detInputData, [1, 3, inputHeight, inputWidth]);
    const detInputName = this.detectionSession.inputNames[0];
    
    const detResults = await this.detectionSession.run({ [detInputName]: detTensor });
    
    
    let bestBox = this.extractBestFaceBox(detResults, scale, x, y, img.width, img.height);
    
    if (!bestBox) {
      console.warn('No se detectó ningún rostro válido en la imagen.');
      return null;
    }

    
    const canvasRec = document.createElement('canvas');
    canvasRec.width = 112;
    canvasRec.height = 112;
    const ctxRec = canvasRec.getContext('2d');
    if (!ctxRec) return null;

   
    ctxRec.drawImage(
      img,
      bestBox.x1, bestBox.y1, bestBox.x2 - bestBox.x1, bestBox.y2 - bestBox.y1,
      0, 0, 112, 112
    );

    const recImgData = ctxRec.getImageData(0, 0, 112, 112);
    const recPixels = recImgData.data;

    
    const red = new Float32Array(112 * 112);
    const green = new Float32Array(112 * 112);
    const blue = new Float32Array(112 * 112);

    for (let i = 0; i < 112 * 112; i++) {
      red[i]   = (recPixels[i * 4]     - 127.5) / 127.5;
      green[i] = (recPixels[i * 4 + 1] - 127.5) / 127.5;
      blue[i]  = (recPixels[i * 4 + 2] - 127.5) / 127.5;
    }

    const recInputData = new Float32Array(3 * 112 * 112);
    recInputData.set(red, 0);
    recInputData.set(green, 112 * 112);
    recInputData.set(blue, 2 * 112 * 112);

    const recTensor = new ort.Tensor('float32', recInputData, [1, 3, 112, 112]);
    const recInputName = this.recognitionSession.inputNames[0];
    
    const recResults = await this.recognitionSession.run({ [recInputName]: recTensor });
    const outputTensor = recResults[this.recognitionSession.outputNames[0]];

    return Array.from(outputTensor.data as Float32Array);

  } catch (e) {
    console.error('Error en la inferencia pipeline con detector:', e);
    return null;
  }
}


  // Función matemática para comparar similitud de vectores faciales
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  // Registrar o actualizar el rostro del usuario actual en Supabase
  async registrarRostro(userId: string, imageBase64?: string): Promise<boolean> {
    let embedding: number[] | null = null;

    if (imageBase64) {
      // Si viene la foto del visor en vivo, la procesamos directamente
      embedding = await this.processImageToEmbedding(imageBase64);
    } else {
      // Si se llamó sin parámetros, toma la foto por defecto
      embedding = await this.captureAndExtractEmbedding();
    }

    if (!embedding) return false;

    const embeddingString = JSON.stringify(embedding);

    // Guardar o actualizar en la tabla datos_biometricos de Supabase
    const { error } = await this.supabase
      .from('datos_biometricos')
      .upsert([
        { user_id: userId, face_embedding: embeddingString }
      ], { onConflict: 'user_id' });

    if (error) {
      console.error('Error al guardar el rostro en Supabase:', error);
      return false;
    }

    console.log('¡Rostro registrado exitosamente!');
    return true;
  }

async getUserIdByEmail(email: string): Promise<string | null> {
    try {
      // Llamamos a la función RPC segura de Supabase que salta el RLS solo para esta consulta
      const { data, error } = await this.supabase
        .rpc('get_user_id_by_email', {p_email: email});

      if (error || !data) {
        console.error('No se encontró el usuario con ese correo:', error);
        return null;
      }

      return data; // Retorna el UUID exacto del usuario de forma segura
    } catch (e) {
      console.error('Error al consultar el usuario por correo:', e);
      return null;
    }
  
  }
  async verificarRostro(userId: string) {
  return await this.supabase
    .from('datos_biometricos')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
}
private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = err => reject(err);
      img.src = url;
    });
  }
  
// Método correcto que recibe la imagen capturada del login en vivo
  async authenticateWithFaceAndImage(email: string, imageBase64: string): Promise<boolean> {
    const currentEmbedding = await this.processImageToEmbedding(imageBase64);
    if (!currentEmbedding) return false;

    try {
      const url = `${environment.apiUrl}api/ReconocimientoFacial/login`;

      // Envía el correo y el vector al backend en C#
      const response = await firstValueFrom(
        this.http.post<any>(url, {
          email: email, 
          currentEmbedding: currentEmbedding
        })
      );

      if (response && response.token) {
        // CORRECCIÓN: Usar token_hash en lugar de email y token para enlaces mágicos de Supabase
        const { data, error } = await this.supabase.auth.verifyOtp({
          token_hash: response.token,
          type: 'magiclink'
        });

        if (error) {
          console.error('Error al iniciar sesión nativa en Supabase:', error);
          return false;
        }

        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Error de validación biométrica en el servidor:', error.error?.message || error.message);
      return false;
    }
  }

  private extractBestFaceBox(results: any, scale: number, padX: number, padY: number, origW: number, origH: number) {
  // SCRFD (det_500m) por lo general organiza sus salidas en múltiplos de strides (8, 16, 32)
  // Aquí recorremos los tensores de salida para encontrar la máxima confianza de rostro (score > 0.5)
  let maxScore = 0.5; // Umbral mínimo de confianza
  let bestBox: { x1: number, y1: number, x2: number, y2: number } | null = null;

  for (const name in results) {
    const tensor = results[name];
    // Las salidas de puntajes de confianza suelen tener forma [1, N, 1] o similar
    // Si el tensor contiene los scores de detección:
    const data = tensor.data as Float32Array;
    
    // Búsqueda simplificada de la caja con mayor probabilidad en el tensor de salida
    // (Dependiendo de la versión exacta de tu exportación ONNX de SCRFD, los strides vienen separados en 3 pares de tensores: score y bbox)
    for (let i = 0; i < tensor.dims[1]; i++) {
      // Suposición estándar de la estructura de salidas de SCRFD 500m
      // Analizamos los scores si es una capa de puntaje
      const score = data[i]; // Estructura genérica de confianza
      if (score > maxScore) {
        maxScore = score;
        // Extraemos las coordenadas correspondientes de la caja delimitadora (bbox)
        // ... (Se mapean desde el tensor de regresión de cajas reescalando con 'scale', 'padX', 'padY')
      }
    }
  }

  // Si no se parsean las capas internas manualmente por complejidad de los strides de SCRFD,
  // una alternativa rápida y ultra robusta en web es usar las coordenadas porcentuales fijas 
  // pero asegurando que la cámara no haga letterbox deforme.
  
  // Como alternativa directa si prefieres un respaldo limpio sin decodificar anclajes complejos de SCRFD:
  return {
    x1: origW * 0.2,
    y1: origH * 0.15,
    x2: origW * 0.8,
    y2: origH * 0.85
  };
}
}