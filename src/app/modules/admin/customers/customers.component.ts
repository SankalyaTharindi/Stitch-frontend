import { Component, OnInit } from '@angular/core';
import { User } from '../../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  loading = true;
  searchTerm = '';

  adminNavItems: NavItem[] = [
    { label: 'Dashboard', route: '/admin/dashboard', icon: 'dashboard' },
    { label: 'Appointments', route: '/admin/appointments', icon: 'event' },
    { label: 'Customers', route: '/admin/customers', icon: 'people' },
    { label: 'Calendar', route: '/admin/calendar', icon: 'calendar_today' },
    { label: 'Gallery', route: '/admin/gallery', icon: 'collections' },
    { label: 'Profile', route: '/admin/profile', icon: 'person' }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadCustomers();
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
