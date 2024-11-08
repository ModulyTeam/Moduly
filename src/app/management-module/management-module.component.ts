import { Component, OnInit, ComponentFactoryResolver, ViewChild, ViewContainerRef } from '@angular/core';
import { Module } from '../models/Module.model';
import { ApiService } from "../requests/ApiService";
import { InteractiveModuleComponent } from "../interactive-module/interactive-module.component";
import { ActivatedRoute, Router } from '@angular/router';
import { NgClass, NgForOf, NgIf, SlicePipe, CurrencyPipe, DatePipe } from "@angular/common";
import { TceaCalculatorComponent } from "../Logic/tcea-calculator/tcea-calculator.component";
import { Invoice } from '../models/Invoice.model';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import introJs from 'intro.js';
import { currencieslist } from '../../assets/currencies';
import * as XLSX from 'xlsx';
import { conversion_rates } from '../requests/exchangerates';
import {Bank} from "../models/Bank.model";

@Component({
  selector: 'app-management-module',
  templateUrl: './management-module.component.html',
  standalone: true,
  imports: [
    InteractiveModuleComponent,
    NgForOf,
    NgIf,
    NgClass,
    ReactiveFormsModule,
    SlicePipe,
    CurrencyPipe,
    DatePipe
  ],
  styleUrls: ['./management-module.component.css']
})
export class ManagementModuleComponent implements OnInit {
  moduleId: string | null = null;
  moduleDetails: Module | null = null;
  showBankModal: boolean = false;
  bankForm: FormGroup;
  modules: any[] = [
    {
      type: 'tcea-calculator',
      title: 'Cálculo de TCEA',
      content: 'Permite calcular la Tasa de Coste Efectivo Anual (TCEA) para la cartera de letras/facturas, con opciones para ingresar tasas nominales y efectivas, y manejar diferentes monedas.'
    },
  ];

  @ViewChild('moduleContainer', {read: ViewContainerRef}) moduleContainer?: ViewContainerRef;

  invoices: Invoice[] = [];
  invoiceForm: FormGroup;
  currentPage = 1;
  pageSize = 10;
  banks: Bank[] = [];

  otherModules: Module[] = [];
  selectedModuleForImport: string | null = null;
  importedInvoices: Invoice[] = [];

