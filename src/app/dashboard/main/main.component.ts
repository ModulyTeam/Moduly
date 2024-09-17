// src/app/main/main.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {ApiService} from "../../requests/ApiService";
import { forkJoin } from 'rxjs';
import { User } from '../../models/User.model';
import {Company} from "../../models/Company.model";
import {UserCompany} from "../../models/user-company.model";
@Component({
  selector: 'app-main',
  standalone: true,
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  imports: [CommonModule]
})
export class MainComponent implements OnInit {
  companyData = {
    createdCompanies: '0',
    employees: 0,
  };

  constructor(private router: Router, private apiService: ApiService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  private loadDashboardData() {
    const username = localStorage.getItem('username');
    if (username) {
      this.apiService.getUserByUsername(username).subscribe(
        (userData: User) => {
          localStorage.setItem('userId', userData.id);
          this.loadCompanyData(userData.id);
        },
        (error: any) => {
          console.error('Error fetching user data:', error);
        }
      );
    }
  }

  private loadCompanyData(creatorId: string) {
    this.apiService.getCompaniesByCreatorId(creatorId).subscribe(
      (companies: Company[]) => {
        this.companyData.createdCompanies = companies.length.toString();
        this.loadEmployeesData(companies);
      },
      (error: any) => {
        console.error('Error fetching company data:', error);
      }
    );
  }

  private loadEmployeesData(companies: Company[]) {
    const employeeRequests = companies.map(company =>
      this.apiService.getEmployeesByCompany(company.id)
    );

    forkJoin(employeeRequests).subscribe(
      (employeesData: UserCompany[][]) => {
        this.companyData.employees = employeesData.reduce((total, employees) => total + employees.length, 0);
      },
      (error: any) => {
        console.error('Error fetching employees data:', error);
      }
    );
  }
}
