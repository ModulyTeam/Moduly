import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CompanyService } from '../services/company.service';

@Component({
  selector: 'app-create-company',
  standalone: true,
  templateUrl: './create-company.component.html',
  styleUrls: ['./create-company.component.scss']
})
export class CreateCompanyComponent {
  createCompanyForm: FormGroup;

  constructor(private fb: FormBuilder, private companyService: CompanyService) {
    this.createCompanyForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
  }

  onSubmit() {
    if (this.createCompanyForm.valid) {
      this.companyService.createCompany(this.createCompanyForm.value).subscribe();
    }
  }
}
