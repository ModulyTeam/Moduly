import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from "./auth/login/login.component";
import { RegisterComponent } from "./auth/register/register.component";
import { CreateCompanyComponent } from "./company/create-company/create-company.component";
import { MainComponent } from "./dashboard/main/main.component";
import { CompanyManagerComponent } from "./company/company-manager/company-manager.component";
import { AuthGuard } from "./auth/services/auth.guard";
import {ManagementModuleComponent} from "./management-module/management-module.component";
import {FinancialHelperComponent} from "./Logic/financial-helper/financial-helper.component";

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'create-company', component: CreateCompanyComponent, canActivate: [AuthGuard] },
  { path: 'dashboard', component: MainComponent, canActivate: [AuthGuard] },
  { path: 'manage/:id', component: CompanyManagerComponent, canActivate: [AuthGuard] },
  { path: 'management-module/:id', component: ManagementModuleComponent, canActivate: [AuthGuard] },
  { path: 'financial-helper/:moduleId', component: FinancialHelperComponent, canActivate: [AuthGuard] },

  { path: '**', redirectTo: '/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
