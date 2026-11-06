import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  const create = async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  afterEach(() => history.replaceState(null, ''));

  it('should create', async () => {
    await create();
    expect(component).toBeTruthy();
  });

  it('links to the signup page', async () => {
    await create();
    expect((fixture.nativeElement as HTMLElement).querySelector('a[href="/signup"]')?.textContent).toContain('Sign up');
  });

  it('shows a notice passed in by the signup page', async () => {
    history.replaceState({ notice: 'Account created. Please log in.' }, '');
    await create();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Account created. Please log in.');
  });

  it('saves the session through AuthService and opens the dashboard', async () => {
    await create();
    const authService = TestBed.inject(AuthService);
    const session = { token: 'jwt-1', user: { id: 7 } };
    spyOn(authService, 'login').and.returnValue(of(session));
    spyOn(authService, 'saveSession');
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

    component.loginForm.setValue({ email: 'sam@example.com', password: 'secret123' });
    component.onSubmit();

    expect(authService.saveSession).toHaveBeenCalledOnceWith(session);
    expect(navigate).toHaveBeenCalledOnceWith(['/dashboard']);
  });
});
