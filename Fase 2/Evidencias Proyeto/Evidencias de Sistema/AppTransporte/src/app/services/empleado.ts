import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment';

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
  fotoUrl: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class EmpleadoService {

  private apiUrl = `${environment.apiUrl}api/Empleado`;

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

  obtenerEmpleados(): Observable<Empleado[]> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => this.http.get<Empleado[]>(this.apiUrl, { headers }))
    );
  }

  obtenerEmpleado(id: number): Observable<Empleado> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => this.http.get<Empleado>(`${this.apiUrl}/${id}`, { headers }))
    );
  }

  crearEmpleado(empleado: Empleado): Observable<Empleado> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => this.http.post<Empleado>(this.apiUrl, empleado, { headers }))
    );
  }

  modificarEmpleado(id: number, empleado: Empleado): Observable<void> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => this.http.put<void>(`${this.apiUrl}/${id}`, empleado, { headers }))
    );
  }

  eliminarEmpleado(id: number): Observable<void> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => this.http.delete<void>(`${this.apiUrl}/${id}`, { headers }))
    );
  }

  subirFotoEmpleado(idEmpleado: number, foto: Blob): Observable<any> {
    const formData = new FormData();
    formData.append('foto', foto, `empleado_${idEmpleado}.jpg`);

    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => this.http.post(`${this.apiUrl}/${idEmpleado}/foto`, formData, { headers }))
    );
  }
}