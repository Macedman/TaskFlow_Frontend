import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

// The free host sleeps after 15 idle minutes and takes up to a minute to wake;
// past this, say so rather than leave the user looking at a button that does nothing
const WAKING_HINT_AFTER_MS = 3000;

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  // e.g. "Account created. Please log in." passed by the signup page through navigation state
  notice: string | null = typeof history.state?.notice === 'string' ? history.state.notice : null;
  isWakingServer = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const email = this.loginForm.get('email')?.value || '';
    const password = this.loginForm.get('password')?.value || '';

    const wakingHint = setTimeout(() => (this.isWakingServer = true), WAKING_HINT_AFTER_MS);

    this.authService.login(email, password).pipe(
      // runs on success and on error alike
      finalize(() => {
        clearTimeout(wakingHint);
        this.isWakingServer = false;
      })
    ).subscribe((response) => {
      this.authService.saveSession(response);
      this.router.navigate(['/dashboard']);
    }, (error) => {
        this.errorMessage = error.error.message || 'Login failed. Please check your credentials.';
    });
  }

  //
}
