import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { MessageService } from '../../../services/message.service';
import { AuthService } from '../../../services/auth.service';
import { MessageDTO, ChatUserDTO, SendMessageRequest } from '../../../models/message.model';
import { Subscription } from 'rxjs';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss'
})
export class MessagesComponent implements OnInit, OnDestroy {
  @ViewChild('messageContainer') messageContainer!: ElementRef;
  
  customers: ChatUserDTO[] = [];
  selectedCustomer: ChatUserDTO | null = null;
  messages: MessageDTO[] = [];
  newMessageContent: string = '';
  loading: boolean = true;
  loadingMessages: boolean = false;
  sending: boolean = false;
  
  private newMessageSubscription?: Subscription;
  private currentUserId: number | null = null;

  adminNavItems: NavItem[] = [
    { label: 'Dashboard', route: '/admin/dashboard', icon: 'dashboard' },
    { label: 'Appointments', route: '/admin/appointments', icon: 'event' },
    { label: 'Customers', route: '/admin/customers', icon: 'people' },
    { label: 'Calendar', route: '/admin/calendar', icon: 'calendar_today' },
    { label: 'Gallery', route: '/admin/gallery', icon: 'collections' },
    { label: 'Messages', route: '/admin/messages', icon: 'message' },
    { label: 'Profile', route: '/admin/profile', icon: 'person' }
  ];

  constructor(
    private messageService: MessageService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.currentUserId = user.id;
      this.loadCustomers();
      this.connectWebSocket();
      this.subscribeToNewMessages();
    }
  }

  loadCustomers(): void {
    this.loading = true;
    this.messageService.getCustomersWithMessages().subscribe({
      next: (customers) => {
        this.customers = customers;
        this.loading = false;
        
        // Auto-select first customer if available
        if (customers.length > 0 && !this.selectedCustomer) {
          this.selectCustomer(customers[0]);
        }
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.loading = false;
      }
    });
  }

  selectCustomer(customer: ChatUserDTO): void {
    this.selectedCustomer = customer;
    this.loadMessages(customer.id);
  }

  loadMessages(customerId: number): void {
    this.loadingMessages = true;
    this.messageService.getChatHistory(customerId).subscribe({
      next: (messages) => {
        this.messages = messages;
        this.loadingMessages = false;
        this.scrollToBottom();
        
        // Mark messages as read
        if (messages.length > 0) {
          this.messageService.markMessagesAsRead(customerId).subscribe();
          
          // Update unread count for this customer
          const customer = this.customers.find(c => c.id === customerId);
          if (customer) {
            customer.unreadCount = 0;
          }
        }
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.loadingMessages = false;
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
        console.log('Admin received new message:', message);
        // If message is from selected customer, add to messages
        if (this.selectedCustomer && message.senderId === this.selectedCustomer.id) {
          console.log('Message is from selected customer, adding to messages');
          this.messages.push(message);
          this.scrollToBottom();
          this.messageService.markMessagesAsRead(this.selectedCustomer.id).subscribe();
        } else {
          console.log('Message is from another customer or first message');
          // Update customer list to show new unread message
          const customer = this.customers.find(c => c.id === message.senderId);
          if (customer) {
            console.log('Updating existing customer in list');
            customer.unreadCount = (customer.unreadCount || 0) + 1;
            customer.lastMessage = message.content;
            customer.lastMessageTime = message.timestamp;
          } else {
            console.log('New customer, reloading customer list');
            // New customer, reload customer list
            this.loadCustomers();
          }
        }
      },
      error: (error) => {
        console.error('Error in new message subscription:', error);
      }
    });
  }

  sendMessage(): void {
    if (!this.newMessageContent.trim() || !this.selectedCustomer || this.sending) {
      return;
    }

    this.sending = true;
    const request: SendMessageRequest = {
      receiverId: this.selectedCustomer.id,
      content: this.newMessageContent.trim()
    };

    this.messageService.sendMessage(request).subscribe({
      next: (message) => {
        this.messages.push(message);
        this.newMessageContent = '';
        this.sending = false;
        this.scrollToBottom();
        
        // Update last message in customer list
        if (this.selectedCustomer) {
          const customer = this.customers.find(c => c.id === this.selectedCustomer!.id);
          if (customer) {
            customer.lastMessage = message.content;
            customer.lastMessageTime = message.timestamp;
          }
        }
      },
      error: (error) => {
        console.error('Error sending message:', error);
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
