import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { BoardEventsService } from '../services/board-events.service';

describe('authInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => authInterceptor(req, next));

  let token: string | null;
  let socketId: string | undefined;
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    token = 'jwt-1';
    socketId = undefined;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), provideRouter([]),
        { provide: AuthService, useValue: { getToken: () => token, logout: () => {} } },
        { provide: BoardEventsService, useValue: { get socketId() { return socketId; } } },
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  const sentHeaders = () => {
    http.get('/api/x').subscribe();
    const req = httpMock.expectOne('/api/x');
    req.flush({});
    return req.request.headers;
  };

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('adds the token and, while the socket is connected, its id', () => {
    socketId = 'sock-1';
    const headers = sentHeaders();
    expect(headers.get('Authorization')).toBe('Bearer jwt-1');
    expect(headers.get('X-Socket-Id')).toBe('sock-1');
  });

  it('leaves out X-Socket-Id when there is no socket', () => {
    expect(sentHeaders().has('X-Socket-Id')).toBeFalse();
  });

  it('adds nothing when logged out', () => {
    token = null;
    socketId = 'sock-1';
    const headers = sentHeaders();
    expect(headers.has('Authorization')).toBeFalse();
    expect(headers.has('X-Socket-Id')).toBeFalse();
  });
});
