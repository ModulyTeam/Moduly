import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {NgIf, NgClass, DatePipe, CurrencyPipe, PercentPipe} from '@angular/common';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface DiscountLetterData {
  totalOriginal: number;
  totalDiscounted: number;
  savings: number;
  validInvoices: number;
  targetDate: Date;
  involvedBanks?: string[];
  applyTimeValue: boolean;
  useCommercialYear: boolean;
  tcea: number;
  daysToTarget: number;
  totalDays: number;
}

interface CompanyData {
  name: string;
  representativeName: string;
  representativePosition: string;
}

@Component({
  selector: 'app-emitpdfdiscountletter',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgClass, DatePipe, CurrencyPipe, PercentPipe],
  templateUrl: './emitpdfdiscountletter.component.html',
  styleUrl: './emitpdfdiscountletter.component.css'
})
export class EmitpdfdiscountletterComponent implements OnInit {
  @Input() discountData!: DiscountLetterData;

  letterForm: FormGroup;
  previewMode = false;
  selectedLogo: string | null = null;

  constructor(private fb: FormBuilder) {
    this.letterForm = this.fb.group({
      letterNumber: ['', Validators.required],
      emitterName: ['', Validators.required],
      emitterPosition: [''],
      emitterCompany: ['', Validators.required],
      recipientName: ['', Validators.required],
      recipientPosition: [''],
      recipientCompany: ['', Validators.required],
      additionalNotes: [''],
      includeLogo: [false],
      includeFormulas: [true],
      includeDetails: [true]
    });
  }

  ngOnInit() {
    // Recuperar datos del localStorage
    const savedData = localStorage.getItem('discountLetterData');
    if (savedData) {
      this.discountData = JSON.parse(savedData);
      localStorage.removeItem('discountLetterData'); // Limpiar después de usar
    }

    // Inicializar con datos de la empresa si están disponibles
    const companyData = this.getCompanyData();
    if (companyData) {
      this.letterForm.patchValue({
        emitterCompany: companyData.name,
        emitterName: companyData.representativeName,
        emitterPosition: companyData.representativePosition
      });
    }
  }

  private getCompanyData(): CompanyData | null {
    // Similar to how InvoiceToLetter gets company data
    const companyId = localStorage.getItem('companyId');
    if (!companyId) return null;

    // You can either get this from localStorage or make an API call
    // For now, we'll return null to prevent the error
    return {
      name: localStorage.getItem('companyName') || '',
      representativeName: localStorage.getItem('representativeName') || '',
      representativePosition: localStorage.getItem('representativePosition') || ''
    };
  }

  onLogoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedLogo = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  togglePreview() {
    if (this.letterForm.valid) {
      this.previewMode = !this.previewMode;
    }
  }

  async generatePDF() {
    const content = document.getElementById('pdf-preview');
    if (!content) return;

    try {
      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`letra_descuento_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('Error generando PDF:', error);
    }
  }
}
