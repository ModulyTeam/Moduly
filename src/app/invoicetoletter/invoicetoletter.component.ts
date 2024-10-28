import { Component, OnInit } from '@angular/core';
import { ApiService } from "../requests/ApiService";
import { ActivatedRoute } from "@angular/router";
import { Company } from "../models/Company.model";
import { Invoice } from "../models/Invoice.model";
import { User } from "../models/User.model";
import { Observable, of } from "rxjs";
import { map } from "rxjs/operators";
import {AsyncPipe, CurrencyPipe, DatePipe, NgForOf, NgIf, NgSwitch} from "@angular/common";
import { FormsModule } from '@angular/forms';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface AdditionalField {
  type: 'text' | 'image' | 'url';
  label: string;
  value: string;
}

@Component({
  selector: 'app-invoicetoletter',
  standalone: true,
  templateUrl: './invoicetoletter.component.html',
  imports: [
    AsyncPipe,
    DatePipe,
    CurrencyPipe,
    NgIf,
    FormsModule,
    NgSwitch,
    NgForOf
  ],
  styleUrls: ['./invoicetoletter.component.css']
})
export class InvoicetoletterComponent implements OnInit {
  // Existing properties
  invoiceId: string | null = null;
  companyId: string | null = null;
  userId: string | null = null;
  companyName: string | null = null;
  legalName: string | null = null;
  email: string | null = null;
  invoiceCode: string | null = null;
  issueDate: string | null = null;
  dueDate: string | null = null;
  description: string | null = null;
  quantity: number | null = null;
  unitPrice: number | null = null;
  totalPayment: number | null = null;
  status: string | null = null;
  bankId: any = null;
  username: string | null = null;
  fullName: string | null = null;
  age: number | null = null;
  dni: string | null = null;
  phoneNumber: string | null = null;
  userEmail: string | null = null;

  // New properties
  companyAddress: string = '';
  clientAddress: string = '';
  taxRate: number = 0;
  notes: string = '';
  additionalFields: AdditionalField[] = [];
  logoUrl: string = '/api/placeholder/150/150';
  isPreviewMode: boolean = false;

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
          this.bankId = invoice.bankId;
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

  getBank(bankId: string): Observable<any> {
    if (this.companyId) {
      return this.apiService.getBanksFromCompany(this.companyId).pipe(
        map((banks) => banks.find((bank) => bank.id === bankId))
      );
    } else {
      return of(undefined);
    }
  }

  // New methods
  handleLogoUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.logoUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  addCustomField(): void {
    this.additionalFields.push({
      type: 'text',
      label: '',
      value: ''
    });
  }

  removeCustomField(index: number): void {
    this.additionalFields.splice(index, 1);
  }

  calculateTotal(): number {
    if (this.totalPayment) {
      const tax = this.totalPayment * (this.taxRate / 100);
      return this.totalPayment + tax;
    }
    return 0;
  }

  togglePreview(): void {
    this.isPreviewMode = !this.isPreviewMode;
  }

  async exportToPDF(): Promise<void> {
    const element = document.getElementById('invoice-container');
    if (element) {
      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`invoice-${this.invoiceCode}.pdf`);
    }
  }

  async exportToImage(): Promise<void> {
    const element = document.getElementById('invoice-container');
    if (element) {
      const canvas = await html2canvas(element);
      const link = document.createElement('a');
      link.download = `invoice-${this.invoiceCode}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  }
}
