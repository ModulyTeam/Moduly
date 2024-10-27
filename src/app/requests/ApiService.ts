import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // Asegúrate de importar 'map'
import { User } from "../models/User.model";
import { Company } from "../models/Company.model";
import { UserCompany } from "../models/user-company.model";
import { environment } from "../../assets/environment";
import {Module} from "../models/Module.model";
import { Invoice } from "../models/Invoice.model";

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

  getInvoices(moduleId: string, userId: string): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.apiUrl}invoice/bymodule/${moduleId}`, { params: { userId } });
  }

  createInvoice(invoiceData: Partial<Invoice>): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.apiUrl}invoice`, invoiceData);
  }

  getInvoiceById(invoiceId: string): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}invoice/${invoiceId}`);
  }

  updateInvoice(invoiceId: string, invoiceData: Partial<Invoice>): Observable<Invoice> {
    return this.http.put<Invoice>(`${this.apiUrl}invoice/${invoiceId}`, invoiceData);
  }

  deleteInvoice(invoiceId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}invoice/${invoiceId}?userId=${userId}`);
  }

  updateInvoiceStatus(invoiceId: string, status: string, userId: string): Observable<Invoice> {
    return this.http.put<Invoice>(`${this.apiUrl}invoice/${invoiceId}/status`, { status }, { params: { userId } });
  }

  createBank(companyId: string, bankData: {
    name: string;
    accountNumber: string;
    iban: string;
    swift: string;
    accountHolderName: string;
    accountType: string;
    bankAddress: string;
    paymentReference: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/v1/company/${companyId}/banks`, bankData);
  }

  getBanksByCompany(companyId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/v1/company/${companyId}/banks`);
  }

  getBankById(companyId: string, bankId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/v1/company/${companyId}/banks/${bankId}`);
  }

  updateBank(companyId: string, bankId: string, bankData: Partial<any>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/v1/company/${companyId}/banks/${bankId}`, bankData);
  }

  deleteBank(companyId: string, bankId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/v1/company/${companyId}/banks/${bankId}`);
  }

}
