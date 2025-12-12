import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
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
  isMobileView: boolean = false;
  
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
  ) {
    this.checkMobileView();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkMobileView();
  }

  checkMobileView() {
    this.isMobileView = window.innerWidth <= 768;
  }

  backToCustomersList() {
    this.selectedCustomer = null;
  }

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
        // Load last message for each customer if not provided by backend
        customers.forEach(customer => {
          if (!customer.lastMessage) {
            this.messageService.getChatHistory(customer.id).subscribe({
              next: (messages) => {
                if (messages.length > 0) {
                  const lastMsg = messages[messages.length - 1];
                  customer.lastMessage = lastMsg.content;
                  customer.lastMessageTime = lastMsg.createdAt;
                  // Re-sort after loading messages
                  this.sortCustomersByRecentMessage();
                }
              },
              error: (error) => {
                console.error(`Error loading messages for customer ${customer.id}:`, error);
              }
            });
          }
        });
        
        this.customers = customers;
        this.sortCustomersByRecentMessage();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.loading = false;
      }
    });
  }

  sortCustomersByRecentMessage(): void {
    this.customers.sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA; // Most recent first
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
        console.log('Admin messages received:', messages);
        if (messages.length > 0) {
          console.log('First message structure:', messages[0]);
          console.log('First message keys:', Object.keys(messages[0]));
          console.log('First message timestamp:', messages[0].createdAt);
          console.log('All fields:', JSON.stringify(messages[0], null, 2));
        }
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
          
          // Update last message time and re-sort
          const customer = this.customers.find(c => c.id === this.selectedCustomer!.id);
          if (customer) {
            customer.lastMessage = message.content;
            customer.lastMessageTime = message.createdAt;
            this.sortCustomersByRecentMessage();
          }
        } else {
          console.log('Message is from another customer or first message');
          // Update customer list to show new unread message
          const customer = this.customers.find(c => c.id === message.senderId);
          if (customer) {
            console.log('Updating existing customer in list');
            customer.unreadCount = (customer.unreadCount || 0) + 1;
            customer.lastMessage = message.content;
            customer.lastMessageTime = message.createdAt;
            // Sort to move this customer to top
            this.sortCustomersByRecentMessage();
          } else {
            console.log('New customer, reloading customer list');
            // New customer, reload customer list
            this.messageService.getCustomersWithMessages().subscribe({
              next: (customers) => {
                this.customers = customers;
                this.sortCustomersByRecentMessage();
              },
              error: (error) => {
                console.error('Error reloading customers:', error);
              }
            });
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
            customer.lastMessageTime = message.createdAt;
            // Sort to move this customer to top
            this.sortCustomersByRecentMessage();
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
