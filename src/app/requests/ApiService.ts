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
import {PermissionAssignment} from "../models/PermissionAssignment";
import {PermissionType} from "../models/PermissionType";
import {Bank} from "../models/Bank.model";
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  private exchangeRateUrl = 'https://v6.exchangerate-api.com/v6/01a33f09590295ef36d111a5/latest/USD';

  constructor(private http: HttpClient) {}
  createInvitation(invitationData: {
    userId: string;
    transmitterId: string;
    companyId: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}company/invitations`, invitationData);
  }

  updateInvitationStatus(invitationId: string, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}company/invitations/${invitationId}/status`, { status });
  }

  getInvitationById(invitationId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}company/invitations/${invitationId}`);
  }

  getPendingInvitations(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}company/invitations/pending/${userId}`);
  }

  getSentInvitations(transmitterId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}company/invitations/sent/${transmitterId}`);
  }
  getUserByUsername(username: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}user/getbyusername/${username}`);
  }

  getCompaniesByCreatorId(creatorId: string): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.apiUrl}company/getbycreatorid/${creatorId}`);
  }

  getEmployeesByCompany(companyId: string): Observable<UserCompany[]> {
    return this.http.get<UserCompany[]>(`${this.apiUrl}company/getemployeesbycompany/${companyId}`);
  }
  getPermissionTypes(companyId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}permission-assignment/company/${companyId}/permission-types`);
  }
  getCompanyById(companyId: string): Observable<Company> {
    return this.http.get<Company>(`${this.apiUrl}company/${companyId}`);
  }
  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}user/${userId}`);
  }

  createPermissionType(permissionType: PermissionType): Observable<any> {
    return this.http.post(`${this.apiUrl}permission-assignment/create-permission-type`, permissionType);
  }

  assignPermission(assignment: {
    companyId: string;
    assignerUserId: string;
    permissionTypeId: any;
    targetUserId: any;
    allowedAction: any;
    moduleId: any
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}permission-assignment/assign`, assignment);
  }

  getUserPermissions(userCompanyId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}permission-assignment/${userCompanyId}`);
  }

  getPermissionsByCompany(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}permission-assignment/company/${userId}`);
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
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}user`);
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

  getBanksFromCompany(companyId: string): Observable<Bank[]> {
    return this.http.get<{ banks: Bank[] }>(`${this.apiUrl}company/${companyId}`).pipe(
      map(response => response.banks)
    );
  }



}
