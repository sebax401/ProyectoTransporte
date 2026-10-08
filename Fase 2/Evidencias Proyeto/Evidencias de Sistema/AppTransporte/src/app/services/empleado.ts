import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Empleado {
  idEmpleado: number;
  nombre: string;
  apellido: string;
  rut: string;
  cargo: string;
  tipoContrato: string;
  estado: string;
  fechaIngreso: string;
  fechaTermino: string | null;
  razonDespido: string | null;
  observaciones: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class EmpleadoService {

  private apiUrl =
    'https://apitransporte.onrender.com/api/Empleado';

  constructor(private http: HttpClient) {}

  obtenerEmpleados(): Observable<Empleado[]> {
    return this.http.get<Empleado[]>(this.apiUrl);
  }

  obtenerEmpleado(id: number): Observable<Empleado> {
    return this.http.get<Empleado>(
      `${this.apiUrl}/${id}`
    );
  }

  crearEmpleado(empleado: Empleado): Observable<Empleado> {
    return this.http.post<Empleado>(
      this.apiUrl,
      empleado
    );
  }

  modificarEmpleado(
    id: number,
    empleado: Empleado
  ): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/${id}`,
      empleado
    );
  }

  eliminarEmpleado(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}