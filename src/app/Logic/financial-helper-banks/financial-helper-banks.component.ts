import {Component, OnInit} from '@angular/core';
import {Invoice} from "../../models/Invoice.model";
import {ApiService} from "../../requests/ApiService";
import {ActivatedRoute} from "@angular/router";
import {FormBuilder, FormsModule} from "@angular/forms";
import introJs from "intro.js";
import {CalculatorDiscountComponent} from "../calculator-discount/calculator-discount.component";
import {CurrencyPipe, DatePipe, DecimalPipe, NgForOf, SlicePipe} from "@angular/common";
import {FixedAmountCalculatorComponent} from "../fixed-amount-calculator/fixed-amount-calculator.component";

@Component({
  selector: 'app-financial-helper-banks',
  standalone: true,
  imports: [
    CalculatorDiscountComponent,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    FixedAmountCalculatorComponent,
    FormsModule,
    NgForOf,
    SlicePipe
  ],
  templateUrl: './financial-helper-banks.component.html',
  styleUrl: './financial-helper-banks.component.css'
})

export class FinancialHelperBanksComponent implements OnInit {
  invoices: Invoice[] = [];
  moduleId: string | null = null;
  currentPage = 1;
  pageSize = 10;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit() {
    this.moduleId = this.route.snapshot.paramMap.get('moduleId');
    if (this.moduleId) {
      this.loadInvoices();
    }
  }

  loadInvoices() {
    if (this.moduleId) {
      const userId = this.getCurrentUserId();
      this.apiService.getInvoices(this.moduleId, userId).subscribe(
        (invoices: Invoice[]) => {
          this.invoices = invoices;
        },
        error => console.error('Error loading invoices:', error)
      );
    }
  }

  private getCurrentUserId(): string {
    return localStorage.getItem('userId') || '';
  }

  deleteInvoice(invoiceId: string | undefined) {
    if (!invoiceId) return;
    const userId = this.getCurrentUserId();
    this.apiService.deleteInvoice(invoiceId, userId).subscribe(
      () => {
        this.invoices = this.invoices.filter(invoice => invoice.id !== invoiceId);
      },
      error => console.error('Error deleting invoice:', error)
    );
  }

  calculateTotalFutureValue(): number {
    return this.invoices.reduce((total, invoice) => {
      const issueDate = new Date(invoice.issueDate || '');
      const dueDate = new Date(invoice.dueDate || '');
      const totalDays = (dueDate.getTime() - issueDate.getTime()) / (1000 * 3600 * 24);
      const tcea = invoice.tcea || 0;
      const futureValue = (invoice.totalPayment ?? 0) * Math.pow(1 + tcea, totalDays / 365);
      return total + futureValue;
    }, 0);
  }

  calculateFutureValue(invoice: Invoice): number {
    const totalPayment = invoice.totalPayment || 0;
    const tcea = (invoice.tcea || 0) * 100; // Convertimos a porcentaje

    const issueDate = new Date(invoice.issueDate || '');
    const dueDate = new Date(invoice.dueDate || '');
    const daysDifference = (dueDate.getTime() - issueDate.getTime()) / (1000 * 3600 * 24);

    // Usamos la TCEA convertida a porcentaje en el cálculo
    return totalPayment * Math.pow(1 + tcea / 100, daysDifference / 365);
  }

  calculateTotalPayment(): number {
    return this.invoices.reduce((total, invoice) => total + (invoice.totalPayment ?? 0), 0);
  }

  getTCEAPercentage(invoice: Invoice): number {
    return ((invoice.tcea ?? 0) * 100);
  }


}
