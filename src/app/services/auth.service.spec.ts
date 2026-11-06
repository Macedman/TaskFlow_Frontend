import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('Bearer ');
    localStorage.removeItem('user');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // the server rejects a signup without fullname with a 400
  it('signup sends the full name with the email and password', () => {
    service.signup('Sam Smith', 'sam@example.com', 'secret123').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/signup`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ fullname: 'Sam Smith', email: 'sam@example.com', password: 'secret123' });
    req.flush({ message: 'User created successfully! ' });
  });

  it('saveSession stores the token and the user where the rest of the app reads them', () => {
    service.saveSession({ token: 'jwt-1', user: { id: 7, email: 'sam@example.com' } });

    expect(service.getToken()).toBe('jwt-1');
    expect(JSON.parse(localStorage.getItem('user')!)).toEqual({ id: 7, email: 'sam@example.com' });
  });
});
