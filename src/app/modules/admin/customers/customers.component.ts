import { Component, OnInit, OnDestroy } from '@angular/core';
import { User } from '../../../services/auth.service';
import { MessageService } from '../../../services/message.service';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, Subscription } from 'rxjs';
import { NavItem } from '../../../shared/components/sidebar/sidebar.component';

interface Customer extends User {
  appointmentCount?: number;
  lastAppointmentDate?: string;
  totalSpent?: number;
}

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class CustomersComponent implements OnInit, OnDestroy {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  loading = true;
  searchTerm = '';
  private refreshSubscription?: Subscription;

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
    private http: HttpClient,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
    this.loadUnreadMessageCount();
    
    // Subscribe to new messages for real-time updates
    this.messageService.getNewMessages().subscribe(() => {
      this.loadUnreadMessageCount();
    });
    
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.loadUnreadMessageCount();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadUnreadMessageCount(): void {
    this.messageService.getCustomersWithMessages().subscribe({
      next: (customers) => {
        const totalUnread = customers.reduce((sum, customer) => sum + (customer.unreadCount || 0), 0);
        const messagesNavItem = this.adminNavItems.find(item => item.route === '/admin/messages');
        if (messagesNavItem) {
          messagesNavItem.badge = totalUnread > 0 ? totalUnread : undefined;
        }
      }
    });
  }

  loadCustomers(): void {
    this.loading = true;
    
    this.getCustomers().subscribe({
      next: (customers: Customer[]) => {
        // Fetch appointments to count per customer
        this.http.get<any[]>('http://localhost:8080/api/appointments/admin/all').subscribe({
          next: (appointments) => {
            this.customers = customers.map(customer => ({
              ...customer,
              appointmentCount: appointments.filter(apt => apt.customer?.id === customer.id).length
            }));
            this.filteredCustomers = this.customers;
            this.loading = false;
          },
          error: () => {
            this.customers = customers;
            this.filteredCustomers = customers;
            this.loading = false;
          }
        });
      },
      error: (error: any) => {
        console.error('Error loading customers:', error);
        this.loading = false;
      }
    });
  }

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>('http://localhost:8080/api/admin/customers');
  }

  searchCustomers(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredCustomers = this.customers.filter(customer =>
      customer.fullName.toLowerCase().includes(term) ||
      customer.email.toLowerCase().includes(term) ||
      (customer.phoneNumber && customer.phoneNumber.includes(term))
    );
  }

  deleteCustomer(id: number): void {
    if (confirm('Are you sure you want to delete this customer?')) {
      this.http.delete(`http://localhost:8080/api/admin/customers/${id}`).subscribe({
        next: () => {
          this.loadCustomers();
        },
        error: (error: any) => console.error('Error deleting customer:', error)
      });
    }
  }
}
