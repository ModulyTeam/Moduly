import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // Asegúrate de importar 'map'
import { User } from "../models/User.model";
import { Company } from "../models/Company.model";
import { UserCompany } from "../models/user-company.model";
import { environment } from "../../assets/environment";
import {Module} from "../models/Module.model";

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  private exchangeRateUrl = 'https://v6.exchangerate-api.com/v6/01a33f09590295ef36d111a5/latest/USD';

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

  getCompanyById(companyId: string): Observable<Company> {
    return this.http.get<Company>(`${this.apiUrl}company/${companyId}`);
  }

  getDollarValue(): Observable<number> {
    return this.http.get<any>(this.exchangeRateUrl).pipe(
      map(response => response.conversion_rates.USD)
    );
  }
  getExchangeRates(): Observable<any> {
    return this.http.get<any>(this.exchangeRateUrl);
  }
  createModule(moduleData: Module): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}module`, moduleData);
  }
  getModules(companyId: string): Observable<Module[]> {
    return this.http.get<Module[]>(`${this.apiUrl}module/company/${companyId}`);
  }
  updateModule(moduleData: Module): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}module/${moduleData.id}`, moduleData);
  }
  deleteModule(id: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}module/${id}?userId=${userId}`);
  }
  getModuleById(id: string): Observable<Module> {
    return this.http.get<Module>(`${this.apiUrl}module/${id}`);
  }


}
