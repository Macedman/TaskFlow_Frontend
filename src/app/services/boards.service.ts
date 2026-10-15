import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ListType } from '../models/list.model';
import { Board } from '../models/boards.model';

@Injectable({
  providedIn: 'root'
})
export class BoardsService {

  constructor(private http: HttpClient) { }

  //TODO: Add payload for user
  getTasks(userId: string, boardId: string): Observable<ListType[]> {
    return this.http.post<ListType[]>(`${environment.apiUrl}/api/getTasks`, { userId, boardId });
  }

  getTaskDetails(cardId: string):Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/api/getTaskDetails`, {cardId});
  }

  getBoards(userId: string): Observable<Board[]> {
    return this.http.post<Board[]>(`${environment.apiUrl}/api/getBoards`, { userId });
  }
}
