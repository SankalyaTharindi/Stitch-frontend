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
  createAppointment(appointment: Appointment, imageFiles?: File[]): Observable<Appointment> {
    const formData = new FormData();
    formData.append('appointment', new Blob([JSON.stringify(appointment)], { type: 'application/json' }));
    if (imageFiles && imageFiles.length > 0) {
      imageFiles.forEach(file => {
        formData.append('images', file);
      });
    }
    return this.http.post<Appointment>(`${this.API_URL}/appointments/customer`, formData);
  }

  getMyAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.API_URL}/appointments/customer/my-appointments`);
  }

  // Admin endpoints
  getAllAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.API_URL}/appointments/admin/all`);
  }

  getAppointmentById(id: number): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.API_URL}/appointments/admin/${id}`);
  }

  approveAppointment(id: number): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.API_URL}/appointments/admin/${id}/approve`, {});
  }

  declineAppointment(id: number, reason: string): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.API_URL}/appointments/admin/${id}/decline`, { reason });
  }

  updateAppointmentStatus(id: number, status: string): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.API_URL}/appointments/admin/${id}/status`, { status });
  }

  updateAppointment(id: number, appointment: Appointment, imageFiles?: File[], deleteIndices?: number[]): Observable<Appointment> {
    const formData = new FormData();
    formData.append('appointment', new Blob([JSON.stringify(appointment)], { type: 'application/json' }));
    if (imageFiles && imageFiles.length > 0) {
      imageFiles.forEach(file => {
        formData.append('images', file);
      });
    }
    // Send indices of images to delete as query parameters
    let url = `${this.API_URL}/appointments/customer/${id}`;
    if (deleteIndices && deleteIndices.length > 0) {
      url += `?deleteIndices=${deleteIndices.join(',')}`;
    }
    return this.http.put<Appointment>(url, formData);
  }

  cancelAppointment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/appointments/customer/${id}`);
  }

  getImageUrl(appointmentId: number): string {
    return `${this.API_URL}/appointments/admin/${appointmentId}/image`;
  }

  getImageBlob(appointmentId: number, isAdmin: boolean = true, index: number = 0): Observable<Blob> {
    const endpoint = isAdmin 
      ? `${this.API_URL}/appointments/admin/${appointmentId}/image`
      : `${this.API_URL}/appointments/customer/${appointmentId}/image`;
    return this.http.get(endpoint, {
      params: { index: index.toString() },
      responseType: 'blob'
    });
  }

  getImageCount(inspoImageUrl: string | undefined): number {
    if (!inspoImageUrl) return 0;
    return inspoImageUrl.split(',').length;
  }
}