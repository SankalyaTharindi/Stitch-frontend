import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { MessageDTO, SendMessageRequest, ChatUserDTO } from '../models/message.model';
import { WebSocketService } from './websocket.service';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private readonly API_URL = 'http://localhost:8080/api/messages';
  private newMessage$ = new Subject<MessageDTO>();
  private unreadCount$ = new BehaviorSubject<number>(0);

  constructor(
    private http: HttpClient,
    private webSocketService: WebSocketService
  ) {}

  // Connect to WebSocket
  connectWebSocket(userId: number): void {
    this.webSocketService.connect();
    
    // Wait for connection before subscribing
    this.webSocketService.isConnected().subscribe(connected => {
      if (connected) {
        console.log('WebSocket connected, subscribing to messages...');
        // Subscribe to user's personal message queue
        this.webSocketService.subscribe(`/user/queue/messages`, (message) => {
          const messageData: MessageDTO = JSON.parse(message.body);
          console.log('Received WebSocket message:', messageData);
          this.newMessage$.next(messageData);
          this.updateUnreadCount();
        });
      }
    });
  }

  // Disconnect WebSocket
  disconnectWebSocket(): void {
    this.webSocketService.disconnect();
  }

  // Observable for new messages
  getNewMessages(): Observable<MessageDTO> {
    return this.newMessage$.asObservable();
  }

  // Observable for unread count
  getUnreadCount(): Observable<number> {
    return this.unreadCount$.asObservable();
  }

  // Fetch and update unread count
  private updateUnreadCount(): void {
    this.http.get<number>(`${this.API_URL}/unread-count`).subscribe({
      next: (count) => this.unreadCount$.next(count),
      error: (error) => console.error('Error fetching unread count:', error)
    });
  }

  // Send message via REST API
  sendMessage(request: SendMessageRequest): Observable<MessageDTO> {
    return this.http.post<MessageDTO>(`${this.API_URL}/send`, request).pipe(
      tap(() => this.updateUnreadCount())
    );
  }

  // Get chat history with a specific user
  getChatHistory(otherUserId: number): Observable<MessageDTO[]> {
    return this.http.get<MessageDTO[]>(`${this.API_URL}/chat/${otherUserId}`);
  }

  // For admin: Get all customers with messages
  getCustomersWithMessages(): Observable<ChatUserDTO[]> {
    return this.http.get<ChatUserDTO[]>(`${this.API_URL}/customers`);
  }

  // For customer: Get admin chat user
  getAdminChatUser(): Observable<ChatUserDTO> {
    return this.http.get<ChatUserDTO>(`${this.API_URL}/admin`);
  }

  // Mark messages as read
  markMessagesAsRead(senderId: number): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/mark-read/${senderId}`, {}).pipe(
      tap(() => this.updateUnreadCount())
    );
  }

  // Fetch initial unread count
  fetchUnreadCount(): void {
    this.updateUnreadCount();
  }
}
