import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Appointment {
  id?: number;
  customerName: string;
  age: number;
  phoneNumber: string;
  deadline: string;
  inspoImageUrl?: string;
  status: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private readonly API_URL = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // Customer endpoints
  createAppointment(appointment: Appointment, imageFile?: File): Observable<Appointment> {
    const formData = new FormData();
    formData.append('appointment', new Blob([JSON.stringify(appointment)], { type: 'application/json' }));
    if (imageFile) {
      formData.append('image', imageFile);
    }
    return this.http.post<Appointment>(`${this.API_URL}/customer/appointments`, formData);
  }

  getMyAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.API_URL}/customer/appointments`);
  }

  // Admin endpoints
  getAllAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.API_URL}/admin/appointments`);
  }

  getAppointmentById(id: number): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.API_URL}/admin/appointments/${id}`);
  }

  approveAppointment(id: number): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.API_URL}/admin/appointments/${id}/approve`, {});
  }

  declineAppointment(id: number, reason: string): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.API_URL}/admin/appointments/${id}/decline`, { reason });
  }

  updateAppointmentStatus(id: number, status: string): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.API_URL}/admin/appointments/${id}/status`, { status });
  }
}