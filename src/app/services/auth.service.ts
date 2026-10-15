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
        console.log('Decoded Token:', decoded);
        if (!decoded || !decoded.exp) {
          return true;
        }

        const currentTime = Math.floor(Date.now() / 1000);
        console.log('Current Time:', currentTime, 'Token Expiration Time:', decoded.exp);
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
