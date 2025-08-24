import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ListType } from '../models/list.model';

@Injectable({
  providedIn: 'root'
})
export class BoardsService {

  constructor(private http: HttpClient) { }

  //TODO: Add payload for user
  getTasks(userId: string): Observable<ListType> {
    return this.http.post<ListType>(`${environment.apiUrl}/api/getTasks`, { userId  });
  }
}
