import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private apiUrl = 'http://localhost:3000/api/permissions';

  constructor(private http: HttpClient) {}

  getPermissions(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}
