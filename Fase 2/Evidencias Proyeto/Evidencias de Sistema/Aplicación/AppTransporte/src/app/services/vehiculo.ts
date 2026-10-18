import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface Vehiculo {
  idVehiculo: number;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  proximoKilometraje: number;

  fechaRevisionTecnica: Date | null;
  fechaUltimaMantencion: Date | null;
  fechaProximaMantencion: Date | null;

  estadoDpf: string;
  estadoRevision: string;
  estadoExtintor: string;
  observacion: string;

  idConductor: number | null;

  estado: boolean;

  fotoUrl: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class VehiculoService {

  private apiUrl = `${environment.apiUrl}api/vehiculos`;

  constructor(
    private http: HttpClient,
    private authService: AuthService 
  ) {}

  private async getAuthHeaders(): Promise<HttpHeaders> {
    const session = await this.authService.getSession();
    const token = session?.access_token || '';

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  agregarVehiculo(vehiculo: Vehiculo): Observable<Vehiculo> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => this.http.post<Vehiculo>(this.apiUrl, vehiculo, { headers }))
    );
  }

  subirFotoVehiculo(id: number, foto: Blob): Observable<any> {
    const formData = new FormData();
    formData.append('foto', foto, `vehiculo_${id}.jpg`);

    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => this.http.post<any>(`${this.apiUrl}/${id}/foto`, formData, { headers }))
    );
  }

  obtenerVehiculos(): Observable<Vehiculo[]> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => this.http.get<Vehiculo[]>(this.apiUrl, { headers }))
    );
  }

  obtenerVehiculo(id: number): Observable<Vehiculo> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => this.http.get<Vehiculo>(`${this.apiUrl}/${id}`, { headers }))
    );
  }

  modificarVehiculo(id: number, vehiculo: Vehiculo): Observable<void> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => this.http.put<void>(`${this.apiUrl}/${id}`, vehiculo, { headers }))
    );
  }

  eliminarVehiculo(id: number): Observable<void> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => this.http.delete<void>(`${this.apiUrl}/${id}`, { headers }))
    );
  }
}