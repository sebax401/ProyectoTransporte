import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as ort from 'onnxruntime-web';
import { environment } from '../../environments/environment'; 
import { Platform } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class FaceRecognitionService { // <-- Recuerda quitar 'public' aquí
  private supabase: SupabaseClient;
  private detectionSession: ort.InferenceSession | null = null;
  private recognitionSession: ort.InferenceSession | null = null;

  constructor(private platform: Platform, private http: HttpClient) {
    
    // Inicializa Supabase usando tus variables de entorno o credenciales directas
    this.supabase = createClient(environment.SUPABASE_URL, environment.SUPABASE_PUBLISHABLE_KEY);
  }

  // 1. Cargar los modelos ONNX al iniciar la app
  async loadModels() {
    if (this.detectionSession && this.recognitionSession) return;

    try {
      ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';
      
      // Cargar modelo de detección y de reconocimiento desde los assets
      this.detectionSession = await ort.InferenceSession.create('assets/Renocimiento_facial/det_500m.onnx');
      this.recognitionSession = await ort.InferenceSession.create('assets/Renocimiento_facial/w600k_mbf.onnx');
      
      console.log('Modelos ONNX cargados correctamente');
    } catch (e) {
      console.error('Error cargando los modelos ONNX:', e);
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

      // Procesar con los modelos ONNX (det_500m.onnx y w600k_mbf.onnx)
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
              
              // Convertir a base64 / DataUrl para que ONNX lo pueda leer
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

 


// 3. Procesamiento interno estable usando w600k_mbf.onnx con recorte normalizado
  private async processImageToEmbedding(imagePath: string): Promise<number[] | null> {
    try {
      if (!this.recognitionSession) {
        await this.loadModels();
      }

      const session = this.recognitionSession;
      if (!session) return null;

      const img = await this.loadImage(imagePath);

      const canvas = document.createElement('canvas');
      canvas.width = 112;
      canvas.height = 112;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Recorte centrado estandarizado (ocupa el 70% central de la imagen de la cámara)
      const size = Math.floor(Math.min(img.width, img.height) * 0.70);
      const startX = (img.width - size) / 2;
      const startY = (img.height - size) / 2.2; // Ligeramente elevado hacia la zona de los ojos

      ctx.drawImage(img, startX, startY, size, size, 0, 0, 112, 112);

      const imgData = ctx.getImageData(0, 0, 112, 112);
      const pixels = imgData.data;

      const red = new Float32Array(112 * 112);
      const green = new Float32Array(112 * 112);
      const blue = new Float32Array(112 * 112);

      for (let i = 0; i < pixels.length / 4; i++) {
        red[i]   = (pixels[i * 4]     - 127.5) / 127.5;
        green[i] = (pixels[i * 4 + 1] - 127.5) / 127.5;
        blue[i]  = (pixels[i * 4 + 2] - 127.5) / 127.5;
      }

      const inputData = new Float32Array(3 * 112 * 112);
      inputData.set(red, 0);
      inputData.set(green, 112 * 112);
      inputData.set(blue, 2 * 112 * 112);

      const tensor = new ort.Tensor('float32', inputData, [1, 3, 112, 112]);

      const inputName = session.inputNames[0];
      const feeds: Record<string, ort.Tensor> = {};
      feeds[inputName] = tensor;

      const results = await session.run(feeds);
      const outputName = session.outputNames[0];
      const outputTensor = results[outputName];

      return Array.from(outputTensor.data as Float32Array);

    } catch (e) {
      console.error('Error en la inferencia de ONNX:', e);
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

        console.log('Sesión de Supabase iniciada correctamente. Similitud:', response.similarity);
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Error de validación biométrica en el servidor:', error.error?.message || error.message);
      return false;
    }
  }
}