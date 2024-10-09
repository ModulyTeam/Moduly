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
  activeTab: 'create' | 'assign' | 'view' | 'CreateInvitation' = 'create';
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
  userCompanies: UserCompany[] = [];
  selectedUserPermissions: any = null;
  modulesWithDetails: any[] = [];
  permissionsWithDetails: any[] = [];

  selectedPermissionTypes: any[] = [];
  selectedModuleId: string | null = null;
  selectedPermissionTypeId: string | null = null;
  selectedAllowedAction: AllowedActionEnum | null = null;

  assignSuccessMessage: string = '';
  assignErrorMessage: string = '';

  // New properties for invitation
  invitationForm: FormGroup;
  selectedEmployeeForInvitation: User | null = null;
  invitationSuccessMessage: string = '';
  invitationErrorMessage: string = '';
  allUsers: User[] = [];
  filteredUsers: User[] = [];
  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.permissionForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });

    this.invitationForm = this.fb.group({
      userId: ['', Validators.required] // Changed from employeeId to userId
    });

    this.selectedActions = new Array(this.allowedActions.length).fill(false);
  }

  ngOnInit() {
    const companyId = localStorage.getItem('companyId');
    if (companyId) {
      this.loadEmployees(companyId);
      this.loadModules(companyId);
      this.loadPermissionTypes(companyId);
      this.loadAllUsers(companyId);

    }
  }

  setActiveTab(tab: 'create' | 'assign' | 'view' | 'CreateInvitation') {
    this.activeTab = tab;
  }

  onCheckboxChange(index: number) {
    this.selectedActions[index] = !this.selectedActions[index];
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
    this.permissionsWithDetails = [];  // Limpiar los permisos detallados
  }



  prepareAssignPermissions(userId: string) {
    const employee = this.employeesWithDetails.find(emp => emp.userId === userId);
    const companyId = localStorage.getItem('companyId'); // Obtener companyId del localStorage

    if (employee && companyId) {
      this.selectedUserPermissions = employee;
      // Llamar al servicio para obtener los módulos por el companyId
      this.apiService.getModules(companyId).subscribe(
        (modules: Module[]) => {
          this.modules = modules; // Asignar los módulos obtenidos a this.modules
        },
        error => console.error('Error loading modules:', error)
      );
    }
  }


  assignPermissions() {
    const assignerUserId = localStorage.getItem('userId');
    const companyId = localStorage.getItem('companyId');

    if (!this.selectedUserPermissions || !assignerUserId || !companyId || !this.selectedPermissionTypeId || !this.selectedModuleId || !this.selectedAllowedAction) {
      this.assignErrorMessage = 'Please fill out all required fields.';
      return;
    }

    const assignment = {
      assignerUserId,
      targetUserId: this.selectedUserPermissions.userId,
      companyId: companyId,
      moduleId: this.selectedModuleId,
      permissionTypeId: this.selectedPermissionTypeId,
      allowedAction: this.selectedAllowedAction
    };

    this.apiService.assignPermission(assignment).subscribe(
      response => {
        this.assignSuccessMessage = 'Permissions successfully assigned!';
        this.assignErrorMessage = '';
        this.viewUserPermissions(this.selectedUserPermissions.userId);
      },
      error => {
        this.assignSuccessMessage = '';
        this.assignErrorMessage = 'Error assigning permissions: ' + error.message;
      }
    );
  }


  closeAssignPermissions() {
    this.selectedUserPermissions = null;
    this.selectedModuleId = null;
    this.selectedPermissionTypeId = null;
    this.selectedAllowedAction = null;
  }
  loadAllUsers(companyId: string) {
    this.apiService.getAllUsers().subscribe(
      users => {
        this.allUsers = users;
        this.filterAvailableUsers(companyId);
      },
      error => console.error('Error loading users:', error)
    );
  }
  loadEmployees(companyId: string) {
    this.apiService.getEmployeesByCompany(companyId).subscribe(
      (employees: UserCompany[]) => {
        this.employees = employees;
        this.userCompanies = employees;
        this.loadEmployeeDetails();
        this.filterAvailableUsers(companyId);
      }
    );
  }
  filterAvailableUsers(companyId: string) {
    // Filter out users who are already in the company
    const existingUserIds = this.userCompanies.map(uc => uc.userId);
    this.filteredUsers = this.allUsers.filter(user =>
      !existingUserIds.includes(user.id)
    );
  }
  createInvitation() {
    if (this.invitationForm.valid) {
      const transmitterId = localStorage.getItem('userId');
      const companyId = localStorage.getItem('companyId');
      const selectedUserId = this.invitationForm.get('userId')?.value;

      if (!selectedUserId || !transmitterId || !companyId) {
        this.invitationErrorMessage = 'Please select a user and ensure you are logged in.';
        return;
      }

      const invitationData = {
        userId: selectedUserId,
        transmitterId: transmitterId,
        companyId: companyId
      };

      this.apiService.createInvitation(invitationData).subscribe(
        response => {
          this.invitationSuccessMessage = 'Invitation sent successfully!';
          this.invitationErrorMessage = '';
          this.invitationForm.reset();
        },
        error => {
          this.invitationErrorMessage = 'Error sending invitation: ' + error.message;
          this.invitationSuccessMessage = '';
        }
      );
    }
  }

  selectEmployeeForInvitation() {
    const userId = this.invitationForm.get('userId')?.value;
    this.selectedEmployeeForInvitation = this.allUsers.find(user => user.id === userId) || null;
  }

}
