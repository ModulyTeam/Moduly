import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Invoice } from '../../models/Invoice.model';

interface ExpiredInvoiceDetail {
  code: string;
  dueDate: string;
}

interface DiscountResult {
  code: string;
  totalPayment: number;
  originalFutureValue: number;
  futureDateValue: number;
  discountDays: number;
  baseDiscount: number;
  additionalDiscount: number;
  totalDiscount: number;
  discountedAmount: number;
  isExpired: boolean;
}

@Component({
  selector: 'app-fixed-amount-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './fixed-amount-calculator.component.html',
  styleUrls: ['./fixed-amount-calculator.component.css']
})
export class FixedAmountCalculatorComponent {
  @Input() invoices: Invoice[] = [];
  fixedAmountForm: FormGroup;
  discountResults: any[] = [];
  explanation: string = '';

  constructor(private formBuilder: FormBuilder) {
    this.fixedAmountForm = this.formBuilder.group({
      fixedAmount: ['', [Validators.required, Validators.min(0)]],
      discountDate: ['', Validators.required],
      enableMaxLoss: [false],
      maxLossAmount: [0],
      enableBalancedDiscount: [false],
      maxTotalDiscount: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
      enableMaxDesiredDiscount: [false],
      maxDesiredDiscount: [0, [Validators.min(0), Validators.max(100)]]
    });
  }

