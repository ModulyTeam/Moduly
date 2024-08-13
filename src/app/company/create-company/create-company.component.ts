import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { NgIf } from '@angular/common';
import {CompanyService} from "../services/company.service";

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
      name: ['', Validators.required],
      description: ['']
    });
  }

  onSubmit() {
    if (this.createCompanyForm.valid) {
      this.companyService.createCompany(this.createCompanyForm.value).subscribe(() => {
        this.router.navigate(['/dashboard']);
      });
    }
  }
}
