import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Invoice } from '../../models/Invoice.model';

@Component({
  selector: 'app-calculator-discount',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './calculator-discount.component.html',
  styleUrls: ['./calculator-discount.component.css']
})
export class CalculatorDiscountComponent {
  @Input() invoices: Invoice[] = [];
  discountForm: FormGroup;
  discountResults: any[] = [];
  explanation: string = '';

  constructor(private formBuilder: FormBuilder) {
    this.discountForm = this.formBuilder.group({
      discountDate: ['', Validators.required],
      additionalDiscount: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      enableMaxLoss: [false],
      maxLossAmount: [0],
      enableBalancedDiscount: [false],
      maxTotalDiscount: [0, [Validators.min(0), Validators.max(100)]]
    });
  }

  calculateDiscount() {
    const discountDate = new Date(this.discountForm.get('discountDate')?.value);
    const additionalDiscount = this.discountForm.get('additionalDiscount')?.value / 100;
    const enableMaxLoss = this.discountForm.get('enableMaxLoss')?.value;
    const maxLossAmount = this.discountForm.get('maxLossAmount')?.value;
    const enableBalancedDiscount = this.discountForm.get('enableBalancedDiscount')?.value;
    const maxTotalDiscount = this.discountForm.get('maxTotalDiscount')?.value / 100;

    this.discountResults = this.invoices.map(invoice => {
      const issueDate = new Date(invoice.issueDate || '');
      const dueDate = new Date(invoice.dueDate || '');
      const totalDays = (dueDate.getTime() - issueDate.getTime()) / (1000 * 3600 * 24);
      const discountDays = Math.max(0, (dueDate.getTime() - discountDate.getTime()) / (1000 * 3600 * 24));
      
      const tcea = invoice.tcea || 0;
      const baseDiscount = 1 - Math.pow(1 / (1 + tcea), discountDays / 365);
      let totalDiscount = 1 - (1 - baseDiscount) * (1 - additionalDiscount);

      if (enableBalancedDiscount) {
        totalDiscount = Math.min(totalDiscount, maxTotalDiscount);
      }

      const originalFutureValue = (invoice.totalPayment ?? 0) * Math.pow(1 + tcea, totalDays / 365);
      const discountedAmount = originalFutureValue * (1 - totalDiscount);
      
      return {
        code: invoice.code,
        totalPayment: invoice.totalPayment,
        originalFutureValue: originalFutureValue,
        discountDays,
        baseDiscount: baseDiscount * 100,
        additionalDiscount: additionalDiscount * 100,
        totalDiscount: totalDiscount * 100,
        discountedAmount
      };
    });

    // Ajustar los descuentos si se excede la pérdida máxima
    if (enableMaxLoss) {
      const totalOriginalFutureValue = this.calculateTotalFutureValue();
      const totalDiscountedAmount = this.discountResults.reduce((sum, result) => sum + result.discountedAmount, 0);
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

    this.generateExplanation();
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

  private generateExplanation() {
    const discountDate = new Date(this.discountForm.get('discountDate')?.value);
    const additionalDiscount = this.discountForm.get('additionalDiscount')?.value;
    const enableMaxLoss = this.discountForm.get('enableMaxLoss')?.value;
    const maxLossAmount = this.discountForm.get('maxLossAmount')?.value;
    const enableBalancedDiscount = this.discountForm.get('enableBalancedDiscount')?.value;
    const maxTotalDiscount = this.discountForm.get('maxTotalDiscount')?.value;

    let explanation = `Cálculo de descuento realizado el ${discountDate.toLocaleDateString()}:\n\n`;
    explanation += `1. Se aplicó un descuento adicional del ${additionalDiscount}% a todas las facturas.\n`;
    explanation += `2. Para cada factura, se calculó el descuento base según su TCEA y los días anticipados.\n`;
    explanation += `3. El descuento total se calculó combinando el descuento base y el adicional.\n`;

    if (enableBalancedDiscount) {
      explanation += `4. Se aplicó un descuento balanceado, limitando el descuento total máximo al ${maxTotalDiscount}%.\n`;
    }

    if (enableMaxLoss) {
      explanation += `5. Se estableció un monto máximo de pérdida de ${maxLossAmount}.\n`;
      if (this.discountResults.some(result => result.adjustedTotalDiscount !== undefined)) {
        explanation += `   - Se ajustaron los descuentos para no exceder la pérdida máxima permitida.\n`;
      } else {
        explanation += `   - No fue necesario ajustar los descuentos, ya que la pérdida total no excedió el límite.\n`;
      }
    }

    explanation += `\nResumen de resultados:\n`;
    explanation += `- Número de facturas procesadas: ${this.discountResults.length}\n`;
    const totalOriginal = this.discountResults.reduce((sum, result) => sum + result.originalFutureValue, 0);
    const totalDiscounted = this.discountResults.reduce((sum, result) => sum + result.discountedAmount, 0);
    explanation += `- Valor total original: ${totalOriginal.toLocaleString('es-ES', {style: 'currency', currency: 'EUR'})}\n`;
    explanation += `- Valor total con descuento: ${totalDiscounted.toLocaleString('es-ES', {style: 'currency', currency: 'EUR'})}\n`;
    explanation += `- Ahorro total: ${(totalOriginal - totalDiscounted).toLocaleString('es-ES', {style: 'currency', currency: 'EUR'})}`;

    this.explanation = explanation;
  }
}
