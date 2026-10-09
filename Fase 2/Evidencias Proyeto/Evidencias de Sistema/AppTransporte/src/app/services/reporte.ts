import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Capacitor } from '@capacitor/core';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';


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

 private apiUrl = `${environment.apiUrl}api/reportes`;
    constructor(private http: HttpClient, private authService: AuthService ) {
      console.log('API URL usada:', this.apiUrl);
    }

    private async getAuthHeaders(): Promise<HttpHeaders> {
    const session = await this.authService.getSession();
    const token = session?.access_token || '';

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }
    

  obtenerReportesVehiculo(idVehiculo: number): Observable<Reporte[]> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => this.http.get<Reporte[]>(`${this.apiUrl}/vehiculo/${idVehiculo}`, { headers }))
    );
  }

  crearReporte(reporte: Reporte): Observable<Reporte> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => this.http.post<Reporte>(this.apiUrl, reporte, { headers }))
    );
  }

  actualizarReporte(id: number, reporte: Reporte): Observable<void> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => this.http.put<void>(`${this.apiUrl}/${id}`, reporte, { headers }))
    );
  }
}
