import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Capacitor } from '@capacitor/core';

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
}

@Injectable({
  providedIn: 'root'
})
export class VehiculoService {


  private apiUrl = 'https://apitransporte.onrender.com/api/Vehiculos';

  constructor(private http: HttpClient) {
    console.log('API URL usada:', this.apiUrl);
  }

  agregarVehiculo(vehiculo: Vehiculo): Observable<Vehiculo> {
    return this.http.post<Vehiculo>(this.apiUrl, vehiculo);
  }

  obtenerVehiculos(): Observable<Vehiculo[]> {
    return this.http.get<Vehiculo[]>(this.apiUrl);
  }
  obtenerVehiculo(id: number): Observable<Vehiculo> {
    return this.http.get<Vehiculo>(`${this.apiUrl}/${id}`);
  }

  modificarVehiculo(id: number, vehiculo: Vehiculo): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, vehiculo);
  }

  eliminarVehiculo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}