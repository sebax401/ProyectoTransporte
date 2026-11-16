import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Capacitor } from '@capacitor/core';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';


export interface Reporte {
  idReporte: number;
  tipoReporte: string;
  subTipoReporte: string;
  fechaGeneracion: string;
  descripcion: string;
  idVehiculo: number;
  estado?: string;
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
      
    }

    private async getAuthHeaders(): Promise<HttpHeaders> {
    const session = await this.authService.getSession();
    const token = session?.access_token || '';

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }
  obtenerReportesVehiculos(): Observable<Reporte[]> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => this.http.get<Reporte[]>(this.apiUrl, { headers }))
    );
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

  actualizarEstadoReporte(id: number, estado: string): Observable<any> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers =>
        this.http.patch(
          `${this.apiUrl}/${id}/estado`,
          JSON.stringify(estado),
          {
            headers: headers.set('Content-Type', 'application/json')
          }
        )
      )
    );
  }
  actualizarReporte(id: number, reporte: Reporte): Observable<any> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers =>
        this.http.put<any>(`${this.apiUrl}/${id}`, reporte, { headers })
      )
    );
  }
}
