import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../requests/ApiService';

import {UserCompany} from "../models/user-company.model";
import {AllowedActionEnum} from "../models/AllowedActionEnum";
import {PermissionType} from "../models/PermissionType";

import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';


@Component({
  selector: 'app-management-admin-module',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './management-admin-module.component.html',
  styleUrl: './management-admin-module.component.css'
})
export class ManagementAdminModuleComponent implements OnInit {
  activeTab: 'create' | 'assign' = 'create';
  permissionForm: FormGroup;
  employees: UserCompany[] = [];
  modules: any[] = [];
  selectedActions: boolean[] = [];
  allowedActions = Object.keys(AllowedActionEnum)
    .filter(key => isNaN(Number(key)))
    .map(key => ({
      value: AllowedActionEnum[key as keyof typeof AllowedActionEnum],
      label: key.replace(/_/g, ' ').toLowerCase()
    }));

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.permissionForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });

    // Initialize selectedActions array
    this.selectedActions = new Array(this.allowedActions.length).fill(false);
  }

  ngOnInit() {
    const companyId = localStorage.getItem('companyId');
    if (companyId) {
      this.loadEmployees(companyId);
      this.loadModules(companyId);
    }
  }

  setActiveTab(tab: 'create' | 'assign') {
    this.activeTab = tab;
  }

  onCheckboxChange(index: number) {
    this.selectedActions[index] = !this.selectedActions[index];
  }

  loadEmployees(companyId: string) {
    this.apiService.getEmployeesByCompany(companyId).subscribe(
      employees => this.employees = employees
    );
  }

  loadModules(companyId: string) {
    this.apiService.getModules(companyId).subscribe(
      modules => this.modules = modules
    );
  }

  createPermissionType() {
    if (this.permissionForm.valid) {
      const userId = localStorage.getItem('userId');
      const companyId = localStorage.getItem('companyId');

      if (userId && companyId) {
        const selectedActions = this.selectedActions
          .map((checked, index) => checked ? this.allowedActions[index].value : null)
          .filter((value): value is AllowedActionEnum => value !== null);

        const permissionType: PermissionType = {
          name: this.permissionForm.get('name')?.value,
          description: this.permissionForm.get('description')?.value,
          userId,
          companyId,
          allowedActions: selectedActions
        };

        this.apiService.createPermissionType(permissionType).subscribe(
          response => {
            console.log('Permission type created:', response);
            this.permissionForm.reset();
            this.selectedActions = new Array(this.allowedActions.length).fill(false);
          },
          error => console.error('Error creating permission type:', error)
        );
      }
    }
  }
}
