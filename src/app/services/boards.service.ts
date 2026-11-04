import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ListType } from '../models/list.model';
import { Board } from '../models/boards.model';
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

  // The uploader or the board owner can delete.
  deleteAttachment(attachmentId: number): Observable<{ attachment_id: number }> {
    return this.http.post<{ attachment_id: number }>(`${environment.apiUrl}/api/deleteAttachment`, { attachmentId });
  }

  // Returns the raw cards row; callers map it to the Card shape the board uses.
  addTask(listId: string, title: string): Observable<NewCardResponse> {
    return this.http.post<NewCardResponse>(`${environment.apiUrl}/api/addTask`, { listId, title });
  }
}
