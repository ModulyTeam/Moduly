import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  createCompany(companyData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/companies`, companyData);
  }
}
