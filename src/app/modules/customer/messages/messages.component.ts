import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { MessageService } from '../../../services/message.service';
import { AuthService } from '../../../services/auth.service';
import { MessageDTO, ChatUserDTO, SendMessageRequest } from '../../../models/message.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss'
})
export class MessagesComponent implements OnInit, OnDestroy {
  @ViewChild('messageContainer') messageContainer!: ElementRef;
  
  messages: MessageDTO[] = [];
  admin: ChatUserDTO | null = null;
  newMessageContent: string = '';
  loading: boolean = true;
  sending: boolean = false;
  
  private newMessageSubscription?: Subscription;
  private currentUserId: number | null = null;

  constructor(
    private messageService: MessageService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.currentUserId = user.id;
      this.loadAdminAndMessages();
      this.connectWebSocket();
      this.subscribeToNewMessages();
    }
  }

  loadAdminAndMessages(): void {
    this.loading = true;
    
    // First get admin info
    this.messageService.getAdminChatUser().subscribe({
      next: (admin) => {
        this.admin = admin;
        
        // Then load chat history
        this.messageService.getChatHistory(admin.id).subscribe({
          next: (messages) => {
            this.messages = messages;
            this.loading = false;
            this.scrollToBottom();
            
            // Mark messages as read
            if (messages.length > 0) {
              this.messageService.markMessagesAsRead(admin.id).subscribe();
            }
          },
          error: (error) => {
            console.error('Error loading chat history:', error);
            this.loading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error loading admin info:', error);
        this.loading = false;
      }
    });
  }

  connectWebSocket(): void {
    if (this.currentUserId) {
      this.messageService.connectWebSocket(this.currentUserId);
    }
  }

  subscribeToNewMessages(): void {
    this.newMessageSubscription = this.messageService.getNewMessages().subscribe({
      next: (message) => {
        this.messages.push(message);
        this.scrollToBottom();
        
        // Mark as read if from admin
        if (this.admin && message.senderId === this.admin.id) {
          this.messageService.markMessagesAsRead(this.admin.id).subscribe();
        }
      }
    });
  }

  sendMessage(): void {
    if (!this.newMessageContent.trim() || !this.admin || this.sending) {
      return;
    }

    this.sending = true;
    const request: SendMessageRequest = {
      receiverId: this.admin.id,
      content: this.newMessageContent.trim()
    };

    console.log('Customer sending message:', request);

    this.messageService.sendMessage(request).subscribe({
      next: (message) => {
        console.log('Message sent successfully:', message);
        this.messages.push(message);
        this.newMessageContent = '';
        this.sending = false;
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error sending message:', error);
        alert('Failed to send message: ' + (error.error?.message || error.message));
        this.sending = false;
      }
    });
  }

  isOwnMessage(message: MessageDTO): boolean {
    return message.senderId === this.currentUserId;
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.messageContainer) {
        this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  ngOnDestroy(): void {
    if (this.newMessageSubscription) {
      this.newMessageSubscription.unsubscribe();
    }
    this.messageService.disconnectWebSocket();
  }
}
