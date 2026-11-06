import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, EMPTY, switchMap } from 'rxjs';
import { AuthService } from '../../services/auth.service';

// The same limits the server checks (src/middlewares/signup.ts), so most mistakes never leave the page
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 100;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// "   " passes Validators.required but the server trims it to nothing
const notBlank = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' && control.value.trim() === '' ? { blank: true } : null;

// bcrypt only uses the first 72 bytes, and an emoji alone is 4, so count bytes rather than characters
const maxBytes = (limit: number) => (control: AbstractControl): ValidationErrors | null =>
  new TextEncoder().encode(control.value ?? '').length > limit ? { maxBytes: true } : null;

const passwordsMatch = (group: AbstractControl): ValidationErrors | null =>
  group.get('password')?.value === group.get('confirmPassword')?.value ? null : { mismatch: true };

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
})
export class SignupComponent {
  signupForm: FormGroup;
  errorMessage = '';
  isSubmitting = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.signupForm = this.fb.group({
      fullname: ['', [Validators.required, notBlank, Validators.maxLength(MAX_NAME_LENGTH)]],
      email: ['', [Validators.required, Validators.maxLength(MAX_EMAIL_LENGTH), Validators.pattern(EMAIL_PATTERN)]],
      password: ['', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH), maxBytes(MAX_PASSWORD_BYTES)]],
      confirmPassword: ['', Validators.required],
    }, { validators: passwordsMatch });
  }

  // touched first, so a field doesn't turn red before the user has had a chance to fill it
  showError(name: string): boolean {
    const control = this.signupForm.get(name);
    return !!control && control.touched && control.invalid;
  }

  get showMismatch(): boolean {
    return !!this.signupForm.get('confirmPassword')?.touched && this.signupForm.hasError('mismatch');
  }

  onSubmit() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const fullname = this.signupForm.value.fullname.trim();
    const email = this.signupForm.value.email.trim();
    const password = this.signupForm.value.password;
    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService.signup(fullname, email, password).pipe(
      // signup gives no token, so log straight in; if that fails the account still exists,
      // so send them to the login page rather than showing a signup error
      switchMap(() => this.authService.login(email, password).pipe(
        catchError(() => {
          this.router.navigate(['/login'], { state: { notice: 'Account created. Please log in.' } });
          return EMPTY;
        })
      ))
    ).subscribe({
      next: response => {
        this.authService.saveSession(response);
        this.router.navigate(['/dashboard']);
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting = false;
        this.errorMessage = this.signupErrorMessage(error);
      }
    });
  }

  // 400 ("Email already taken" or a rule we missed) and 429 explain themselves; anything else doesn't
  private signupErrorMessage(error: HttpErrorResponse): string {
    const message = error.error?.message;
    if ((error.status === 400 || error.status === 429) && typeof message === 'string') return message;
    return "Couldn't create your account. Try again.";
  }
}
