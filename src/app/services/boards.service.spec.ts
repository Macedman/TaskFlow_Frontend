import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { BoardsService } from './boards.service';
import { environment } from '../../environments/environment';

describe('BoardsService', () => {
  let service: BoardsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(BoardsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // The API takes the user from the JWT, so the body must not carry a userId.
  it('getBoards does not send a userId', () => {
    service.getBoards().subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/getBoards`);
    expect(req.request.body).toEqual({});
    req.flush([]);
  });

  it('getTasks sends only the boardId', () => {
    service.getTasks('42').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/getTasks`);
    expect(req.request.body).toEqual({ boardId: '42' });
    req.flush([]);
  });
});
