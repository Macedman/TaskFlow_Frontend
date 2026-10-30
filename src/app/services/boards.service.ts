import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ListType } from '../models/list.model';
import { Board } from '../models/boards.model';
import { CardDetailsResponse, NewCardResponse } from '../models/card-details.model';

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

  // Returns the raw cards row; callers map it to the Card shape the board uses.
  addTask(listId: string, title: string): Observable<NewCardResponse> {
    return this.http.post<NewCardResponse>(`${environment.apiUrl}/api/addTask`, { listId, title });
  }
}
