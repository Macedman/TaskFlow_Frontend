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

  it('getTaskDetails posts the cardId and returns the card details', () => {
    const details = {
      card_id: 9, card_title: 'Buy milk', description: 'Semi-skimmed',
      position: 0, due_date: null, created_at: '2026-10-30T00:00:00.000Z',
      list_id: 7, list_name: 'Todo', board_id: 42, board_name: 'Home'
    };
    let result: unknown;
    service.getTaskDetails('9').subscribe(card => (result = card));

    const req = httpMock.expectOne(`${environment.apiUrl}/api/getTaskDetails`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ cardId: '9' });
    req.flush(details);

    expect(result).toEqual(details);
  });

  it('getTaskDetails surfaces a 404 when the card is not accessible', () => {
    let status: number | undefined;
    service.getTaskDetails('999').subscribe({ error: err => (status = err.status) });

    httpMock.expectOne(`${environment.apiUrl}/api/getTaskDetails`)
      .flush({ message: 'Card not found' }, { status: 404, statusText: 'Not Found' });

    expect(status).toBe(404);
  });

  it('addList posts the boardId and name and returns the created list', () => {
    const created = { listId: '7', listName: 'Todo', cards: [] };
    let result: unknown;
    service.addList('42', 'Todo').subscribe(list => (result = list));

    const req = httpMock.expectOne(`${environment.apiUrl}/api/addList`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ boardId: '42', name: 'Todo' });
    req.flush(created);

    expect(result).toEqual(created);
  });

  it('addTask posts the listId and title and returns the created card row', () => {
    const created = {
      id: '9', list_id: '7', title: 'Buy milk', description: '',
      position: 0, due_date: null, created_at: '2026-10-30T00:00:00.000Z'
    };
    let result: unknown;
    service.addTask('7', 'Buy milk').subscribe(card => (result = card));

    const req = httpMock.expectOne(`${environment.apiUrl}/api/addTask`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ listId: '7', title: 'Buy milk' });
    req.flush(created, { status: 201, statusText: 'Created' });

    expect(result).toEqual(created);
  });

  it('updateList posts the listId and name and returns the renamed list', () => {
    const renamed = { listId: '7', listName: 'Doing' };
    let result: unknown;
    service.updateList('7', 'Doing').subscribe(list => (result = list));

    const req = httpMock.expectOne(`${environment.apiUrl}/api/updateList`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ listId: '7', name: 'Doing' });
    req.flush(renamed);

    expect(result).toEqual(renamed);
  });

  it('updateCard sends only the fields being changed', () => {
    const updated = { card_id: 9, card_title: 'Buy milk', description: 'Semi-skimmed' };
    let result: unknown;
    service.updateCard('9', { description: 'Semi-skimmed' }).subscribe(card => (result = card));

    const req = httpMock.expectOne(`${environment.apiUrl}/api/updateCard`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ cardId: '9', description: 'Semi-skimmed' });
    req.flush(updated);

    expect(result).toEqual(updated);
  });

  it('getComments posts the cardId and returns the comments', () => {
    const comments = [
      { comment_id: 3, body: 'Done?', created_at: '2026-11-03T00:00:00.000Z', user_id: 1, author_name: 'Sam' }
    ];
    let result: unknown;
    service.getComments('9').subscribe(list => (result = list));

    const req = httpMock.expectOne(`${environment.apiUrl}/api/getComments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ cardId: '9' });
    req.flush(comments);

    expect(result).toEqual(comments);
  });

  it('addComment posts the cardId and body and returns the saved comment', () => {
    const saved = { comment_id: 4, body: 'Yes', created_at: '2026-11-03T00:00:00.000Z', user_id: 1, author_name: 'Sam' };
    let result: unknown;
    service.addComment('9', 'Yes').subscribe(comment => (result = comment));

    const req = httpMock.expectOne(`${environment.apiUrl}/api/addComment`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ cardId: '9', body: 'Yes' });
    req.flush(saved, { status: 201, statusText: 'Created' });

    expect(result).toEqual(saved);
  });

  it('updateComment posts the commentId and body and returns the edited comment', () => {
    const edited = {
      comment_id: 4, body: 'Changed', created_at: '2026-11-03T00:00:00.000Z',
      updated_at: '2026-11-04T00:00:00.000Z', user_id: 1, author_name: 'Sam'
    };
    let result: unknown;
    service.updateComment(4, 'Changed').subscribe(comment => (result = comment));

    const req = httpMock.expectOne(`${environment.apiUrl}/api/updateComment`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ commentId: 4, body: 'Changed' });
    req.flush(edited);

    expect(result).toEqual(edited);
  });

  it('deleteComment posts only the commentId', () => {
    let result: unknown;
    service.deleteComment(4).subscribe(res => (result = res));

    const req = httpMock.expectOne(`${environment.apiUrl}/api/deleteComment`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ commentId: 4 });
    req.flush({ comment_id: 4 });

    expect(result).toEqual({ comment_id: 4 });
  });

  it('getAttachments posts the cardId and returns the attachments', () => {
    const attachments = [{
      attachment_id: 3, kind: 'link', name: 'Spec', url: 'https://example.com/', size_bytes: null,
      created_at: '2026-11-04T00:00:00.000Z', user_id: 1, author_name: 'Sam'
    }];
    let result: unknown;
    service.getAttachments('9').subscribe(list => (result = list));

    const req = httpMock.expectOne(`${environment.apiUrl}/api/getAttachments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ cardId: '9' });
    req.flush(attachments);

    expect(result).toEqual(attachments);
  });

  it('addLinkAttachment posts the cardId, url and display text', () => {
    service.addLinkAttachment('9', 'https://example.com', 'Spec').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/addLinkAttachment`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ cardId: '9', url: 'https://example.com', name: 'Spec' });
    req.flush({}, { status: 201, statusText: 'Created' });
  });

  it('deleteAttachment posts only the attachmentId', () => {
    service.deleteAttachment(3).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/deleteAttachment`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ attachmentId: 3 });
    req.flush({ attachment_id: 3 });
  });

  it('addTask surfaces a 404 when the list is not accessible', () => {
    let status: number | undefined;
    service.addTask('999', 'Buy milk').subscribe({ error: err => (status = err.status) });

    httpMock.expectOne(`${environment.apiUrl}/api/addTask`)
      .flush({ message: 'List not found' }, { status: 404, statusText: 'Not Found' });

    expect(status).toBe(404);
  });
});
