import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { SignupComponent } from './signup.component';
import { AuthService } from '../../services/auth.service';

describe('SignupComponent', () => {
  let fixture: ComponentFixture<SignupComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  const session = { token: 'jwt-1', user: { id: 7, email: 'sam@example.com' } };

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['signup', 'login', 'saveSession']);

    await TestBed.configureTestingModule({
      imports: [SignupComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(SignupComponent);
    fixture.detectChanges();
  });

  const el = () => fixture.nativeElement as HTMLElement;
  const text = () => el().textContent as string;
  const type = (id: string, value: string) => {
    const input = el().querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
  };
  const fill = (overrides: Partial<Record<'fullname' | 'email' | 'password' | 'confirmPassword', string>> = {}) => {
    const values = { fullname: 'Sam Smith', email: 'sam@example.com', password: 'secret123', confirmPassword: 'secret123', ...overrides };
    Object.entries(values).forEach(([id, value]) => type(id, value));
  };
  const submit = () => {
    el().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };
  const httpError = (status: number, message?: string) =>
    throwError(() => new HttpErrorResponse({ status, error: message ? { message } : null }));

  it('signs up, logs in with the same details and opens the dashboard', () => {
    authService.signup.and.returnValue(of({ message: 'User created successfully! ' }));
    authService.login.and.returnValue(of(session));

    fill({ fullname: '  Sam Smith ', email: ' sam@example.com ' });
    submit();

    expect(authService.signup).toHaveBeenCalledOnceWith('Sam Smith', 'sam@example.com', 'secret123');
    expect(authService.login).toHaveBeenCalledOnceWith('sam@example.com', 'secret123');
    expect(authService.saveSession).toHaveBeenCalledOnceWith(session);
    expect(router.navigate).toHaveBeenCalledOnceWith(['/dashboard']);
  });

  it('sends nothing and shows what to fix when the form is incomplete', () => {
    submit();

    expect(authService.signup).not.toHaveBeenCalled();
    expect(text()).toContain('Enter your name');
    expect(text()).toContain('Enter a valid email address.');
    expect(text()).toContain('Use at least 8 characters.');
  });

  it('rejects a blank name, an email the server would refuse and a short password', () => {
    fill({ fullname: '   ', email: 'sam@example', password: 'short', confirmPassword: 'short' });
    submit();

    expect(authService.signup).not.toHaveBeenCalled();
    expect(text()).toContain('Enter your name');
    expect(text()).toContain('Enter a valid email address.');
    expect(text()).toContain('Use at least 8 characters.');
  });

  it('counts the password in bytes, as bcrypt does', () => {
    const emoji = '😀'.repeat(19); // 38 characters but 76 bytes
    fill({ password: emoji, confirmPassword: emoji });
    submit();

    expect(authService.signup).not.toHaveBeenCalled();
    expect(text()).toContain('That password is too long.');
  });

  it("won't send passwords that don't match", () => {
    fill({ confirmPassword: 'secret124' });
    submit();

    expect(authService.signup).not.toHaveBeenCalled();
    expect(text()).toContain("The passwords don't match.");
  });

  it("shows the server's reason when the email is taken or there were too many signups", () => {
    authService.signup.and.returnValue(httpError(400, 'Email already taken'));
    fill();
    submit();
    expect(text()).toContain('Email already taken');
    expect(authService.login).not.toHaveBeenCalled();

    authService.signup.and.returnValue(httpError(429, 'Too many signups from this address. Try again later.'));
    submit();
    expect(text()).toContain('Too many signups from this address.');
  });

  it('says to try again when the server fails, and lets the user resubmit', () => {
    authService.signup.and.returnValue(httpError(500));
    fill();
    submit();

    expect(text()).toContain("Couldn't create your account. Try again.");
    expect(el().querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBeFalse();
  });

  it('sends the user to log in if the account was made but the login after it failed', () => {
    authService.signup.and.returnValue(of({ message: 'User created successfully! ' }));
    authService.login.and.returnValue(httpError(500));
    fill();
    submit();

    expect(authService.saveSession).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/login'], { state: { notice: 'Account created. Please log in.' } });
    expect(text()).not.toContain("Couldn't create your account");
  });

  it('links to the login page', () => {
    expect(el().querySelector('a[href="/login"]')?.textContent).toContain('Log in');
  });
});
