import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { NgIf } from '@angular/common';
import { CompanyService } from "../services/company.service";

@Component({
  selector: 'app-create-company',
  standalone: true,
  templateUrl: './create-company.component.html',
  styleUrls: ['./create-company.component.scss'],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    NgIf
  ]
})
export class CreateCompanyComponent {
  createCompanyForm: FormGroup;

  constructor(private fb: FormBuilder, private companyService: CompanyService, private router: Router) {
    this.createCompanyForm = this.fb.group({
      companyName: ['', Validators.required],
      legalName: ['', Validators.required],
      ruc: ['', Validators.required],
      address: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.createCompanyForm.valid) {
      const createdById = localStorage.getItem('userId');
      if (createdById) {
        const companyData = {
          ...this.createCompanyForm.value,
          createdById
        };
        this.companyService.createCompany(companyData).subscribe(() => {
          this.router.navigate(['/dashboard']);
        });
      }
    }
  }
}
