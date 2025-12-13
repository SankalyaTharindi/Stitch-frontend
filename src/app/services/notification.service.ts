import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { tap, switchMap, startWith } from 'rxjs/operators';
import { Notification } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly API_URL = 'http://localhost:8080/api/notifications';
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  
  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {
    // Poll for new notifications every 30 seconds
    this.startPolling();
  }

  private startPolling(): void {
    interval(30000) // Poll every 30 seconds
      .pipe(
        startWith(0), // Start immediately
        switchMap(() => this.fetchNotifications())
      )
      .subscribe();
  }

  /**
   * Fetch all notifications for the current user
   */
  fetchNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.API_URL}`).pipe(
      tap(notifications => {
        this.notificationsSubject.next(notifications);
        const unreadCount = notifications.filter(n => !n.isRead).length;
        this.unreadCountSubject.next(unreadCount);
      })
    );
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.API_URL}/unread`);
  }

  /**
   * Mark a notification as read
   */
  markAsRead(notificationId: number): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/${notificationId}/read`, {}).pipe(
      tap(() => {
        // Update local state
        const notifications = this.notificationsSubject.value.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        );
        this.notificationsSubject.next(notifications);
        const unreadCount = notifications.filter(n => !n.isRead).length;
        this.unreadCountSubject.next(unreadCount);
      })
    );
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/read-all`, {}).pipe(
      tap(() => {
        // Update local state
        const notifications = this.notificationsSubject.value.map(n => ({ ...n, isRead: true }));
        this.notificationsSubject.next(notifications);
        this.unreadCountSubject.next(0);
      })
    );
  }

  /**
   * Delete a notification
   */
  deleteNotification(notificationId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${notificationId}`).pipe(
      tap(() => {
        // Update local state
        const notifications = this.notificationsSubject.value.filter(n => n.id !== notificationId);
        this.notificationsSubject.next(notifications);
        const unreadCount = notifications.filter(n => !n.isRead).length;
        this.unreadCountSubject.next(unreadCount);
      })
    );
  }

  /**
   * Get current unread count (synchronous)
   */
  getUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  /**
   * Get current notifications (synchronous)
   */
  getCurrentNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }

  /**
   * Stop polling (useful when user logs out)
   */
  stopPolling(): void {
    // The subscription will be cleaned up automatically on service destroy
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
  }
}
