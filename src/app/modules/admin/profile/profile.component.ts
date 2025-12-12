import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, User } from '../../../services/auth.service';
import { MessageService } from '../../../services/message.service';
import { NavItem } from '../../../shared/components/sidebar/sidebar.component';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class AdminProfileComponent implements OnInit, OnDestroy {
  user: User | null = null;
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
  profileForm: FormGroup;
  passwordForm: FormGroup;
  loading = false;
  profileLoading = false;
  passwordLoading = false;
  profileSuccessMessage = '';
  profileErrorMessage = '';
  passwordSuccessMessage = '';
  passwordErrorMessage = '';
  activeTab: 'info' | 'password' = 'info';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private messageService: MessageService
  ) {
    this.profileForm = this.formBuilder.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]]
    });

    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.user = this.authService.currentUserValue;
    if (this.user) {
      this.profileForm.patchValue({
        fullName: this.user.fullName,
        email: this.user.email,
        phoneNumber: this.user.phoneNumber
      });
    }
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

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  setActiveTab(tab: 'info' | 'password'): void {
    this.activeTab = tab;
    this.profileSuccessMessage = '';
    this.profileErrorMessage = '';
    this.passwordSuccessMessage = '';
    this.passwordErrorMessage = '';
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      Object.keys(this.profileForm.controls).forEach(key => {
        this.profileForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.profileLoading = true;
    this.profileSuccessMessage = '';
    this.profileErrorMessage = '';

    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: (response) => {
        this.profileLoading = false;
        this.profileSuccessMessage = 'Profile updated successfully';
        this.user = response;
      },
      error: (error) => {
        this.profileLoading = false;
        this.profileErrorMessage = error.error?.message || 'Failed to update profile';
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      Object.keys(this.passwordForm.controls).forEach(key => {
        this.passwordForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.passwordLoading = true;
    this.passwordSuccessMessage = '';
    this.passwordErrorMessage = '';

    const { currentPassword, newPassword } = this.passwordForm.value;

    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.passwordLoading = false;
        this.passwordSuccessMessage = 'Password changed successfully';
        this.passwordForm.reset();
      },
      error: (error) => {
        console.error('Password change error:', error);
        this.passwordLoading = false;
        this.passwordErrorMessage = error.error?.message || error.message || 'Failed to change password';
      }
    });
  }

  toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
