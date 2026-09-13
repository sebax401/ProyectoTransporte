import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Capacitor } from '@capacitor/core';

export interface Reporte{
  
  idReporte: number;
  tipoReporte: string;
  fechaGeneracion: string;
  descripcion: string;
  idVehiculo: number;

  nombreRepuesto: string;
  valorRepuesto: number | null;
  lugarCompra: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReporteService {

 private apiUrl = 'https://apitransporte.onrender.com/api/Reportes';
    constructor(private http: HttpClient) {
      console.log('API URL usada:', this.apiUrl);
    }

  obtenerReportesVehiculo(idVehiculo: number): Observable<Reporte[]> {
    return this.http.get<Reporte[]>(`${this.apiUrl}/vehiculo/${idVehiculo}`);
  }

  crearReporte(reporte: Reporte): Observable<Reporte> {
    return this.http.post<Reporte>(this.apiUrl, reporte);
  }

  actualizarReporte(id: number, reporte: Reporte): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, reporte);
  }
}
