import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../assets/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.rawapiUrl;
  private tokenKey = 'jwt_token';

  constructor(private http: HttpClient) {}

  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}sign-in`, credentials).pipe(
      tap((response: any) => {
        console.log('Login response:', response);
        if (response && response.token) {
          this.setToken(response.token);
        }
      })
    );
  }

  register(userData: {
    username: string;
    password: string;
    fullName: string;
    age: number;
    dni: string;
    phoneNumber: string;
    email: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}sign-up`, userData);
  }

  setToken(token: string): void {
    console.log('Setting token:', token);
    localStorage.setItem(this.tokenKey, token);
    console.log('Token set:', this.getToken());
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    console.log('Token after logout:', this.getToken());
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    console.log('Checking if logged in, token exists:', !!token);
    return !!token;
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    console.log('Getting token:', token);
    return token;
  }
}
