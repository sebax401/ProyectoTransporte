
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ServicioViaje {
  idServicio: number;
  origen: string;
  destino: string;
  fechaSalida: string;
  fechaLlegadaEstimada?: string | null;
  estado: string;
  idVehiculo: number;
  idEmpleado: number;
  observaciones?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private apiUrl = 'https://proyectotransporte.onrender.com/api';

  constructor(private http: HttpClient) {}

  private headers(token: string): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // Obtener todos los vehículos
  obtenerVehiculos(token: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/Vehiculos`,
      { headers: this.headers(token) }
    );
  }

  // Obtener todos los empleados
  obtenerEmpleados(token: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/Empleado`,
      { headers: this.headers(token) }
    );
  }

  // Obtener todos los reportes
  obtenerReportes(token: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/Reportes`,
      { headers: this.headers(token) }
    );
  }

  // Obtener servicios y viajes
  obtenerServicios(
    token: string,
    vehiculoId?: number
  ): Observable<ServicioViaje[]> {

    let params = new HttpParams();

    if (vehiculoId !== undefined) {
      params = params.set('vehiculoId', vehiculoId);
    }

    return this.http.get<ServicioViaje[]>(
      `${this.apiUrl}/Servicios`,
      {
        headers: this.headers(token),
        params: params
      }
    );
  }
}
