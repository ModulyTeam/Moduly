import {Component, OnInit} from '@angular/core';
import {Invoice} from "../../models/Invoice.model";
import {Bank} from "../../models/Bank.model";
import {ApiService} from "../../requests/ApiService";
import {ActivatedRoute} from "@angular/router";
import {FormBuilder, FormsModule} from "@angular/forms";
import {CurrencyPipe, DatePipe, DecimalPipe, NgForOf, SlicePipe} from "@angular/common";
import {CalculatorDiscountComponent} from "../calculator-discount/calculator-discount.component";
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
  banks: Bank[] = [];
  useBankTCEA: { [key: string]: boolean } = {};
  bankMap: Map<string, Bank> = new Map();

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit() {
    this.moduleId = this.route.snapshot.paramMap.get('moduleId');
    if (this.moduleId) {
      this.loadBanks().then(() => {
        this.loadInvoices();
      });
    }
  }

  async loadBanks() {
    const companyId = localStorage.getItem('companyId') || '';

    try {
      const banks = await this.apiService.getBanksFromCompany(companyId).toPromise();
      if (banks) {
        this.banks = banks;
        this.banks.forEach(bank => {
          if (bank.id) {
            this.bankMap.set(bank.id, bank);
          }
        });
      }
    } catch (error) {
      console.error('Error loading banks:', error);
    }
  }

  loadInvoices() {
    if (this.moduleId) {
      const userId = this.getCurrentUserId();
      this.apiService.getInvoices(this.moduleId, userId).subscribe(
        (invoices: Invoice[]) => {
          this.invoices = invoices;
          console.log('Invoices loaded:', this.invoices);

          this.invoices.forEach(invoice => {
            if (invoice.id) {
              this.useBankTCEA[invoice.id] = false;
              if (invoice.bankId) {
                const associatedBank = this.bankMap.get(invoice.bankId);
                console.log(`Invoice ${invoice.id} associated bank:`, associatedBank);
              }
            }
          });
        },
        error => console.error('Error loading invoices:', error)
      );
    }
  }

  private getCurrentUserId(): string {
    return localStorage.getItem('userId') || '';
  }

  toggleTCEA(invoiceId: string | undefined) {
    if (invoiceId) {
      this.useBankTCEA[invoiceId] = !this.useBankTCEA[invoiceId];
      const invoice = this.invoices.find(inv => inv.id === invoiceId);

      if (invoice && invoice.bankId) {
        const bank = this.bankMap.get(invoice.bankId);
      }
    }
  }

  getBankTCEA(invoice: Invoice): number {
    if (!invoice.bankId) {
      console.log('No bankId for invoice:', invoice.id);
      return 0;
    }

    const bank = this.bankMap.get(invoice.bankId);
    const tceaRate = bank?.tceApreferredRate ?? 0;

    return tceaRate;
  }

  getEffectiveTCEA(invoice: Invoice): number {
    if (!invoice.id) return invoice.tcea || 0;

    const useBank = this.useBankTCEA[invoice.id];
    console.log('Using bank TCEA:', useBank);

    if (useBank) {
      // Obtenemos el TCEA del banco y aseguramos que sea un número
      const bankTCEA = this.getBankTCEA(invoice);
      return bankTCEA || (invoice.tcea || 0);
    }

    return invoice.tcea || 0;
  }

  calculateFutureValue(invoice: Invoice): number {
    const totalPayment = invoice.totalPayment || 0;
    const tcea = this.getEffectiveTCEA(invoice);

    const issueDate = new Date(invoice.issueDate || '');
    const dueDate = new Date(invoice.dueDate || '');
    const daysDifference = (dueDate.getTime() - issueDate.getTime()) / (1000 * 3600 * 24);

    return totalPayment * Math.pow(1 + tcea, daysDifference / 365);
  }


  calculateTotalFutureValue(): number {
    return this.invoices.reduce((total, invoice) => {
      const issueDate = new Date(invoice.issueDate || '');
      const dueDate = new Date(invoice.dueDate || '');
      const totalDays = (dueDate.getTime() - issueDate.getTime()) / (1000 * 3600 * 24);
      const tcea = this.getEffectiveTCEA(invoice);
      const futureValue = (invoice.totalPayment ?? 0) * Math.pow(1 + tcea, totalDays / 365);
      return total + futureValue;
    }, 0);
  }
  calculateTotalPayment(): number {
    return this.invoices.reduce((total, invoice) => total + (invoice.totalPayment ?? 0), 0);
  }

  getTCEAPercentage(invoice: Invoice): number {
    const effectiveTCEA = this.getEffectiveTCEA(invoice);
    return effectiveTCEA * 100;
  }

  getTCEASource(invoice: Invoice): string {
    if (invoice.id && this.useBankTCEA[invoice.id]) {
      return 'Banco';
    }
    return 'Factura';
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

  logInvoiceDetails(invoice: Invoice) {
    if (invoice.bankId) {
      const bank = this.bankMap.get(invoice.bankId);
    }
  }
}
