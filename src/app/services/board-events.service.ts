import { Injectable, InjectionToken, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { io, ManagerOptions, Socket, SocketOptions } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

// How the service opens a socket; tests swap in a fake
export const SOCKET_FACTORY = new InjectionToken<(url: string, options: Partial<ManagerOptions & SocketOptions>) => Socket>(
  'SOCKET_FACTORY',
  { providedIn: 'root', factory: () => io }
);

export type BoardEvent = 'changed' | 'removed';

// Tells the board when someone else changed it. The message carries no card data:
// the board re-fetches over the REST API, so the server's order is always what's shown.
@Injectable({
  providedIn: 'root'
})
export class BoardEventsService {
  private authService = inject(AuthService);
  private createSocket = inject(SOCKET_FACTORY);
  private socket?: Socket;
  private watchers = 0;

  // Sent as X-Socket-Id with API calls so the server doesn't echo our own changes back to us
  get socketId(): string | undefined {
    return this.socket?.connected ? this.socket.id : undefined;
  }

  // Emits 'changed' each time the board changes elsewhere, and 'removed' if the owner takes
  // us off it. Unsubscribing leaves the board, and closes the socket once no board is being
  // watched (e.g. after logout).
  boardChanges(boardId: string): Observable<BoardEvent> {
    return new Observable<BoardEvent>(subscriber => {
      const socket = this.connect();
      let joinedBefore = false;

      // the server forgets rooms when a socket drops, so join again on every (re)connect;
      // changes made while we were offline were never sent, so refresh once after a reconnect
      const join = () => {
        socket.emit('joinBoard', boardId);
        if (joinedBefore) subscriber.next('changed');
        joinedBefore = true;
      };
      const forThisBoard = (type: BoardEvent) => (event: { boardId: number }) => {
        if (String(event.boardId) === boardId) subscriber.next(type);
      };
      const onChange = forThisBoard('changed');
      const onRemoved = forThisBoard('removed');

      socket.on('connect', join);
      socket.on('board:changed', onChange);
      socket.on('board:removed', onRemoved);
      if (socket.connected) join();

      return () => {
        socket.off('connect', join);
        socket.off('board:changed', onChange);
        socket.off('board:removed', onRemoved);
        socket.emit('leaveBoard', boardId);
        if (--this.watchers === 0) {
          socket.disconnect();
          this.socket = undefined;
        }
      };
    });
  }

  private connect(): Socket {
    this.watchers++;
    if (!this.socket) {
      // a function, so a reconnect sends the current token rather than the one from the first connect
      this.socket = this.createSocket(environment.apiUrl, {
        auth: callback => callback({ token: this.authService.getToken() })
      });
    }
    return this.socket;
  }
}
