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

  // The server answers with a message only, no token, so callers log in afterwards.
  signup(fullname: string, email: string, password: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/signup`,
      { fullname, email, password });
  }

   login(email: string, password: string): Observable<any> {
      return this.http.post(`${environment.apiUrl}/api/login`,
        { email, password });
    }

    // Login and signup both end here, so the session is always stored the same way
    saveSession(response: { token: string; user: unknown }) {
      localStorage.setItem('Bearer ', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    // the user too, so the next person on this browser doesn't see the last one's name and email
    logout() {
      localStorage.removeItem('Bearer ');
      localStorage.removeItem('user');
      this.router.navigate(['/login']);
    }

    isLoggedIn() {
      const token = localStorage.getItem('Bearer ');
      return !!token && !this.isTokenExpired(token);
    }

    getToken() {
      return localStorage.getItem('Bearer ');
    }

    isTokenExpired(token: string | null): boolean {
      if (!token) {
        return true;
      }

      try {
        const decoded = this.decodeToken(token);
        if (!decoded || !decoded.exp) {
          return true;
        }

        const currentTime = Math.floor(Date.now() / 1000);
        return decoded.exp < currentTime;
      } catch (error) {
        console.error('Error decoding token:', error);
        return true;
      }
    }

    private decodeToken(token: string): any {
      try {
        const parts = token.split('.');
        if (parts.length !== 3) {
          return null;
        }

        const decoded = JSON.parse(atob(parts[1]));
        return decoded;
      } catch (error) {
        console.error('Error parsing token:', error);
        return null;
      }
    }

}