  calculateFixedAmountDiscount() {
    const fixedAmount = this.fixedAmountForm.get('fixedAmount')?.value;
    const discountDate = new Date(this.fixedAmountForm.get('discountDate')?.value);
    const maxTotalDiscount = this.fixedAmountForm.get('maxTotalDiscount')?.value / 100 || 1; // Si no se especifica, usar 100%
    const enableMaxLoss = this.fixedAmountForm.get('enableMaxLoss')?.value;
    const maxLossAmount = this.fixedAmountForm.get('maxLossAmount')?.value;
    const enableBalancedDiscount = this.fixedAmountForm.get('enableBalancedDiscount')?.value;
    const enableMaxDesiredDiscount = this.fixedAmountForm.get('enableMaxDesiredDiscount')?.value; // Nuevo campo
    const maxDesiredDiscount = this.fixedAmountForm.get('maxDesiredDiscount')?.value / 100; // Nuevo campo



    console.log('Monto fijo deseado:', fixedAmount);
    console.log('Fecha de descuento:', discountDate);
    console.log('Descuento total máximo:', maxTotalDiscount);

    let totalDiscountedAmount = 0;
    let hasExpiredInvoices = false;
    let expiredInvoicesDetails: ExpiredInvoiceDetail[] = [];

    // Primer paso: calcular descuentos base y valores futuros
    this.discountResults = this.invoices.map(invoice => {
      const issueDate = new Date(invoice.issueDate || '');
      const dueDate = new Date(invoice.dueDate || '');
      const totalDays = (dueDate.getTime() - issueDate.getTime()) / (1000 * 3600 * 24);
      const discountDays = Math.max(0, (dueDate.getTime() - discountDate.getTime()) / (1000 * 3600 * 24));

      const tcea = invoice.tcea || 0;
      let baseDiscount = 0;
      let originalFutureValue = 0;
      let futureDateValue = 0;

      if (discountDays <= 0) {
        // Factura vencida
        baseDiscount = 1 - Math.pow(1 / (1 + tcea), totalDays / 365);
        originalFutureValue = (invoice.totalPayment ?? 0) * Math.pow(1 + tcea, totalDays / 365);
        futureDateValue = originalFutureValue;
        hasExpiredInvoices = true;
        expiredInvoicesDetails.push({
          code: invoice.code,
          dueDate: dueDate.toISOString().split('T')[0]
        });
      } else {
        baseDiscount = 1 - Math.pow(1 / (1 + tcea), discountDays / 365);
        originalFutureValue = (invoice.totalPayment ?? 0) * Math.pow(1 + tcea, totalDays / 365);
        futureDateValue = (invoice.totalPayment ?? 0) * Math.pow(1 + tcea, totalDays / 365);
      }

      console.log('Factura procesada:', invoice.code, 'Descuento base:', baseDiscount * 100, '%');
      return {
        code: invoice.code,
        totalPayment: invoice.totalPayment,
        originalFutureValue,
        futureDateValue,
        discountDays,
        baseDiscount: baseDiscount * 100,
        additionalDiscount: 0,
        totalDiscount: baseDiscount * 100,
        discountedAmount: originalFutureValue * (1 - baseDiscount),
        isExpired: discountDays <= 0,
        tcea: tcea * 100
      };
    });

    // Calcular el monto total con descuento base
    totalDiscountedAmount = this.discountResults.reduce((sum, result) => sum + result.discountedAmount, 0);
    console.log('Monto total con descuento base:', totalDiscountedAmount);

    if (enableMaxLoss) {
      const totalOriginalFutureValue = this.calculateTotalFutureValue();
      const totalLoss = totalOriginalFutureValue - totalDiscountedAmount;

      if (totalLoss > maxLossAmount) {
        const excessLoss = totalLoss - maxLossAmount;
        const lossReductionFactor = excessLoss / totalLoss;

        this.discountResults = this.discountResults.map(result => {
          const adjustedTotalDiscount = result.totalDiscount / 100 * (1 - lossReductionFactor);
          const adjustedAdditionalDiscount = (adjustedTotalDiscount - result.baseDiscount / 100) / (1 - result.baseDiscount / 100);
          const finalDiscountedAmount = result.originalFutureValue * (1 - adjustedTotalDiscount);
          return {
            ...result,
            additionalDiscount: adjustedAdditionalDiscount * 100,
            totalDiscount: adjustedTotalDiscount * 100,
            discountedAmount: finalDiscountedAmount
          };
        });
      }
    }

    // Segundo paso: ajustar descuentos adicionales si es necesario
    if (totalDiscountedAmount > fixedAmount) {
      console.log('Se necesita descuento adicional para reducir el monto');
      const nonExpiredInvoices = this.discountResults.filter(result => !result.isExpired);
      const totalNonExpiredValue = nonExpiredInvoices.reduce((sum, result) => sum + result.originalFutureValue, 0);
      let excessAmount = totalDiscountedAmount - fixedAmount;

      console.log('Monto excedente a descontar:', excessAmount);
      console.log('Valor total de facturas no vencidas:', totalNonExpiredValue);

      // Distribuir el descuento adicional proporcionalmente
      nonExpiredInvoices.forEach(result => {
        const maxAdditionalDiscount = maxTotalDiscount - result.baseDiscount / 100;
        const proportionalShare = result.originalFutureValue / totalNonExpiredValue;
        const additionalDiscountPercentage = Math.min(maxAdditionalDiscount, (excessAmount / result.originalFutureValue) * proportionalShare);

        console.log('Factura:', result.code);
        console.log('Descuento máximo adicional permitido:', maxAdditionalDiscount * 100, '%');
        console.log('Proporción del valor total:', proportionalShare);
        console.log('Descuento adicional calculado:', additionalDiscountPercentage * 100, '%');

        result.additionalDiscount = additionalDiscountPercentage * 100;
        result.totalDiscount = result.baseDiscount + result.additionalDiscount;
        result.discountedAmount = result.originalFutureValue * (1 - result.totalDiscount / 100);

        console.log('Descuento total aplicado:', result.totalDiscount, '%');
        console.log('Nuevo monto con descuento:', result.discountedAmount);
      });

      // Recalcular el monto total con descuento
      totalDiscountedAmount = this.discountResults.reduce((sum, result) => sum + result.discountedAmount, 0);
      console.log('Nuevo monto total con descuento adicional:', totalDiscountedAmount);

      // Ajuste final si aún hay una pequeña diferencia
      if (totalDiscountedAmount > fixedAmount) {
        console.log('Se necesita ajuste final');
        const difference = totalDiscountedAmount - fixedAmount;
        const lastNonExpiredInvoice = nonExpiredInvoices[nonExpiredInvoices.length - 1];
        if (lastNonExpiredInvoice) {
          const maxAdditionalAdjustment = lastNonExpiredInvoice.originalFutureValue * (maxTotalDiscount - lastNonExpiredInvoice.totalDiscount / 100);
          const adjustment = Math.min(difference, maxAdditionalAdjustment);
          lastNonExpiredInvoice.discountedAmount -= adjustment;
          lastNonExpiredInvoice.totalDiscount = (1 - lastNonExpiredInvoice.discountedAmount / lastNonExpiredInvoice.originalFutureValue) * 100;
          lastNonExpiredInvoice.additionalDiscount = lastNonExpiredInvoice.totalDiscount - lastNonExpiredInvoice.baseDiscount;

          console.log('Ajuste final aplicado:', adjustment);
          console.log('Descuento total final para última factura:', lastNonExpiredInvoice.totalDiscount, '%');
        }
      }
    } else {
      console.log('No se necesita descuento adicional');
    }

    if (enableMaxDesiredDiscount) {
      this.discountResults = this.discountResults.map(result => {
        const desiredDiscountLimit = Math.min(result.totalDiscount / 100, maxDesiredDiscount);
        return {
          ...result,
          totalDiscount: desiredDiscountLimit * 100,
          discountedAmount: result.originalFutureValue * (1 - desiredDiscountLimit)
        };
      });

      // Recalcular el monto total con descuento para verificar
      totalDiscountedAmount = this.discountResults.reduce((sum, result) => sum + result.discountedAmount, 0);
      console.log('Monto total ajustado con descuento máximo deseado:', totalDiscountedAmount);
    }

    if (enableBalancedDiscount) {
      this.discountResults = this.discountResults.map(result => {
        const totalDiscount = Math.min(result.totalDiscount / 100, maxTotalDiscount);
        return {
          ...result,
          totalDiscount: totalDiscount * 100,
          discountedAmount: result.originalFutureValue * (1 - totalDiscount)
        };
      });
    }

    console.log('Monto total final con descuento:', totalDiscountedAmount);

    this.generateExplanation(hasExpiredInvoices, expiredInvoicesDetails, totalDiscountedAmount, fixedAmount);
  }

