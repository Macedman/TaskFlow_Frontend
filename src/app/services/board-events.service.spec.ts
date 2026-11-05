import { TestBed } from '@angular/core/testing';
import { Socket } from 'socket.io-client';

import { BoardEventsService, SOCKET_FACTORY } from './board-events.service';
import { AuthService } from './auth.service';

// Just enough of a socket.io client: records what was sent and lets a test fire server events
class FakeSocket {
  connected = false;
  id: string | undefined;
  sent: [string, unknown][] = [];
  disconnected = false;
  private handlers: Record<string, ((...args: any[]) => void)[]> = {};

  on(event: string, handler: (...args: any[]) => void) {
    (this.handlers[event] ||= []).push(handler);
    return this;
  }
  off(event: string, handler: (...args: any[]) => void) {
    this.handlers[event] = (this.handlers[event] || []).filter(h => h !== handler);
    return this;
  }
  emit(event: string, arg: unknown) {
    this.sent.push([event, arg]);
    return this;
  }
  disconnect() {
    this.disconnected = true;
    this.connected = false;
    return this;
  }
  // as the server
  fire(event: string, ...args: unknown[]) {
    if (event === 'connect') { this.connected = true; this.id = 'sock-1'; }
    if (event === 'disconnect') { this.connected = false; }
    (this.handlers[event] || []).forEach(h => h(...args));
  }
}

describe('BoardEventsService', () => {
  let service: BoardEventsService;
  let socket: FakeSocket;
  let factory: jasmine.Spy;

  beforeEach(() => {
    socket = new FakeSocket();
    factory = jasmine.createSpy('io').and.callFake(() => socket as unknown as Socket);
    TestBed.configureTestingModule({
      providers: [
        { provide: SOCKET_FACTORY, useValue: factory },
        { provide: AuthService, useValue: { getToken: () => 'jwt-1' } },
      ]
    });
    service = TestBed.inject(BoardEventsService);
  });

  it('connects with the current token and joins the board once connected', () => {
    service.boardChanges('42').subscribe();
    expect(factory).toHaveBeenCalledTimes(1);

    let auth: unknown;
    factory.calls.mostRecent().args[1].auth((data: unknown) => (auth = data));
    expect(auth).toEqual({ token: 'jwt-1' });

    expect(socket.sent).toEqual([]);
    socket.fire('connect');
    expect(socket.sent).toEqual([['joinBoard', '42']]);
  });

  it('emits when this board changes and ignores other boards', () => {
    let changes = 0;
    service.boardChanges('42').subscribe(() => changes++);
    socket.fire('connect');

    socket.fire('board:changed', { boardId: 42 });
    socket.fire('board:changed', { boardId: 7 });

    expect(changes).toBe(1);
  });

  it('joins again and refreshes once after a reconnect', () => {
    let changes = 0;
    service.boardChanges('42').subscribe(() => changes++);
    socket.fire('connect');
    expect(changes).toBe(0);

    socket.fire('disconnect');
    socket.fire('connect');

    expect(socket.sent).toEqual([['joinBoard', '42'], ['joinBoard', '42']]);
    expect(changes).toBe(1);
  });

  it('shares one socket, leaves on unsubscribe and closes it after the last board', () => {
    const first = service.boardChanges('42').subscribe();
    const second = service.boardChanges('7').subscribe();
    socket.fire('connect');
    expect(factory).toHaveBeenCalledTimes(1);

    first.unsubscribe();
    expect(socket.sent).toContain(['leaveBoard', '42']);
    expect(socket.disconnected).toBeFalse();

    second.unsubscribe();
    expect(socket.disconnected).toBeTrue();
  });

  it('only reports a socket id while connected', () => {
    expect(service.socketId).toBeUndefined();
    service.boardChanges('42').subscribe();
    expect(service.socketId).toBeUndefined();

    socket.fire('connect');
    expect(service.socketId).toBe('sock-1');
  });
});
