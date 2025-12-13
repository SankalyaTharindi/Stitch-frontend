import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../../services/notification.service';
import { Notification } from '../../../models/notification.model';
import { AuthService } from '../../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-dropdown',
  templateUrl: './notification-dropdown.component.html',
  styleUrls: ['./notification-dropdown.component.scss']
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  isOpen = false;
  notifications: Notification[] = [];
  unreadCount = 0;
  private subscriptions = new Subscription();

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Subscribe to notifications
    this.subscriptions.add(
      this.notificationService.notifications$.subscribe(notifications => {
        this.notifications = notifications;
      })
    );

    // Subscribe to unread count
    this.subscriptions.add(
      this.notificationService.unreadCount$.subscribe(count => {
        this.unreadCount = count;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  handleNotificationClick(notification: Notification): void {
    // Mark as read
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }

    // Close dropdown
    this.closeDropdown();

    // Navigate to relevant page based on notification type
    const currentUser = this.authService.currentUserValue;
    const isAdmin = currentUser?.role === 'ADMIN';

    switch (notification.type) {
      case 'CUSTOMER_REGISTERED':
        if (isAdmin) {
          this.router.navigate(['/admin/customers']);
        }
        break;

      case 'APPOINTMENT_BOOKED':
      case 'APPOINTMENT_EDITED':
        if (isAdmin) {
          this.router.navigate(['/admin/appointments']);
        }
        break;

      case 'APPOINTMENT_APPROVED':
      case 'APPOINTMENT_DECLINED':
      case 'APPOINTMENT_STATUS_CHANGED':
      case 'JACKET_READY':
        this.router.navigate([isAdmin ? '/admin/appointments' : '/customer/dashboard']);
        break;

      case 'MESSAGE_RECEIVED':
        this.router.navigate([isAdmin ? '/admin/messages' : '/customer/messages']);
        break;

      case 'GALLERY_PHOTO_LIKED':
      case 'GALLERY_PHOTO_UPLOADED':
        this.router.navigate([isAdmin ? '/admin/gallery' : '/customer/gallery']);
        break;

      case 'PROFILE_UPDATED':
        this.router.navigate([isAdmin ? '/admin/customers' : '/customer/profile']);
        break;

      case 'PAYMENT_REMINDER':
      case 'BILL_UPLOADED':
        this.router.navigate([isAdmin ? '/admin/appointments' : '/customer/dashboard']);
        break;

      default:
        this.router.navigate([isAdmin ? '/admin/dashboard' : '/customer/dashboard']);
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        console.log('All notifications marked as read');
      },
      error: (error) => {
        console.error('Error marking all as read:', error);
      }
    });
  }

  getNotificationIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'CUSTOMER_REGISTERED': 'person_add',
      'APPOINTMENT_BOOKED': 'event',
      'APPOINTMENT_APPROVED': 'check_circle',
      'APPOINTMENT_DECLINED': 'cancel',
      'APPOINTMENT_RESCHEDULED': 'update',
      'APPOINTMENT_COMPLETED': 'done_all',
      'MESSAGE_RECEIVED': 'message',
      'PAYMENT_RECEIVED': 'payment',
      'GALLERY_IMAGE_LIKED': 'favorite',
      'PROFILE_UPDATED': 'account_circle',
      'BILL_UPLOADED': 'receipt',
      'SYSTEM_ALERT': 'notifications_active'
    };
    return iconMap[type] || 'notifications';
  }

  getTimeAgo(date: Date | string): string {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return notificationDate.toLocaleDateString();
  }
}
