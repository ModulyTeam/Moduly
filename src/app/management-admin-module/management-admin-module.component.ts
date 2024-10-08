import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../requests/ApiService';

import { UserCompany } from "../models/user-company.model";
import { AllowedActionEnum } from "../models/AllowedActionEnum";
import { PermissionType } from "../models/PermissionType";

import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import {forkJoin} from "rxjs";
import {User} from "../models/User.model";
import {Module} from "../models/Module.model";

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
  activeTab: 'create' | 'assign' | 'view' = 'create';
  permissionForm: FormGroup;
  employees: any[] = [];
  modules: any[] = [];
  selectedActions: boolean[] = [];
  permissionTypes: any[] = [];
  allowedActions = Object.keys(AllowedActionEnum)
    .filter(key => isNaN(Number(key)))
    .map(key => ({
      value: AllowedActionEnum[key as keyof typeof AllowedActionEnum],
      label: key.replace(/_/g, ' ').toLowerCase()
    }));
  employeesWithDetails: (UserCompany & User)[] = [];
//new
  userCompanies: UserCompany[] = [];  // Nuevo array para almacenar los UserCompany
  selectedUserPermissions: any = null;
  modulesWithDetails: any[] = []; //  detalles de los módulos
  permissionsWithDetails: any[] = []; //  permisos detallados
  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.permissionForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });

    this.selectedActions = new Array(this.allowedActions.length).fill(false);
  }

  ngOnInit() {
    const companyId = localStorage.getItem('companyId');
    if (companyId) {
      this.loadEmployees(companyId);
      this.loadModules(companyId);
      this.loadPermissionTypes(companyId);
    }
  }

  setActiveTab(tab: 'create' | 'assign' | 'view') {
    this.activeTab = tab;
  }

  onCheckboxChange(index: number) {
    this.selectedActions[index] = !this.selectedActions[index];
  }

  loadEmployees(companyId: string) {
    this.apiService.getEmployeesByCompany(companyId).subscribe(
      (employees: UserCompany[]) => {
        this.employees = employees;
        this.userCompanies = employees;  // Almacenar los UserCompany originales

        this.loadEmployeeDetails();
      }
    );
  }
  loadEmployeeDetails() {
    const userRequests = this.employees.map(employee =>
      this.apiService.getUserById(employee.userId)
    );

    forkJoin(userRequests).subscribe(
      (users: User[]) => {
        this.employeesWithDetails = this.employees.map((employee, index) => ({
          ...employee,
          ...users[index]
        }));
      },
      error => console.error('Error loading user details:', error)
    );
  }
  loadModules(companyId: string) {
    this.apiService.getModules(companyId).subscribe(
      modules => this.modules = modules
    );
  }

  loadPermissionTypes(companyId: string) {
    this.apiService.getPermissionTypes(companyId).subscribe(
      permissionTypes => this.permissionTypes = permissionTypes,
      error => console.error('Error loading permission types:', error)
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
            this.loadPermissionTypes(companyId);
          },
          error => console.error('Error creating permission type:', error)
        );
      }
    }
  }

  refreshPermissionTypes() {
    const companyId = localStorage.getItem('companyId');
    if (companyId) {
      this.loadPermissionTypes(companyId);
    }
  }
  viewUserPermissions(userId: string) {
    const employee = this.employeesWithDetails.find(emp => emp.userId === userId);
    if (employee) {
      const userCompany = this.userCompanies.find(emp => emp.userId === userId);
      if (userCompany) {
        this.apiService.getUserPermissions(userCompany.id).subscribe(
          (permissions: any[]) => {
            // Obtenemos los detalles del módulo utilizando el moduleId
            const moduleRequests = permissions.map((permission: { moduleId: string; }) =>
              this.apiService.getModuleById(permission.moduleId)
            );

            // Mapear los permisos junto con los detalles de los módulos
            forkJoin(moduleRequests).subscribe(
              (modules: Module[]) => {
                console.log('Modules:', modules);  // Verifica que los módulos lleguen correctamente
                this.permissionsWithDetails = permissions.map((permission: any, index: number) => ({
                  module: {
                    id: permission.moduleId,
                    name: modules[index]?.moduleName || 'Unknown',
                    type: modules[index]?.moduleType || 'Unknown',
                    creationDate: modules[index]?.creationDate || 'Unknown'
                  },
                  permissionTypeName: permission.permissionType.name,
                  permissionTypeDescription: permission.permissionType.description || 'No description available',
                  isGranted: permission.isGranted ? 'Yes' : 'No'
                }));
              },
              error => console.error('Error loading module details:', error)
            );
          },
          error => console.error('Error loading user permissions:', error)
        );
      } else {
        console.error('UserCompany not found for userId:', userId);
      }
    } else {
      console.error('Employee not found');
    }
  }




  closeUserPermissions() {
    this.selectedUserPermissions = null;
  }
}