  private canIncreaseDiscount(invoices: any[], maxTotalDiscount: number): boolean {
    return invoices.some(invoice => invoice.totalDiscount / 100 < maxTotalDiscount);
  }

  private generateExplanation(hasExpiredInvoices: boolean, expiredInvoicesDetails: ExpiredInvoiceDetail[], totalDiscountedAmount: number, fixedAmount: number) {
    const totalOriginal = this.discountResults.reduce((sum, result) => sum + result.totalPayment, 0);
    const totalFutureValue = this.discountResults.reduce((sum, result) => sum + result.futureDateValue, 0);
    const expiredAmount = this.discountResults.reduce((sum, result) => result.isExpired ? sum + result.futureDateValue : sum, 0);

    let explanation = `
      Análisis para el monto fijo deseado de ${fixedAmount}:
      - Valor total original de las facturas: ${totalOriginal.toFixed(2)}
      - Valor futuro total en fechas de vencimiento: ${totalFutureValue.toFixed(2)}
      - Monto total con descuento aplicado: ${totalDiscountedAmount.toFixed(2)}
    `;

    if (hasExpiredInvoices) {
      explanation += `\n\nATENCIÓN: Se han detectado facturas vencidas:`;
      expiredInvoicesDetails.forEach(invoice => {
        explanation += `\n- La factura ${invoice.code} venció el ${invoice.dueDate}.`;
      });
      explanation += `\nMonto total de facturas vencidas: ${expiredAmount.toFixed(2)}`;
    }

    if (totalDiscountedAmount < fixedAmount) {
      explanation += `\n\nNOTA: No se pudo alcanzar el monto fijo deseado de ${fixedAmount} incluso aplicando el máximo descuento adicional permitido. El monto máximo alcanzado es ${totalDiscountedAmount.toFixed(2)}.`;
    } else if (totalDiscountedAmount > fixedAmount) {
      explanation += `\n\nNOTA: Se ha superado ligeramente el monto fijo deseado para ajustarse a los límites de descuento de las facturas.`;
    }

    const costOfOpportunity = totalFutureValue - totalDiscountedAmount;
    explanation += `\n\nCosto de oportunidad si se procede con la operación: ${costOfOpportunity.toFixed(2)}`;

    explanation += `\n\nRECOMENDACIÓN: Evalúa cuidadosamente si el costo de oportunidad justifica tus necesidades actuales de flujo de caja. Procede solo si es absolutamente necesario y si puedes manejar el pago anticipado de las facturas no vencidas.`;

    this.explanation = explanation;
  }


  private calculateTotalFutureValue(): number {
    return this.invoices.reduce((total, invoice) => {
      const issueDate = new Date(invoice.issueDate || '');
      const dueDate = new Date(invoice.dueDate || '');
      const totalDays = (dueDate.getTime() - issueDate.getTime()) / (1000 * 3600 * 24);
      const tcea = invoice.tcea || 0;
      const futureValue = (invoice.totalPayment ?? 0) * Math.pow(1 + tcea, totalDays / 365);
      return total + futureValue;
    }, 0);
  }


}
