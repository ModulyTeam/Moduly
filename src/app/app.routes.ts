import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from "./auth/login/login.component";
import { RegisterComponent } from "./auth/register/register.component";
import { CreateCompanyComponent } from "./company/create-company/create-company.component";
import { MainComponent } from "./dashboard/main/main.component";
import { UserListComponent } from "./users/user-list/user-list.component";
import { ManagePermissionsComponent } from "./permissions/manage-permissions/manage-permissions.component";
import { CompanyManagerComponent } from "./company/company-manager/company-manager.component";
import { AuthGuard } from "./auth/services/auth.guard";

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'create-company', component: CreateCompanyComponent, canActivate: [AuthGuard] },
  { path: 'dashboard', component: MainComponent, canActivate: [AuthGuard] },
  { path: 'users', component: UserListComponent, canActivate: [AuthGuard] },
  { path: 'permissions', component: ManagePermissionsComponent, canActivate: [AuthGuard] },
  { path: 'manage/:id', component: CompanyManagerComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
