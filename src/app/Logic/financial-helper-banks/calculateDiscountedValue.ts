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
    applyTimeValue: boolean = false,
    useCommercialYear: boolean = false
  ): number | null {
    const issueDate = new Date(invoice.issueDate || '');
    const dueDate = new Date(invoice.dueDate || '');
    const currentDate = new Date(targetDate);
    const daysInYear = useCommercialYear ? 360 : 365;

    if (currentDate > dueDate) {
      return null;
    }

    const totalAmount = (invoice.unitPrice || 0) * (invoice.quantity || 0);
    const daysToTarget = (currentDate.getTime() - issueDate.getTime()) / (1000 * 3600 * 24);
    const totalDays = (dueDate.getTime() - issueDate.getTime()) / (1000 * 3600 * 24);

    let discountedValue = totalAmount;

    if (applyTimeValue && invoice.tcea) {
      discountedValue *= Math.pow(1 + invoice.tcea, daysToTarget / daysInYear);
    }

    discountedValue *= Math.pow(1 - tcea, (totalDays - daysToTarget) / daysInYear);

    return discountedValue;
  }

  calculateTotalSavings(
    invoices: Invoice[],
    selectedInvoiceIds: Set<string>,
    targetDate: Date,
    useBankTCEA: { [key: string]: boolean },
    bankMap: Map<string, any>,
    applyTimeValue: boolean = false,
    useCommercialYear: boolean = false
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
        applyTimeValue,
        useCommercialYear
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
