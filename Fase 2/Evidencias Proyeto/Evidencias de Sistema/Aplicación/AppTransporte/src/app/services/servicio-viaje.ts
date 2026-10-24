import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

export type EstadoServicio = 'Programado' | 'En curso' | 'Finalizado' | 'Cancelado';

export interface ServicioViaje {
  idServicio: number;
  origen: string;
  destino: string;
  fechaSalida: string;
  fechaLlegadaEstimada: string | null;
  estado: EstadoServicio | string;
  idVehiculo: number;
  idEmpleado: number;
  patenteVehiculo?: string;
  observaciones: string | null;
}

export type ServicioViajeRequest = Omit<ServicioViaje, 'patenteVehiculo'>;

@Injectable({
  providedIn: 'root'
})
export class ServicioViajeService {
  private readonly apiUrl = `${environment.apiUrl}api/Servicios`;

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {}

  private async getAuthHeaders(): Promise<HttpHeaders> {
    const session = await this.authService.getSession();
    const token = session?.access_token;

    if (!token) {
      throw new Error('Tu sesión ha expirado. Inicia sesión nuevamente.');
    }

    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  obtenerServicios(vehiculoId?: number | null): Observable<ServicioViaje[]> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => {
        let params = new HttpParams();
        if (vehiculoId && vehiculoId > 0) {
          params = params.set('vehiculoId', vehiculoId.toString());
        }
        return this.http.get<ServicioViaje[]>(this.apiUrl, { headers, params });
      })
    );
  }

  obtenerServicio(id: number): Observable<ServicioViaje> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => this.http.get<ServicioViaje>(`${this.apiUrl}/${id}`, { headers }))
    );
  }

  crearServicio(servicio: ServicioViajeRequest): Observable<ServicioViaje> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => this.http.post<ServicioViaje>(this.apiUrl, servicio, { headers }))
    );
  }

  actualizarServicio(id: number, servicio: ServicioViajeRequest): Observable<ServicioViaje> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => this.http.put<ServicioViaje>(`${this.apiUrl}/${id}`, servicio, { headers }))
    );
  }
}