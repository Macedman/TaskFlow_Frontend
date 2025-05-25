import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient, private router: Router) { }

  signup(email: string, password: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/signup`,
      { email, password });
  }

   login(email: string, password: string): Observable<any> {
      return this.http.post(`${environment.apiUrl}/api/login`,
        { email, password });
    }

    logout() {
      localStorage.removeItem('Bearer ');
      this.router.navigate(['/login']);
    }

    isLoggedIn() {
      return !!localStorage.getItem('Bearer ');
    }

    getToken() {
      return localStorage.getItem('Bearer ');
    }

}
