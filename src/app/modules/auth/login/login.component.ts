import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService, AuthResponse } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  registerForm: FormGroup;
  loading = false;
  error = '';
  returnUrl: string = '';
  activeTab: 'signin' | 'signup' = 'signin';
  showModal = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.registerForm = this.formBuilder.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  setActiveTab(tab: 'signin' | 'signup'): void {
    this.activeTab = tab;
    this.error = '';
  }

  openModal(tab: 'signin' | 'signup'): void {
    this.activeTab = tab;
    this.showModal = true;
    this.error = '';
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.showModal = false;
    this.error = '';
    this.loginForm.reset();
    this.registerForm.reset();
    document.body.style.overflow = '';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.error = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (response: AuthResponse) => {
        console.log('Login response:', response);
        console.log('User role:', response.user.role);
        this.loading = false;
        const redirectUrl = response.user.role === 'ADMIN' 
          ? '/admin/dashboard' 
          : '/customer/dashboard';
        console.log('Navigating to:', redirectUrl);
        this.router.navigate([redirectUrl]);
      },
      error: (error: any) => {
        console.error('Login error:', error);
        this.error = 'Invalid email or password';
        this.loading = false;
      }
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.error = '';

    const formData = this.registerForm.value;

    this.authService.register(formData).subscribe({
      next: (response: AuthResponse) => {
        console.log('Registration successful:', response);
        this.loading = false;
        const redirectUrl = response.user.role === 'ADMIN' 
          ? '/admin/dashboard' 
          : '/customer/dashboard';
        this.router.navigate([redirectUrl]);
      },
      error: (error: any) => {
        console.error('Registration error:', error);
        this.error = error.error?.message || 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }
}