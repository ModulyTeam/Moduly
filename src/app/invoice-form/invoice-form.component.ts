import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-invoice-form',
  templateUrl: './invoice-form.component.html',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./invoice-form.component.css']
})
export class InvoiceFormComponent implements OnInit {
  selectedBank: any;
  invoice: any;

  constructor(private router: Router) {}

  ngOnInit(): void {
    const state = window.history.state;
    this.selectedBank = state.selectedBank;
    this.invoice = state.invoiceData;

    // Add default values for new fields
    this.invoice = {
      ...this.invoice,
      issuerRef: 'REF-' + Math.random().toString(36).substr(2, 9),
      placeOfIssue: 'Lima, Peru',
      recipientName: 'Cliente Example S.A.',
      recipientAddress: 'Av. Principal 123, Lima',
      recipientDoi: '20123456789',
      recipientPhone: '+51 1 234 5678',
      accountNumber: '123-456789-0',
      discountCode: 'DC-001',
      guarantor: 'Garantía S.A.',
      permanentGuarantee: 'No',
      signatures: 'Pendiente'
    };
  }

  exportToExcel() {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet([this.invoice]);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoice');
    XLSX.writeFile(wb, 'invoice.xlsx');
  }
}
