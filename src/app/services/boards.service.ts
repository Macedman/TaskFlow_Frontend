import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ListType } from '../models/list.model';
import { Board, BoardMember } from '../models/boards.model';
import { CardAttachment, CardChanges, CardComment, CardDetailsResponse, NewCardResponse } from '../models/card-details.model';

@Injectable({
  providedIn: 'root'
})
export class BoardsService {

  constructor(private http: HttpClient) { }

  // The API identifies the user from the JWT (added by authInterceptor), not from the body.
  getTasks(boardId: string): Observable<ListType[]> {
    return this.http.post<ListType[]>(`${environment.apiUrl}/api/getTasks`, { boardId });
  }

  getTaskDetails(cardId: string): Observable<CardDetailsResponse> {
    return this.http.post<CardDetailsResponse>(`${environment.apiUrl}/api/getTaskDetails`, { cardId });
  }

  getBoards(): Observable<Board[]> {
    return this.http.post<Board[]>(`${environment.apiUrl}/api/getBoards`, {});
  }

  // The caller becomes the owner (taken from the JWT). The server wraps the row in { message, board }.
  createBoard(name: string): Observable<Board> {
    return this.http
      .post<{ board: Board }>(`${environment.apiUrl}/api/createBoards`, { name })
      .pipe(map(({ board }) => board));
  }

  // Returns the created list in the same shape as a getTasks list, so it can be added to the board as-is.
  addList(boardId: string, name: string): Observable<ListType> {
    return this.http.post<ListType>(`${environment.apiUrl}/api/addList`, { boardId, name });
  }

  updateList(listId: string, name: string): Observable<Pick<ListType, 'listId' | 'listName'>> {
    return this.http.post<Pick<ListType, 'listId' | 'listName'>>(`${environment.apiUrl}/api/updateList`, { listId, name });
  }

  updateCard(cardId: string, changes: CardChanges): Observable<Pick<CardDetailsResponse, 'card_id' | 'card_title' | 'description'>> {
    return this.http.post<Pick<CardDetailsResponse, 'card_id' | 'card_title' | 'description'>>(`${environment.apiUrl}/api/updateCard`, { cardId, ...changes });
  }

  // Newest first; the author comes from the JWT on the server, never from the body.
  getComments(cardId: string): Observable<CardComment[]> {
    return this.http.post<CardComment[]>(`${environment.apiUrl}/api/getComments`, { cardId });
  }

  addComment(cardId: string, body: string): Observable<CardComment> {
    return this.http.post<CardComment>(`${environment.apiUrl}/api/addComment`, { cardId, body });
  }

  // Only the author can edit; the server answers 404 for anyone else.
  updateComment(commentId: number, body: string): Observable<CardComment> {
    return this.http.post<CardComment>(`${environment.apiUrl}/api/updateComment`, { commentId, body });
  }

  // The author or the board owner can delete.
  deleteComment(commentId: number): Observable<{ comment_id: number }> {
    return this.http.post<{ comment_id: number }>(`${environment.apiUrl}/api/deleteComment`, { commentId });
  }

  // Newest first.
  getAttachments(cardId: string): Observable<CardAttachment[]> {
    return this.http.post<CardAttachment[]>(`${environment.apiUrl}/api/getAttachments`, { cardId });
  }

  // The server only accepts http/https links and answers 400 for anything else.
  addLinkAttachment(cardId: string, url: string, name: string): Observable<CardAttachment> {
    return this.http.post<CardAttachment>(`${environment.apiUrl}/api/addLinkAttachment`, { cardId, url, name });
  }

  // Sent as form data, not JSON; the server checks it really is a PDF and at most 5 MB,
  // and answers 507 once all stored PDFs together reach its cap.
  uploadPdfAttachment(cardId: string, file: File): Observable<CardAttachment> {
    const form = new FormData();
    form.append('cardId', cardId);
    form.append('file', file);
    return this.http.post<CardAttachment>(`${environment.apiUrl}/api/uploadPdfAttachment`, form);
  }

  // A link that works for a few minutes. Local storage answers with a path on the API and
  // cloud storage with a full URL, so resolve it against the API either way.
  getAttachmentDownloadUrl(attachmentId: number): Observable<string> {
    return this.http
      .post<{ url: string }>(`${environment.apiUrl}/api/getAttachmentDownloadUrl`, { attachmentId })
      .pipe(map(({ url }) => new URL(url, environment.apiUrl).href));
  }

  // The uploader or the board owner can delete.
  deleteAttachment(attachmentId: number): Observable<{ attachment_id: number }> {
    return this.http.post<{ attachment_id: number }>(`${environment.apiUrl}/api/deleteAttachment`, { attachmentId });
  }

  // position is the card's index in the target list after the move; the server renumbers both lists.
  moveCard(cardId: string, listId: string, position: number): Observable<{ card_id: number; list_id: number; position: number }> {
    return this.http.post<{ card_id: number; list_id: number; position: number }>(
      `${environment.apiUrl}/api/moveCard`, { cardId, listId, position });
  }

  // Anyone on the board can see who's on it.
  getBoardMembers(boardId: string): Observable<BoardMember[]> {
    return this.http.post<BoardMember[]>(`${environment.apiUrl}/api/getBoardMembers`, { boardId });
  }

  // Owner only. Adds an existing account straight away; 404 when no account has that email.
  addBoardMember(boardId: string, email: string): Observable<BoardMember> {
    return this.http.post<BoardMember>(`${environment.apiUrl}/api/addBoardMember`, { boardId, email });
  }

  // Owner only. memberId is the person being removed, never the caller.
  removeBoardMember(boardId: string, memberId: number): Observable<{ user_id: number }> {
    return this.http.post<{ user_id: number }>(`${environment.apiUrl}/api/removeBoardMember`, { boardId, memberId });
  }

  // Returns the raw cards row; callers map it to the Card shape the board uses.
  addTask(listId: string, title: string): Observable<NewCardResponse> {
    return this.http.post<NewCardResponse>(`${environment.apiUrl}/api/addTask`, { listId, title });
  }
}
