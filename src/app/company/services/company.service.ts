import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from "../../../assets/environment";

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private apiUrl = environment;

  constructor(private http: HttpClient) {}

  createCompany(companyData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/companies`, companyData);
  }
}
