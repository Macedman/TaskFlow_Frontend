import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { BoardEventsService } from '../services/board-events.service';
import { catchError } from 'rxjs';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);
  const boardEvents = inject(BoardEventsService);
  const router = inject(Router);

  const authToken = authService.getToken();
  if (authToken) {
    let headers = req.headers.set('Authorization', `Bearer ${authToken}`);
    //tells the server which tab made a change, so it doesn't send that tab its own board:changed
    const socketId = boardEvents.socketId;
    if (socketId) {
      headers = headers.set('X-Socket-Id', socketId);
    }
    const authReq = req.clone({ headers });
    return next(authReq).pipe(
      catchError(error => {
        if (error.status === 401) {
          authService.logout();
          router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }
  return next(req);
};
