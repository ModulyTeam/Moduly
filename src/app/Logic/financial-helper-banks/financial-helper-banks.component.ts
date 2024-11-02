import {Component, OnInit} from '@angular/core';
import {Invoice} from "../../models/Invoice.model";
import {Bank} from "../../models/Bank.model";
import {ApiService} from "../../requests/ApiService";
import {ActivatedRoute} from "@angular/router";
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {CurrencyPipe, DatePipe, DecimalPipe, NgForOf, NgIf, PercentPipe, SlicePipe} from "@angular/common";
import {CalculatorDiscountComponent} from "../calculator-discount/calculator-discount.component";
import {FixedAmountCalculatorComponent} from "../fixed-amount-calculator/fixed-amount-calculator.component";
import {FinancialCalculationsService} from "./calculateDiscountedValue";
import introJs from 'intro.js';
import { Router } from '@angular/router';
import {EmitpdfdiscountletterComponent} from "./emitpdfdiscountletter/emitpdfdiscountletter.component";

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
    SlicePipe,
    ReactiveFormsModule,
    NgIf,
    PercentPipe,
    EmitpdfdiscountletterComponent
  ],
  templateUrl: './financial-helper-banks.component.html',
  styleUrl: './financial-helper-banks.component.css'
})export class FinancialHelperBanksComponent implements OnInit {
  // Existing properties
  invoices: Invoice[] = [];
  moduleId: string | null = null;
  currentPage = 1;
  pageSize = 10;
  banks: Bank[] = [];
  useBankTCEA: { [key: string]: boolean } = {};
  bankMap: Map<string, Bank> = new Map();

  discountForm: FormGroup;
  selectedInvoices: Set<string> = new Set();
  calculationResults: {
    totalOriginal: number;
    totalDiscounted: number;
    savings: number;
    validInvoices: number;
    explanation?: string;
    involvedBanks?: string[];
  } | null = null;
  applyTimeValue = false;
  useCommercialYear = false;
  showResults = false;

  // Nuevas propiedades para los ejemplos de fórmulas
  formulaExamples = {
    unitPrice: 0,
    quantity: 0,
    totalAmount: 0,
    tcea: 0,
    daysToTarget: 0,
    totalDays: 0,
    discountedValue: 0,
    savings: 0,
    daysInYear: 0
  };

  showLetterGeneratorFlag = false;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private financialCalcs: FinancialCalculationsService,
    private router: Router
  ) {
    this.discountForm = this.formBuilder.group({
      targetDate: ['']
    });
  }
  getMinDate(): string {
    const dates = this.invoices
      .map(invoice => new Date(invoice.issueDate || ''))
      .filter(date => !isNaN(date.getTime()));

    if (dates.length > 0) {
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      return minDate.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  }

  ngOnInit() {
    this.moduleId = this.route.snapshot.paramMap.get('moduleId');
    if (this.moduleId) {
      this.loadBanks().then(() => {
        this.loadInvoices();
      });
    }

    // Set initial target date to today
    const today = new Date();
    this.discountForm.patchValue({
      targetDate: today.toISOString().split('T')[0]
    });
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
  toggleInvoiceSelection(invoiceId: string) {
    if (this.selectedInvoices.has(invoiceId)) {
      this.selectedInvoices.delete(invoiceId);
    } else {
      this.selectedInvoices.add(invoiceId);
    }
    console.log('Selected invoices:', this.selectedInvoices);
  }

  isInvoiceSelected(invoiceId: string): boolean {
    return this.selectedInvoices.has(invoiceId);
  }

  toggleTimeValue() {
    this.applyTimeValue = !this.applyTimeValue;
    console.log('Time value applied:', this.applyTimeValue);
  }

  toggleCommercialYear() {
    this.useCommercialYear = !this.useCommercialYear;
    console.log('Commercial year applied:', this.useCommercialYear);
  }

  calculateDiscounts() {
    if (!this.discountForm.valid || this.selectedInvoices.size === 0) {
      console.error('Form is invalid or no invoices selected');
      return;
    }

    const targetDate = new Date(this.discountForm.get('targetDate')?.value);

    if (!targetDate || isNaN(targetDate.getTime())) {
      console.error('Invalid target date');
      return;
    }

    // Obtener los resultados básicos
    this.calculationResults = this.financialCalcs.calculateTotalSavings(
      this.invoices,
      this.selectedInvoices,
      targetDate,
      this.useBankTCEA,
      this.bankMap,
      this.applyTimeValue,
      this.useCommercialYear
    );

    // Generar explicación y lista de bancos involucrados
    if (this.calculationResults) {
      const involvedBanks = new Set<string>();
      const selectedInvoicesList = this.invoices.filter(inv => inv.id && this.selectedInvoices.has(inv.id));

      selectedInvoicesList.forEach(invoice => {
        if (invoice.id && this.useBankTCEA[invoice.id] && invoice.bankId) {
          const bank = this.bankMap.get(invoice.bankId);
          if (bank?.name) {
            involvedBanks.add(bank.name);
          }
        }
      });

      // Construir la explicación
      let explanation = `Se han analizado ${this.calculationResults.validInvoices} facturas válidas con un valor total original de ${this.calculationResults.totalOriginal.toLocaleString('es-PE', {style: 'currency', currency: 'PEN'})}. `;

      if (this.applyTimeValue) {
        explanation += `Se ha aplicado el valor del dinero en el tiempo ${this.useCommercialYear ? 'utilizando el año comercial (360 días)' : 'utilizando el año calendario (365 días)'}. `;
      }

      if (involvedBanks.size > 0) {
        explanation += `Se utilizaron las tasas TCEA preferenciales de los siguientes bancos: ${Array.from(involvedBanks).join(', ')}. `;
      }

      explanation += `Después de aplicar los descuentos correspondientes, el valor final es de ${this.calculationResults.totalDiscounted.toLocaleString('es-PE', {style: 'currency', currency: 'PEN'})}, `;
      explanation += `lo que representa un ahorro total de ${this.calculationResults.savings.toLocaleString('es-PE', {style: 'currency', currency: 'PEN'})} `;
      explanation += `(${((this.calculationResults.savings / this.calculationResults.totalOriginal) * 100).toFixed(2)}% del valor original).`;

      // Agregar la explicación y bancos al resultado
      this.calculationResults = {
        ...this.calculationResults,
        explanation,
        involvedBanks: Array.from(involvedBanks)
      };
    }

    // Actualizar ejemplos de fórmulas con la primera factura seleccionada
    const selectedInvoice = this.invoices.find(inv => inv.id && this.selectedInvoices.has(inv.id));
    if (selectedInvoice) {
      const issueDate = new Date(selectedInvoice.issueDate || '');
      const dueDate = new Date(selectedInvoice.dueDate || '');
      const daysInYear = this.useCommercialYear ? 360 : 365;

      this.formulaExamples = {
        unitPrice: selectedInvoice.unitPrice || 0,
        quantity: selectedInvoice.quantity || 0,
        totalAmount: (selectedInvoice.unitPrice || 0) * (selectedInvoice.quantity || 0),
        tcea: this.getEffectiveTCEA(selectedInvoice),
        daysToTarget: (targetDate.getTime() - issueDate.getTime()) / (1000 * 3600 * 24),
        totalDays: (dueDate.getTime() - issueDate.getTime()) / (1000 * 3600 * 24),
        discountedValue: this.calculationResults.totalDiscounted / this.calculationResults.validInvoices,
        savings: this.calculationResults.savings,
        daysInYear: daysInYear
      };
    }

    this.showResults = true;
    console.log('Calculation results:', this.calculationResults);
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

  startTutorial() {
    const intro = introJs();

    intro.setOptions({
      steps: [
        {
          title: 'Bienvenido a la Calculadora Financiera',
          intro: 'Este tutorial te guiará a través de todas las funcionalidades disponibles en la calculadora.'
        },
        {
          element: '.discount-calculator',
          title: 'Calculadora de Descuentos',
          intro: 'Esta sección te permite calcular descuentos financieros para las facturas seleccionadas.'
        },
        {
          element: '#targetDate',
          title: 'Fecha Objetivo',
          intro: 'Selecciona la fecha para la cual deseas calcular los descuentos. Esta fecha debe estar entre la fecha de emisión y vencimiento de las facturas.'
        },
        {
          element: '.time-value-toggle',
          title: 'Opciones de Cálculo',
          intro: 'Aquí puedes activar diferentes opciones para el cálculo:<br><br>' +
                 '- <b>Valor del Dinero en el Tiempo:</b> Considera el valor temporal del dinero en los cálculos.<br>' +
                 '- <b>Valor Comercial:</b> Usa año comercial (360 días) en lugar de año calendario (365 días).'
        },
        {
          element: '.calculate-btn',
          title: 'Calcular Descuentos',
          intro: 'Presiona este botón para realizar los cálculos una vez hayas seleccionado las facturas y configurado las opciones.'
        },
        {
          element: '.results',
          title: 'Resultados del Cálculo',
          intro: 'Aquí se mostrarán los resultados detallados del cálculo, incluyendo valores originales, descontados y ahorros totales.',
          position: 'top'
        },
        {
          element: '.invoice-table',
          title: 'Tabla de Facturas',
          intro: 'Esta tabla muestra todas tus facturas disponibles.'
        },
        {
          element: 'thead tr',
          title: 'Columnas de la Tabla',
          intro: 'La tabla incluye información detallada de cada factura: código, descripción, cantidades, fechas, estado y más.'
        },
        {
          element: '.toggle-btn',
          title: 'Cambiar TCEA',
          intro: 'Este botón te permite alternar entre usar la TCEA de la factura o la TCEA preferencial del banco asociado.'
        },
        {
          element: '.container',
          title: 'Fórmulas Matemáticas',
          intro: 'Esta sección muestra las fórmulas utilizadas en los cálculos. Las fórmulas se actualizarán con valores reales después de realizar un cálculo.'
        },
        {
          element: '.formula:nth-child(1)',
          title: 'Valor Total de la Factura',
          intro: 'Muestra cómo se calcula el valor total de una factura.'
        },
        {
          element: '.formula:nth-child(2)',
          title: 'Valor Descontado',
          intro: 'Explica cómo se calcula el valor descontado considerando el tiempo.'
        },
        {
          element: '.formula:nth-child(3)',
          title: 'Descuento Bancario',
          intro: 'Detalla el cálculo del descuento bancario aplicado.'
        },
        {
          element: '.formula:nth-child(4)',
          title: 'Ahorros Totales',
          intro: 'Muestra cómo se calculan los ahorros totales obtenidos.'
        }
      ],
      nextLabel: 'Siguiente >',
      prevLabel: '< Anterior',
      skipLabel: 'Saltar',
      doneLabel: 'Finalizar',
      showProgress: true,
      exitOnOverlayClick: false,
      showBullets: true
    });

    intro.start();
  }

  showLetterGenerator() {
    localStorage.setItem('discountLetterData', JSON.stringify(this.getDiscountLetterData()));

    this.router.navigate(['/emit-pdf-discount-letter']);
  }

  getDiscountLetterData() {
    return {
      totalOriginal: this.calculationResults!.totalOriginal,
      totalDiscounted: this.calculationResults!.totalDiscounted,
      savings: this.calculationResults!.savings,
      validInvoices: this.calculationResults!.validInvoices,
      targetDate: new Date(this.discountForm.get('targetDate')?.value),
      involvedBanks: this.calculationResults!.involvedBanks,
      applyTimeValue: this.applyTimeValue,
      useCommercialYear: this.useCommercialYear,
      tcea: this.formulaExamples.tcea,
      daysToTarget: this.formulaExamples.daysToTarget,
      totalDays: this.formulaExamples.totalDays
    };
  }

  navigateToLetterGenerator() {
    if (this.calculationResults) {
      // Preparar los datos para el componente de letra de descuento
      const letterData = {
        totalOriginal: this.calculationResults.totalOriginal,
        totalDiscounted: this.calculationResults.totalDiscounted,
        savings: this.calculationResults.savings,
        validInvoices: this.calculationResults.validInvoices,
        targetDate: new Date(this.discountForm.get('targetDate')?.value),
        involvedBanks: this.calculationResults.involvedBanks,
        applyTimeValue: this.applyTimeValue,
        useCommercialYear: this.useCommercialYear,
        tcea: this.formulaExamples.tcea,
        daysToTarget: this.formulaExamples.daysToTarget,
        totalDays: this.formulaExamples.totalDays
      };

      // Guardar los datos en localStorage
      localStorage.setItem('discountLetterData', JSON.stringify(letterData));

      // Navegar al componente de generación de PDF
      this.router.navigate(['/emit-pdf-discount-letter']);
    }
  }
}
