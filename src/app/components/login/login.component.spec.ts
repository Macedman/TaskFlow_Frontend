import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject } from 'rxjs';

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

  // The free host sleeps when idle, so the first login can take up to a minute
  describe('when the server is slow to answer', () => {
    const waking = 'Waking up the server';
    let reply: Subject<unknown>;
    const text = () => (fixture.nativeElement as HTMLElement).textContent as string;

    const submitAndWait = (ms: number) => {
      component.loginForm.setValue({ email: 'sam@example.com', password: 'secret123' });
      component.onSubmit();
      tick(ms);
      fixture.detectChanges();
    };

    beforeEach(async () => {
      await create();
      reply = new Subject();
      spyOn(TestBed.inject(AuthService), 'login').and.returnValue(reply);
      spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    });

    it('says nothing for the first 3 seconds', fakeAsync(() => {
      submitAndWait(2999);
      expect(text()).not.toContain(waking);
      reply.complete();
    }));

    it('explains the wait after 3 seconds, and stops once the server answers', fakeAsync(() => {
      submitAndWait(3000);
      expect(text()).toContain('Waking up the server — this can take up to a minute on the free plan…');

      reply.next({ token: 'jwt-1', user: { id: 7 } });
      reply.complete();
      fixture.detectChanges();
      expect(text()).not.toContain(waking);
    }));

    it('stops explaining when the login fails, and shows the error instead', fakeAsync(() => {
      submitAndWait(3000);
      reply.error({ error: { message: 'Invalid email or password' } });
      fixture.detectChanges();

      expect(text()).not.toContain(waking);
      expect(text()).toContain('Invalid email or password');
    }));
  });
});
