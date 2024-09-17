// src/app/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {User} from "../models/User.model";
import {Company} from "../models/Company.model";
import {UserCompany} from "../models/user-company.model";
import {environment} from "../../assets/environment";
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl; // Ajusta según tu configuración

  constructor(private http: HttpClient) {}

  getUserByUsername(username: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}user/getbyusername/${username}`);
  }

  getCompaniesByCreatorId(creatorId: string): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.apiUrl}company/getbycreatorid/${creatorId}`);
  }

  getEmployeesByCompany(companyId: string): Observable<UserCompany[]> {
    return this.http.get<UserCompany[]>(`${this.apiUrl}company/getemployeesbycompany/${companyId}`);
  }
}
