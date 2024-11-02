import { Injectable } from '@angular/core';
import { Invoice } from '../../models/Invoice.model';

@Injectable({
  providedIn: 'root'
})
export class FinancialCalculationsService {
  calculateDiscountedValue(
    invoice: Invoice,
    targetDate: Date,
    tcea: number,
    applyTimeValue: boolean = false
  ): number | null {
    const issueDate = new Date(invoice.issueDate || '');
    const dueDate = new Date(invoice.dueDate || '');
    const currentDate = new Date(targetDate);

    // Check if invoice has already expired
    if (currentDate > dueDate) {
      return null;
    }

    const totalAmount = (invoice.unitPrice || 0) * (invoice.quantity || 0);

    // Calculate days between dates
    const daysToTarget = (currentDate.getTime() - issueDate.getTime()) / (1000 * 3600 * 24);
    const totalDays = (dueDate.getTime() - issueDate.getTime()) / (1000 * 3600 * 24);

    let discountedValue = totalAmount;

    // Apply time value of money if requested (using invoice TCEA)
    if (applyTimeValue && invoice.tcea) {
      discountedValue *= Math.pow(1 + invoice.tcea, daysToTarget / 365);
    }

    // Apply bank discount
    discountedValue *= Math.pow(1 - tcea, (totalDays - daysToTarget) / 365);

    return discountedValue;
  }

  calculateTotalSavings(
    invoices: Invoice[],
    selectedInvoiceIds: Set<string>,
    targetDate: Date,
    useBankTCEA: { [key: string]: boolean },
    bankMap: Map<string, any>,
    applyTimeValue: boolean = false
  ): {
    totalOriginal: number;
    totalDiscounted: number;
    savings: number;
    validInvoices: number;
  } {
    let totalOriginal = 0;
    let totalDiscounted = 0;
    let validInvoices = 0;

    invoices.forEach(invoice => {
      if (!invoice.id || !selectedInvoiceIds.has(invoice.id)) {
        return;
      }

      const originalAmount = (invoice.unitPrice || 0) * (invoice.quantity || 0);

      // Determine which TCEA to use
      let tcea = invoice.tcea || 0;
      if (invoice.id && useBankTCEA[invoice.id] && invoice.bankId) {
        const bank = bankMap.get(invoice.bankId);
        if (bank) {
          tcea = bank.tceApreferredRate || 0;
        }
      }

      const discountedValue = this.calculateDiscountedValue(
        invoice,
        targetDate,
        tcea,
        applyTimeValue
      );

      if (discountedValue !== null) {
        totalOriginal += originalAmount;
        totalDiscounted += discountedValue;
        validInvoices++;
      }
    });

    return {
      totalOriginal,
      totalDiscounted,
      savings: totalOriginal - totalDiscounted,
      validInvoices
    };
  }
}
