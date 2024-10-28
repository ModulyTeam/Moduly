import { Component, OnInit } from '@angular/core';
import { ApiService } from "../requests/ApiService";
import { ActivatedRoute } from "@angular/router";
import { Company } from "../models/Company.model";
import { Invoice } from "../models/Invoice.model";
import { User } from "../models/User.model";

@Component({
  selector: 'app-invoicetoletter',
  standalone: true,
  templateUrl: './invoicetoletter.component.html',
  styleUrls: ['./invoicetoletter.component.css']
})
export class InvoicetoletterComponent implements OnInit {
  invoiceId: string | null = null;
  companyId: string | null = null;
  userId: string | null = null;
  companyName: string | null = null;
  legalName: string | null = null;
  email: string | null = null;

  // Propiedades para almacenar los datos de la factura
  invoiceCode: string | null = null;
  issueDate: string | null = null;
  dueDate: string | null = null;
  description: string | null = null;
  quantity: number | null = null;
  unitPrice: number | null = null;
  totalPayment: number | null = null;
  status: string | null = null;
  bankId: any = null;
  // Propiedades para almacenar los datos del usuario
  username: string | null = null;
  fullName: string | null = null;
  age: number | null = null;
  dni: string | null = null;
  phoneNumber: string | null = null;
  userEmail: string | null = null;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.invoiceId = this.route.snapshot.paramMap.get('id');
    this.companyId = localStorage.getItem('companyId');
    this.userId = localStorage.getItem('userId');

    if (this.companyId) {
      this.apiService.getCompanyById(this.companyId).subscribe(
        (company: Company) => {
          this.companyName = company.companyName;
          this.legalName = company.legalName;
          this.email = company.email;
        },
        error => {
          console.error('Error fetching company data', error);
        }
      );
    }

    if (this.invoiceId) {
      this.apiService.getInvoiceById(this.invoiceId).subscribe(
        (invoice: Invoice) => {
          this.invoiceCode = invoice.code;
          this.issueDate = invoice.issueDate;
          this.dueDate = invoice.dueDate || null;
          this.description = invoice.description;
          this.quantity = invoice.quantity;
          this.unitPrice = invoice.unitPrice;
          this.totalPayment = invoice.totalPayment || null;
          this.status = invoice.status;
          this.bankId=invoice.bankId;
        },
        error => {
          console.error('Error fetching invoice data', error);
        }
      );
    }

    if (this.userId) {
      this.apiService.getUserById(this.userId).subscribe(
        (user: User) => {
          this.username = user.username;
          this.fullName = user.fullName;
          this.age = user.age;
          this.dni = user.dni;
          this.phoneNumber = user.phoneNumber;
          this.userEmail = user.email;
        },
        error => {
          console.error('Error fetching user data', error);
        }
      );
    }
  }
}
