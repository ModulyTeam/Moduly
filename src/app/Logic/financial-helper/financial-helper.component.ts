import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../requests/ApiService';
import { Invoice } from '../../models/Invoice.model';
import { ActivatedRoute } from '@angular/router';
import { CalculatorDiscountComponent } from '../calculator-discount/calculator-discount.component';
import { FixedAmountCalculatorComponent } from '../fixed-amount-calculator/fixed-amount-calculator.component';
import introJs from 'intro.js';

@Component({
  selector: 'app-financial-helper',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CalculatorDiscountComponent, FixedAmountCalculatorComponent],
  templateUrl: './financial-helper.component.html',
  styleUrls: ['./financial-helper.component.css']
})
export class FinancialHelperComponent implements OnInit {
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

  calculatePortfolioMetrics() {
    let totalOriginalAmount = 0;
    let totalInterest = 0;
    let weightedTCEA = 0;

    this.invoices.forEach(invoice => {
      const totalPayment = invoice.totalPayment || 0;
      const tcea = (invoice.tcea || 0) * 100; // Convertimos a porcentaje

      const issueDate = new Date(invoice.issueDate || '');
      const dueDate = new Date(invoice.dueDate || '');
      const daysDifference = (dueDate.getTime() - issueDate.getTime()) / (1000 * 3600 * 24);

      // Usamos la TCEA convertida a porcentaje en el cálculo
      const futureValue = totalPayment * Math.pow(1 + tcea / 100, daysDifference / 365);
      const interest = futureValue - totalPayment;

      totalOriginalAmount += totalPayment;
      totalInterest += interest;
      weightedTCEA += tcea * totalPayment;
    });

    weightedTCEA = weightedTCEA / totalOriginalAmount;

    return {
      netValue: totalOriginalAmount,
      totalInterest,
      weightedTCEA: weightedTCEA
    };
  }

  updateInvoiceStatus(invoiceId: string | undefined, event: Event) {
    if (!invoiceId) return;
    const newStatus = (event.target as HTMLSelectElement).value;
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

  startTutorial() {
    const intro = introJs();
    intro.setOptions({
      steps: [
        {
          intro: "Bienvenido a la Calculadora Financiera de Descuentos. Este tutorial te guiará a través de las principales características y cómo pueden ayudarte en la gestión financiera de tus facturas."
        },
        {
          element: '.invoice-table',
          intro: "Aquí puedes ver todas tus facturas. Esta tabla proporciona una visión general de tu cartera de facturas, incluyendo detalles importantes como fechas, montos y estados.",
          position: 'bottom'
        },
        {
          element: '.invoice-table thead',
          intro: "Cada columna muestra información crucial sobre tus facturas. Presta especial atención a la columna 'Valor Futuro', que te muestra el valor proyectado de cada factura en su fecha de vencimiento.",
          position: 'bottom'
        },
        {
          element: '.invoice-table tfoot',
          intro: "Aquí puedes ver los totales de tu cartera. Esto te da una visión rápida del valor total de tus facturas y su valor futuro proyectado.",
          position: 'top'
        },
        {
          element: '.portfolio-metrics',
          intro: "Esta sección muestra métricas clave de tu cartera. Te ayuda a entender rápidamente el valor neto, el interés total y la TCEA promedio ponderada de todas tus facturas.",
          position: 'left'
        },
        {
          element: 'app-calculator-discount',
          intro: "La Calculadora de Descuento te permite calcular descuentos para tus facturas. Puedes ajustar parámetros como la fecha de descuento y el porcentaje adicional para ver cómo afectan al valor de tu cartera.",
          position: 'top'
        },
        {
          element: 'app-fixed-amount-calculator',
          intro: "La Calculadora de Monto Fijo te ayuda a determinar qué descuento necesitas aplicar para alcanzar un monto específico. Es útil cuando necesitas liquidez por un valor determinado.",
          position: 'top'
        },
        {
          element: '.invoice-table .action-buttons',
          intro: "Aquí puedes gestionar individualmente cada factura. Puedes actualizar su estado o eliminarla si es necesario.",
          position: 'left'
        },
        {
          intro: "¡Eso es todo! Ahora estás listo para usar la Calculadora Financiera de Descuentos. Esta herramienta te ayudará a tomar decisiones informadas sobre el manejo de tus facturas y flujo de caja."
        }
      ],
      showProgress: true,
      showBullets: false,
      showStepNumbers: true,
      exitOnOverlayClick: false,
      exitOnEsc: false,
      nextLabel: 'Siguiente >',
      prevLabel: '< Anterior',
      skipLabel: 'Saltar',
      doneLabel: 'Finalizar'
    });
    intro.start();
  }
}
