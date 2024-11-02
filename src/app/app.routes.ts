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
import {ManagementAdminModuleComponent} from "./management-admin-module/management-admin-module.component";
import {AccountComponent} from "./account/account.component";
import {InvoicetoletterComponent} from "./invoicetoletter/invoicetoletter.component";
import {FinancialHelperBanksComponent} from "./Logic/financial-helper-banks/financial-helper-banks.component";

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'create-company', component: CreateCompanyComponent, canActivate: [AuthGuard] },
  { path: 'dashboard', component: MainComponent, canActivate: [AuthGuard] },
  { path: 'manage/:id', component: CompanyManagerComponent, canActivate: [AuthGuard] },
  { path: 'management-module/:id', component: ManagementModuleComponent, canActivate: [AuthGuard] },
  { path: 'management-admin-module/:id', component: ManagementAdminModuleComponent, canActivate: [AuthGuard] },
  { path: 'financial-helper/:moduleId', component: FinancialHelperComponent, canActivate: [AuthGuard] },
  { path: 'financial-helper-banks/:moduleId', component: FinancialHelperBanksComponent, canActivate: [AuthGuard] },
  { path: 'emitpdfletteinvoice/:id', component: InvoicetoletterComponent, canActivate: [AuthGuard] },
  { path: 'account', component: AccountComponent, canActivate: [AuthGuard] },

  { path: '**', redirectTo: '/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