  currencies = currencieslist;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private componentFactoryResolver: ComponentFactoryResolver,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.invoiceForm = this.formBuilder.group({
      code: ['', Validators.required],
      issueDate: ['', Validators.required],
      dueDate: [''],
      description: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0.01, [Validators.required, Validators.min(0.01)]],
      status: ['OPEN', Validators.required],
      currency: ['USD', Validators.required],
      exchangeRate: [{ value: 1, disabled: true }],
      tcea: [null, [Validators.min(0), Validators.max(100)]],
      bank: ['', Validators.required] // Campo de banco añadido

    });
    this.bankForm = this.formBuilder.group({
      name: ['', Validators.required],
      accountNumber: ['', Validators.required],
      iban: ['', Validators.required],
      swift: ['', Validators.required],
      accountHolderName: ['', Validators.required],
      accountType: ['', Validators.required],
      bankAddress: ['', Validators.required],
      paymentReference: ['', Validators.required],
      TCEApreferredRate: [0, Validators.required]

    });
    this.invoiceForm.get('currency')?.valueChanges.subscribe(currency => {
      const exchangeRateControl = this.invoiceForm.get('exchangeRate');
      if (currency === 'USD') {
        exchangeRateControl?.disable();
        exchangeRateControl?.setValue(1);
      } else {
        exchangeRateControl?.enable();
        const suggestedRate = this.getSuggestedExchangeRate(currency);
        exchangeRateControl?.setValue(suggestedRate);
      }
    });
  }

  ngOnInit() {
    this.moduleId = this.route.snapshot.paramMap.get('id');
    if (this.moduleId) {
      this.apiService.getModuleById(this.moduleId).subscribe((module: Module) => {
        this.moduleDetails = module;
      });
    }
    const companyId = localStorage.getItem('companyId') || '';
    if (companyId) {
      this.apiService.getBanksFromCompany(companyId).subscribe(
        (banks: Bank[]) => {
          this.banks = banks;
        },
        error => console.error('Error loading banks:', error)
      );
    }
    this.loadInvoices();
    this.loadOtherModules();
  }
  createNewBank() {
    this.showBankModal = true; // Mostrar modal
  }
  onBankChange(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    if (selectedValue === 'new') {
      this.createNewBank();
      // Reseteamos el valor para evitar que se mantenga seleccionado "new" en el dropdown
      this.invoiceForm.get('bank')?.setValue('');
    }
  }

  closeBankModal() {
    this.showBankModal = false;
  }

  submitBankForm() {
    if (this.bankForm.valid) {
      const bankData = this.bankForm.value;
      bankData.TCEApreferredRate = bankData.TCEApreferredRate || 0; // Asegurar un valor no nulo

      const companyId = localStorage.getItem("companyId") || '';
      this.apiService.createBankFromCompany(companyId, bankData).subscribe(
        (newBank: Bank) => {
          this.banks.push(newBank);
          this.closeBankModal();
          this.bankForm.reset();
          this.invoiceForm.get('bank')?.setValue(newBank.id);
        },
        error => console.error('Error creating bank:', error)
      );
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

  openModule(type: string) {
    if (this.moduleContainer) {
      this.moduleContainer.clear();

      let component: any = null;

      if (type === 'tcea-calculator') {
        component = TceaCalculatorComponent;

        if (component) {
          const componentFactory = this.componentFactoryResolver.resolveComponentFactory(component);
          const componentRef = this.moduleContainer.createComponent(componentFactory);
        }
      }
    }
  }
  getSelectedBank() {
    const selectedBankId = this.invoiceForm.get('bank')?.value;
    console.log(selectedBankId)

    return selectedBankId ? selectedBankId : null; // Retorna el id del banco o null si no está seleccionado
  }
  getBankName(bankId: string | undefined): string {
    const bank = this.banks.find(b => b.id === bankId);
    console.log(bankId);
    console.log(this.banks)
    console.log(bank)
    return bank ? bank.name : 'This Invoice has no assigned Bank';
  }

  createInvoice() {
    if (this.invoiceForm.valid && this.moduleId) {
      const userId = this.getCurrentUserId();
      const formValue = this.invoiceForm.getRawValue(); // Use getRawValue() to include disabled controls

      const currency = formValue.currency;
      const exchangeRate = formValue.exchangeRate;

      const invoiceData: Partial<Invoice> = {
        code: formValue.code,
        moduleId: this.moduleId,
        issuerId: userId,
        userId: userId,
        issueDate: new Date(formValue.issueDate).toISOString(),
        description: formValue.description,
        quantity: Number(formValue.quantity),
        unitPrice: Number(formValue.unitPrice),
        status: formValue.status || 'OPEN',
        currency: currency,
        exchangeRate: exchangeRate,
        totalPayment: Number(formValue.quantity) * Number(formValue.unitPrice),
        discountDate: null,
        bankId: this.getSelectedBank() // Aquí obtenemos el bankId seleccionado
      };

      if (formValue.dueDate) {
        invoiceData.dueDate = new Date(formValue.dueDate).toISOString();
      }
      if (formValue.tcea !== null && formValue.tcea !== '') {
        invoiceData.tcea = Number(formValue.tcea); // Guardar como porcentaje
      }

      this.apiService.createInvoice(invoiceData).subscribe(
        (newInvoice: Invoice) => {
          console.log('Invoice created successfully:', newInvoice);
          this.invoices.unshift(newInvoice);
          this.invoiceForm.reset();
        },
        error => console.error('Error creating invoice:', error)
      );
    } else {
      console.error('Form is invalid or moduleId is missing');
    }
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
  emitPDF(invoiceId: string | undefined) {
    if (invoiceId) {
      this.router.navigate([`/emitpdfletteinvoice/${invoiceId}`]);
    } else {
      console.error("Invoice ID is undefined");
    }
  }
  updateInvoiceStatus(invoiceId: string | undefined, event: Event) {
    const target = event.target as HTMLSelectElement;
    const newStatus = target.value;
    if (!invoiceId || !newStatus) return;
    const userId = this.getCurrentUserId();
    this.apiService.updateInvoiceStatus(invoiceId, newStatus, userId).subscribe(
      (updatedInvoice: Invoice) => {
        const index = this.invoices.findIndex(inv => inv.id === invoiceId);
        if (index !== -1) {
          this.invoices[index] = updatedInvoice;
        }
      },
      error => console.error('Error updating invoice status:', error)
    );
  }

  onModuleSelect(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedModuleForImport = target.value;
    if (this.selectedModuleForImport) {
      this.loadInvoicesForImport(this.selectedModuleForImport);
    } else {
      this.importedInvoices = [];
    }
  }

  loadInvoicesForImport(moduleId: string) {
    const userId = this.getCurrentUserId();
    this.apiService.getInvoices(moduleId, userId).subscribe(
      (invoices: Invoice[]) => {
        this.importedInvoices = invoices;
      },
      (error: unknown) => console.error('Error loading invoices for import:', error)
    );
  }

  exportToExcel() {
    this.exportInvoicesToExcel(this.invoices);
  }

  exportImportedToExcel() {
    this.exportInvoicesToExcel(this.importedInvoices);
  }

  private exportInvoicesToExcel(invoices: Invoice[]) {
    const exportData = invoices.map(invoice => ({
      Code: invoice.code,
      Description: invoice.description,
      Quantity: invoice.quantity,
      UnitPrice: invoice.unitPrice,
      TotalPayment: invoice.totalPayment,
      IssueDate: invoice.issueDate,
      DueDate: invoice.dueDate,
      Status: invoice.status,
      Currency: invoice.currency,
      ExchangeRate: invoice.exchangeRate,
      TCEA: invoice.tcea ? invoice.tcea * 100 : null
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    XLSX.writeFile(workbook, 'invoices.xlsx');
  }

  private exportInvoicesToJson(invoices: Invoice[]) {
    const currentModuleId = this.route.snapshot.paramMap.get('id');
    const userId = localStorage.getItem('userId') || '';

    const jsonData = invoices.map(invoice => ({
      ...invoice,
      id: undefined,
      code: `${invoice.code}COPY`,
      moduleId: currentModuleId,
      userId: userId,
      issuerId: userId,
      tcea: invoice.tcea != null ? invoice.tcea * 100 : null
    }));

    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoices.json';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  exportToJson() {
    this.exportInvoicesToJson(this.invoices);
  }

  exportImportedToJson() {
    this.exportInvoicesToJson(this.importedInvoices);
  }

  private getCurrentUserId(): string {
    // This is just an example. Replace with your actual implementation.
    return localStorage.getItem('userId') || '';
  }

  private getCurrentCompanyId(): string {
    // Implement this method to return the current company ID
    return localStorage.getItem('companyId') || '';
  }

  loadOtherModules() {
    const companyId = this.getCurrentCompanyId(); // Implement this method
    this.apiService.getModules(companyId).subscribe(
      (modules: Module[]) => {
        this.otherModules = modules.filter(module =>
          module.id !== this.moduleId && module.moduleType !== 'admin'
        );
      },
      (error: unknown) => console.error('Error loading other modules:', error)
    );
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  startTutorial() {
    const steps = [
      {
        element: '.module-details',
        intro: 'Esta sección muestra los detalles del módulo actual.'
      },
      {
        element: '.invoice-management',
        intro: 'Aquí puedes gestionar tus facturas. Vamos a explorar cada campo en detalle.'
      },
      {
        element: '.invoice-management form input[formControlName="code"]',
        intro: 'Código de Factura: Este campo es obligatorio y debe ser único para cada factura.'
      },
      {
        element: '.invoice-management form input[formControlName="issueDate"]',
        intro: 'Fecha de Emisión: Campo obligatorio que indica cuándo se emitió la factura.'
      },
      {
        element: '.invoice-management form input[formControlName="dueDate"]',
        intro: 'Fecha de Vencimiento: Campo opcional que indica cuándo vence la factura.'
      },
      {
        element: '.invoice-management form input[formControlName="description"]',
        intro: 'Descripción: Campo obligatorio para detallar el concepto de la factura.'
      },
      {
        element: '.invoice-management form input[formControlName="quantity"]',
        intro: 'Cantidad: Campo obligatorio que indica el número de unidades o servicios facturados.'
      },
      {
        element: '.invoice-management form input[formControlName="unitPrice"]',
        intro: 'Precio Unitario: Campo obligatorio que indica el precio por unidad.'
      },
      {
        element: '.invoice-management form input[formControlName="status"]',
        intro: 'Estado: Campo obligatorio que indica el estado actual de la factura (ej. Pendiente, Pagada).'
      },
      {
        element: '.invoice-management form select[formControlName="currency"]',
        intro: 'Moneda: Selecciona la moneda de la factura. Las opciones se cargan desde una lista predefinida de monedas.'
      },
      {
        element: '.invoice-management form input[formControlName="exchangeRate"]',
        intro: 'Tasa de Cambio: Este campo se habilita automáticamente cuando se selecciona una moneda diferente al USD. Para USD, la tasa es siempre 1.'
      },
      {
        element: '.invoice-management form input[formControlName="tcea"]',
        intro: 'TCEA: Ingresa la Tasa de Costo Efectivo Anual como un porcentaje (por ejemplo, 5 para 5%). Se guardará internamente como decimal (0.05) y se mostrará como porcentaje en la tabla.'
      },
      {
        element: '.invoice-table',
        intro: 'Esta tabla muestra todas las facturas creadas. Puedes ver detalles, actualizar el estado o eliminar facturas desde aquí.'
      },
      {
        element: '.import-invoices',
        intro: 'En esta sección puedes importar facturas de otros módulos.'
      }
    ];

    introJs().setOptions({ steps: steps }).start();
  }
  navigateToFinancialHelperBank() {
    if (this.moduleId) {
      this.router.navigate(['/financial-helper-banks', this.moduleId]);
    } else {
      console.error('Module ID is not available');
    }
  }
  navigateToFinancialHelper() {
    if (this.moduleId) {
      this.router.navigate(['/financial-helper', this.moduleId]);
    } else {
      console.error('Module ID is not available');
    }
  }

  private getSuggestedExchangeRate(currency: string): number {
    if (currency === 'USD') return 1;
    const usdRate = conversion_rates[currency as keyof typeof conversion_rates];
    return usdRate ? Number((1 / usdRate).toFixed(4)) : 1;
  }
  displayExchangeRate(invoice: Invoice): string {
    return invoice.exchangeRate?.toFixed(4) ?? 'N/A';
  }
}
