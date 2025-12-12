import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { MessageService } from '../../../services/message.service';
import { AuthService } from '../../../services/auth.service';
import { MessageDTO, ChatUserDTO, SendMessageRequest } from '../../../models/message.model';
import { Subscription } from 'rxjs';
import { NavItem } from '../../../shared/components/sidebar/sidebar.component';

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
  unreadCount: number = 0;
  
  private newMessageSubscription?: Subscription;
  private currentUserId: number | null = null;

  customerNavItems: NavItem[] = [
    { label: 'Dashboard', route: '/customer/dashboard', icon: 'dashboard' },
    { label: 'Book Appointment', route: '/customer/book-appointment', icon: 'event' },
    { label: 'Gallery', route: '/customer/gallery', icon: 'photo_library' },
    { label: 'Messages', route: '/customer/messages', icon: 'message' },
    { label: 'Profile', route: '/customer/profile', icon: 'person' }
  ];

  constructor(
    private messageService: MessageService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.currentUserId = user.id;
      this.connectWebSocket();
      this.subscribeToNewMessages();
      this.loadAdminAndMessages();
    }
  }

  updateUnreadCount(adminId: number): void {
    this.messageService.getChatHistory(adminId).subscribe({
      next: (messages) => {
        this.unreadCount = messages.filter(msg => !msg.isRead && msg.receiverId === this.currentUserId).length;
        const messagesNavItem = this.customerNavItems.find(item => item.route === '/customer/messages');
        if (messagesNavItem) {
          messagesNavItem.badge = this.unreadCount;
        }
      },
      error: (error) => {
        console.error('Error loading unread count:', error);
      }
    });
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
            console.log('Messages received:', messages);
            if (messages.length > 0) {
              console.log('First message structure:', messages[0]);
              console.log('First message keys:', Object.keys(messages[0]));
              console.log('First message timestamp:', messages[0].createdAt);
              console.log('All fields:', JSON.stringify(messages[0], null, 2));
            }
            this.messages = messages;
            
            // Update unread count before marking as read
            this.updateUnreadCount(admin.id);
            
            this.loading = false;
            this.scrollToBottom();
            
            // Mark messages as read
            if (messages.length > 0) {
              this.messageService.markMessagesAsRead(admin.id).subscribe({
                next: () => {
                  // Clear the badge after marking as read
                  this.unreadCount = 0;
                  const messagesNavItem = this.customerNavItems.find(item => item.route === '/customer/messages');
                  if (messagesNavItem) {
                    messagesNavItem.badge = 0;
                  }
                }
              });
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
        
        // Mark as read if from admin and on messages page
        if (this.admin && message.senderId === this.admin.id) {
          this.messageService.markMessagesAsRead(this.admin.id).subscribe({
            next: () => {
              // Clear the badge since message is read
              this.unreadCount = 0;
              const messagesNavItem = this.customerNavItems.find(item => item.route === '/customer/messages');
              if (messagesNavItem) {
                messagesNavItem.badge = 0;
              }
            }
          });
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

  formatTime(timestamp: any): string {
    if (!timestamp) {
      console.log('No timestamp provided');
      return '';
    }
    
    console.log('Timestamp received:', timestamp, 'Type:', typeof timestamp, 'IsArray:', Array.isArray(timestamp));
    
    // Handle array format [year, month, day, hour, minute, second, nano]
    let date: Date;
    if (Array.isArray(timestamp)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = timestamp;
      console.log('Parsing array timestamp:', { year, month, day, hour, minute, second });
      date = new Date(year, month - 1, day, hour, minute, second);
    } else if (typeof timestamp === 'string') {
      console.log('Parsing string timestamp:', timestamp);
      date = new Date(timestamp);
    } else if (typeof timestamp === 'object' && timestamp !== null) {
      console.log('Timestamp is object:', timestamp);
      // Try to handle object format
      return '';
    } else {
      console.log('Unknown timestamp format');
      return '';
    }
    
    console.log('Parsed date:', date, 'Valid:', !isNaN(date.getTime()));
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    const formattedTime = diffInHours < 24 
      ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    console.log('Formatted time:', formattedTime);
    return formattedTime;
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
