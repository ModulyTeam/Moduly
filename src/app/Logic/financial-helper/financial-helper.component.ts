import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../requests/ApiService';
import { Invoice } from '../../models/Invoice.model';
import introJs from 'intro.js';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-financial-helper',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './financial-helper.component.html',
  styleUrls: ['./financial-helper.component.css']
})
export class FinancialHelperComponent implements OnInit {
  invoices: Invoice[] = [];
  discountForm: FormGroup;
  fixedAmountForm: FormGroup;
  discountResults: any[] = [];
  showFixedAmountSection = false;
  moduleId: string | null = null;
  explanation: string = '';
  currentPage = 1;
  pageSize = 10;
  isFixedAmountCalculation: boolean = false;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder
  ) {
    this.discountForm = this.formBuilder.group({
      discountDate: ['', Validators.required],
      additionalDiscount: [0, [Validators.min(0), Validators.max(100)]],
      enableMaxLoss: [false],
      maxLossAmount: [{ value: 0, disabled: true }, [Validators.min(0)]],
      enableBalancedDiscount: [false],
      maxTotalDiscount: [{ value: 0, disabled: true }, [Validators.min(0), Validators.max(100)]]
    });

    this.fixedAmountForm = this.formBuilder.group({
      fixedAmount: ['', [Validators.required, Validators.min(0)]],
      discountDate: ['', Validators.required],
      enableMaxLoss: [false],
      maxLossAmount: [{ value: 0, disabled: true }, [Validators.min(0)]],
      enableBalancedDiscount: [false],
      maxTotalDiscount: [{ value: 0, disabled: true }, [Validators.min(0), Validators.max(100)]],
      enableMaxDesiredDiscount: [false],
      maxDesiredDiscount: [{ value: 0, disabled: true }, [Validators.min(0), Validators.max(100)]]
    });

    // Agregar listeners para habilitar/deshabilitar el campo maxLossAmount
    this.discountForm.get('enableMaxLoss')?.valueChanges.subscribe(enabled => {
      if (enabled) {
        this.discountForm.get('maxLossAmount')?.enable();
      } else {
        this.discountForm.get('maxLossAmount')?.disable();
      }
    });

    this.fixedAmountForm.get('enableMaxLoss')?.valueChanges.subscribe(enabled => {
      if (enabled) {
        this.fixedAmountForm.get('maxLossAmount')?.enable();
      } else {
        this.fixedAmountForm.get('maxLossAmount')?.disable();
      }
    });

    // Agregar listeners para habilitar/deshabilitar los campos
    this.discountForm.get('enableBalancedDiscount')?.valueChanges.subscribe(enabled => {
      if (enabled) {
        this.discountForm.get('maxTotalDiscount')?.enable();
      } else {
        this.discountForm.get('maxTotalDiscount')?.disable();
      }
    });

    this.fixedAmountForm.get('enableBalancedDiscount')?.valueChanges.subscribe(enabled => {
      if (enabled) {
        this.fixedAmountForm.get('maxTotalDiscount')?.enable();
      } else {
        this.fixedAmountForm.get('maxTotalDiscount')?.disable();
      }
    });

    this.fixedAmountForm.get('enableMaxDesiredDiscount')?.valueChanges.subscribe(enabled => {
      if (enabled) {
        this.fixedAmountForm.get('maxDesiredDiscount')?.enable();
      } else {
        this.fixedAmountForm.get('maxDesiredDiscount')?.disable();
      }
    });
  }

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

  calculateDiscount() {
    const discountDate = new Date(this.discountForm.get('discountDate')?.value || '');
    const additionalDiscount = this.discountForm.get('additionalDiscount')?.value / 100 || 0;
    const maxLossEnabled = this.discountForm.get('enableMaxLoss')?.value;
    const maxLossAmount = this.discountForm.get('maxLossAmount')?.value;
    const enableBalancedDiscount = this.discountForm.get('enableBalancedDiscount')?.value;
    const maxTotalDiscount = this.discountForm.get('maxTotalDiscount')?.value / 100 || 0;

    let totalExcessDiscount = 0;

    this.discountResults = this.invoices.map(invoice => {
      const issueDate = new Date(invoice.issueDate || '');
      const dueDate = new Date(invoice.dueDate || '');
      const totalDays = (dueDate.getTime() - issueDate.getTime()) / (1000 * 3600 * 24);
      const daysEarly = Math.max(0, (dueDate.getTime() - discountDate.getTime()) / (1000 * 3600 * 24));
      
      const tcea = invoice.tcea || 0;
      const dailyRate = Math.pow(1 + tcea, 1/365) - 1;
      
      // Calcular el monto total incluyendo intereses
      const totalAmount = (invoice.totalPayment ?? 0) * Math.pow(1 + tcea, totalDays / 365);

      if (daysEarly <= 0) {
        // La factura ya venció, no se aplica descuento
        return {
          ...invoice,
          daysEarly: 0,
          baseDiscount: 0,
          additionalDiscount: 0,
          totalDiscount: 0,
          discountedAmount: totalAmount,
          isExpired: true
        };
      }

      const discountFactor = Math.pow(1 + dailyRate, daysEarly);
      const baseDiscount = 1 - (1 / discountFactor);
      let totalDiscount = baseDiscount + additionalDiscount - (baseDiscount * additionalDiscount);

      if (enableBalancedDiscount && totalDiscount > maxTotalDiscount) {
        const excessDiscount = totalDiscount - maxTotalDiscount;
        totalExcessDiscount += excessDiscount * invoice.totalPayment!;
        totalDiscount = maxTotalDiscount;
      }

      const discountedAmount = totalAmount * (1 - totalDiscount);

      return {
        ...invoice,
        daysEarly,
        baseDiscount: baseDiscount * 100,
        additionalDiscount: additionalDiscount * 100,
        totalDiscount: totalDiscount * 100,
        discountedAmount,
        totalAmount,
        isExpired: false
      };
    });

    if (enableBalancedDiscount && totalExcessDiscount > 0) {
      this.balanceDiscounts(totalExcessDiscount);
    }

    this.isFixedAmountCalculation = false;
    this.generateExplanation();
  }

  calculateFixedAmountDiscount() {
    const fixedAmount = this.fixedAmountForm.get('fixedAmount')?.value || 0;
    const discountDate = new Date(this.fixedAmountForm.get('discountDate')?.value || '');
    const maxLossEnabled = this.fixedAmountForm.get('enableMaxLoss')?.value;
    const maxLossAmount = this.fixedAmountForm.get('maxLossAmount')?.value;
    const enableBalancedDiscount = this.fixedAmountForm.get('enableBalancedDiscount')?.value;
    const maxTotalDiscount = this.fixedAmountForm.get('maxTotalDiscount')?.value / 100 || 0;
    const enableMaxDesiredDiscount = this.fixedAmountForm.get('enableMaxDesiredDiscount')?.value;
    const maxDesiredDiscount = this.fixedAmountForm.get('maxDesiredDiscount')?.value / 100 || 0;

    let totalOriginalAmount = 0;
    let totalDiscountedAmount = 0;
    let amountFromExpiredInvoices = 0;
    let totalFutureValue = this.calculateTotalFutureValue();

    this.discountResults = this.invoices.map(invoice => {
      const issueDate = new Date(invoice.issueDate || '');
      const dueDate = new Date(invoice.dueDate || '');
      const totalDays = (dueDate.getTime() - issueDate.getTime()) / (1000 * 3600 * 24);
      const daysEarly = Math.max(0, (dueDate.getTime() - discountDate.getTime()) / (1000 * 3600 * 24));
      
      const tcea = invoice.tcea || 0;
      const dailyRate = Math.pow(1 + tcea, 1/365) - 1;
      
      // Calcular el monto total incluyendo intereses
      const totalAmount = (invoice.totalPayment ?? 0) * Math.pow(1 + tcea, totalDays / 365);

      if (daysEarly <= 0) {
        // La factura ya venció o vencerá antes de la fecha de descuento
        amountFromExpiredInvoices += totalAmount;
        return {
          ...invoice,
          daysEarly: 0,
          baseDiscount: 0,
          additionalDiscount: 0,
          totalDiscount: 0,
          discountedAmount: totalAmount,
          totalAmount,
          isExpired: true
        };
      }

      totalOriginalAmount += totalAmount;
      const discountFactor = Math.pow(1 + dailyRate, daysEarly);
      const baseDiscount = 1 - (1 / discountFactor);
      const discountedAmount = totalAmount * (1 - baseDiscount);
      totalDiscountedAmount += discountedAmount;

      return {
        ...invoice,
        daysEarly,
        baseDiscount: baseDiscount * 100,
        discountedAmount,
        totalAmount,
        isExpired: false
      };
    });

    const remainingAmount = fixedAmount - amountFromExpiredInvoices;
    const additionalDiscountPercentage = Math.max(0, (totalDiscountedAmount - remainingAmount) / totalOriginalAmount);

    // Verificar si se puede alcanzar el monto fijo deseado
    let canReachFixedAmount = true;
    let reason = '';

    if (totalFutureValue < fixedAmount) {
      canReachFixedAmount = false;
      reason = 'El monto fijo deseado es mayor que el valor futuro total de las facturas.';
    } else if (maxLossEnabled && (totalFutureValue - fixedAmount) > maxLossAmount) {
      canReachFixedAmount = false;
      reason = 'No se puede alcanzar el monto fijo deseado sin exceder la pérdida máxima permitida.';
    } else if (enableMaxDesiredDiscount && additionalDiscountPercentage > maxDesiredDiscount) {
      canReachFixedAmount = false;
      reason = 'No se puede alcanzar el monto fijo deseado sin exceder el descuento máximo deseado.';
    }

    if (!canReachFixedAmount) {
      this.generateExplanation(true, amountFromExpiredInvoices, fixedAmount, canReachFixedAmount, reason);
      return;
    }

    this.discountResults = this.discountResults.map(result => {
      if (result.isExpired) {
        return result;
      }
      const totalDiscount = result.baseDiscount / 100 + additionalDiscountPercentage - (result.baseDiscount / 100 * additionalDiscountPercentage);
      const finalDiscountedAmount = result.totalAmount * (1 - totalDiscount);

      return {
        ...result,
        additionalDiscount: additionalDiscountPercentage * 100,
        totalDiscount: totalDiscount * 100,
        finalDiscountedAmount,
      };
    });

    this.isFixedAmountCalculation = true;
    this.generateExplanation(true, amountFromExpiredInvoices, fixedAmount, canReachFixedAmount);
  }

  toggleFixedAmountSection() {
    this.showFixedAmountSection = !this.showFixedAmountSection;
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

  startTutorial() {
    const steps = [
      {
        element: '.portfolio-metrics',
        intro: 'Esta sección muestra las métricas generales de tu cartera financiera.'
      },
      {
        element: '.metric-card:nth-child(1)',
        intro: 'Aquí puedes ver el Valor NETO total de tu cartera.'
      },
      {
        element: '.metric-card:nth-child(2)',
        intro: `Este es el Interés Total generado por tu cartera. Representa la suma de todos los intereses que ganarás si todas las facturas se pagan en sus fechas de vencimiento. Se calcula utilizando la TCEA (Tasa de Costo Efectivo Anual) de cada factura y el tiempo entre la fecha de emisión y la fecha de vencimiento.`
      },
      {
        element: '.metric-card:nth-child(3)',
        intro: 'La TCEA Promedio Ponderada te da una visión general del costo efectivo de tu cartera.'
      },
      {
        element: '.invoice-table',
        intro: 'Esta tabla muestra todas tus facturas. Observa la nueva columna "Valor Futuro" resaltada en dorado, que indica el monto que ganarás al vencimiento de cada factura.'
      },
      {
        element: '.invoice-table tfoot',
        intro: 'Al final de la tabla de facturas, puedes ver los totales, incluyendo el Valor Futuro total de todas tus facturas.'
      },
      {
        element: '.discount-calculator',
        intro: 'Usa esta calculadora para determinar los descuentos basados en pagos anticipados.'
      },
      {
        element: '.discount-calculator input[formControlName="discountDate"]',
        intro: 'Ingresa la fecha de descuento para calcular los días de anticipación.'
      },
      {
        element: '.discount-calculator input[formControlName="additionalDiscount"]',
        intro: 'Puedes agregar un descuento adicional si lo deseas.'
      },
      {
        element: '.discount-calculator input[formControlName="enableMaxLoss"]',
        intro: 'Activa esta opción para establecer una pérdida máxima aceptable en tus cálculos de descuento.'
      },
      {
        element: '.discount-calculator input[formControlName="enableBalancedDiscount"]',
        intro: 'Esta opción te permite balancear los descuentos entre las facturas, estableciendo un descuento máximo por factura.'
      },
      {
        element: '.fixed-amount-calculator',
        intro: 'Esta calculadora te permite determinar el descuento necesario para alcanzar un monto fijo deseado.'
      },
      {
        element: '.fixed-amount-calculator input[formControlName="fixedAmount"]',
        intro: 'Ingresa el monto fijo que deseas recibir.'
      },
      {
        element: '.fixed-amount-calculator input[formControlName="discountDate"]',
        intro: 'Especifica la fecha de descuento para el cálculo del monto fijo.'
      },
      {
        element: '.fixed-amount-calculator input[formControlName="enableMaxLoss"]',
        intro: 'Al igual que en la calculadora de descuentos, puedes establecer una pérdida máxima aceptable.'
      },
      {
        element: '.fixed-amount-calculator input[formControlName="enableBalancedDiscount"]',
        intro: 'También puedes balancear los descuentos en el cálculo de monto fijo.'
      },
      {
        element: '.fixed-amount-calculator input[formControlName="enableMaxDesiredDiscount"]',
        intro: 'Esta nueva opción te permite establecer un descuento máximo deseado para el cálculo de monto fijo.'
      },
      {
        element: '.results-table',
        intro: 'Aquí se mostrarán los resultados detallados de tus cálculos de descuento, incluyendo los totales al final de la tabla.'
      },
      {
        element: '.explanation',
        intro: 'Esta sección proporciona una explicación detallada de los cálculos realizados, incluyendo recomendaciones y consideraciones estratégicas.'
      }
    ];

    introJs().setOptions({ steps: steps }).start();
  }

  generateExplanation(isFixedAmount: boolean = false, amountFromExpiredInvoices: number = 0, fixedAmount: number = 0, canReachFixedAmount: boolean = true, reason: string = '') {
    let totalOriginalAmount = 0;
    let totalDiscountedAmount = 0;
    let totalDiscount = 0;
    let expiredInvoicesAmount = 0;
    let expiredInvoicesCount = 0;

    this.discountResults.forEach(result => {
      if (result.isExpired) {
        expiredInvoicesAmount += result.totalAmount;
        expiredInvoicesCount++;
      } else {
        totalOriginalAmount += result.totalAmount;
        totalDiscountedAmount += result.finalDiscountedAmount || result.discountedAmount;
        totalDiscount += result.totalAmount - (result.finalDiscountedAmount || result.discountedAmount);
      }
    });

    const averageDiscountPercentage = (totalDiscount / totalOriginalAmount) * 100;

    let explanationText = '';

    if (isFixedAmount) {
      if (!canReachFixedAmount) {
        explanationText = `
          <h3>Análisis de la solicitud de monto fijo:</h3>
          <p>No es posible alcanzar el monto fijo deseado de $${fixedAmount.toFixed(2)}.</p>
          <p><strong>Razón:</strong> ${reason}</p>
          <p>Recomendaciones:</p>
          <ul>
            <li>Considere ajustar el monto fijo deseado o las restricciones de descuento.</li>
            <li>Revise las facturas disponibles y sus fechas de vencimiento.</li>
            <li>Evalúe la posibilidad de incluir más facturas en el cálculo si es posible.</li>
          </ul>
        `;
      } else {
        const portfolioMetrics = this.calculatePortfolioMetrics();

        explanationText = `
          <h3>Análisis detallado de la oferta de descuento:</h3>
          <p>Basado en los cálculos realizados, aquí está un resumen de lo que significa esta oferta de descuento para su negocio:</p>
          
          <ul>
            <li>Monto total original de las facturas (incluyendo intereses): $${(totalOriginalAmount + expiredInvoicesAmount).toFixed(2)}</li>
            <li>Monto total con descuento aplicado: $${(totalDiscountedAmount + expiredInvoicesAmount).toFixed(2)}</li>
            <li>Descuento total ofrecido: $${totalDiscount.toFixed(2)}</li>
            <li>Porcentaje promedio de descuento: ${averageDiscountPercentage.toFixed(2)}%</li>
            <li>Facturas vencidas: ${expiredInvoicesCount} por un total de $${expiredInvoicesAmount.toFixed(2)}</li>
          </ul>

          <p>Implicaciones para su negocio:</p>
          <ol>
            <li>Al ofrecer este descuento, recibirá $${(totalDiscountedAmount + expiredInvoicesAmount).toFixed(2)} en lugar de $${(totalOriginalAmount + expiredInvoicesAmount).toFixed(2)}.</li>
            <li>Esto representa una reducción del ${averageDiscountPercentage.toFixed(2)}% en sus ingresos por las facturas no vencidas.</li>
            <li>${isFixedAmount ? 'El descuento se ha calculado para alcanzar el monto fijo que usted especificó.' : 'El descuento se ha calculado basado en la fecha de pago anticipado y el descuento adicional que usted proporcionó.'}</li>
            <li>Hay ${expiredInvoicesCount} facturas vencidas que no son elegibles para descuento, por un total de $${expiredInvoicesAmount.toFixed(2)}.</li>
          </ol>

          <p>Consideraciones estratégicas:</p>
          <ul>
            <li>Liquidez inmediata: Esta oferta de descuento le permitirá obtener $${(totalDiscountedAmount + expiredInvoicesAmount).toFixed(2)} de forma inmediata, mejorando su flujo de caja.</li>
            <li>Costo de oportunidad: Compare el costo de este descuento (${averageDiscountPercentage.toFixed(2)}%) con el costo de obtener financiamiento por otros medios.</li>
            <li>Relaciones con clientes: Ofrecer descuentos por pronto pago puede mejorar las relaciones con sus clientes y fomentar pagos más rápidos en el futuro.</li>
            <li>Riesgo de impago: Al incentivar el pago anticipado, reduce el riesgo de impagos o retrasos prolongados.</li>
          </ul>

          <p>Recomendaciones:</p>
          <ul>
            <li>Si su necesidad de liquidez es urgente y supera el costo del descuento, esta oferta podría ser beneficiosa.</li>
            <li>Considere el impacto en su margen de beneficio y asegúrese de que aún sea rentable después de aplicar el descuento.</li>
            <li>Para las facturas vencidas, considere estrategias de cobro alternativas o negociaciones específicas con esos clientes.</li>
            <li>Evalúe si puede ofrecer términos más favorables a los clientes que pagan consistentemente a tiempo.</li>
          </ul>

          <p>Recuerde que cada factura tiene su propio descuento basado en su fecha de vencimiento y TCEA. Revise los detalles en la tabla de resultados para tomar decisiones específicas para cada factura o cliente.</p>

          <h3>Explicación del Interés Total:</h3>
          <p>El Interés Total de tu cartera es de $${portfolioMetrics.totalInterest.toFixed(2)}. Este monto representa la suma de todos los intereses que ganarías si todas las facturas se pagaran en sus respectivas fechas de vencimiento.</p>
          
          <p>Cálculo del Interés Total:</p>
          <ol>
            <li>Para cada factura, calculamos el número de días entre la fecha de emisión y la fecha de vencimiento.</li>
            <li>Utilizamos la TCEA (Tasa de Costo Efectivo Anual) de cada factura para calcular el valor futuro del monto de la factura en la fecha de vencimiento.</li>
            <li>El interés de cada factura es la diferencia entre este valor futuro y el monto original de la factura.</li>
            <li>Sumamos los intereses de todas las facturas para obtener el Interés Total de la cartera.</li>
          </ol>

          <p>Es importante tener en cuenta que:</p>
          <ul>
            <li>Este cálculo asume que todas las facturas se pagarán en su fecha de vencimiento.</li>
            <li>Si se aplican descuentos por pago anticipado, el interés real ganado será menor.</li>
            <li>La TCEA Promedio Ponderada de tu cartera es de ${portfolioMetrics.weightedTCEA.toFixed(2)}%, lo que refleja el costo efectivo promedio de tu financiamiento considerando los montos de las facturas.</li>
          </ul>
        `;
      }
    } else {
      const portfolioMetrics = this.calculatePortfolioMetrics();

      explanationText = `
        <h3>Análisis detallado de la oferta de descuento:</h3>
        <p>Basado en los cálculos realizados, aquí está un resumen de lo que significa esta oferta de descuento para su negocio:</p>
        
        <ul>
          <li>Monto total original de las facturas (incluyendo intereses): $${(totalOriginalAmount + expiredInvoicesAmount).toFixed(2)}</li>
          <li>Monto total con descuento aplicado: $${(totalDiscountedAmount + expiredInvoicesAmount).toFixed(2)}</li>
          <li>Descuento total ofrecido: $${totalDiscount.toFixed(2)}</li>
          <li>Porcentaje promedio de descuento: ${averageDiscountPercentage.toFixed(2)}%</li>
          <li>Facturas vencidas: ${expiredInvoicesCount} por un total de $${expiredInvoicesAmount.toFixed(2)}</li>
        </ul>

        <p>Implicaciones para su negocio:</p>
        <ol>
          <li>Al ofrecer este descuento, recibirá $${(totalDiscountedAmount + expiredInvoicesAmount).toFixed(2)} en lugar de $${(totalOriginalAmount + expiredInvoicesAmount).toFixed(2)}.</li>
          <li>Esto representa una reducción del ${averageDiscountPercentage.toFixed(2)}% en sus ingresos por las facturas no vencidas.</li>
          <li>${isFixedAmount ? 'El descuento se ha calculado para alcanzar el monto fijo que usted especificó.' : 'El descuento se ha calculado basado en la fecha de pago anticipado y el descuento adicional que usted proporcionó.'}</li>
          <li>Hay ${expiredInvoicesCount} facturas vencidas que no son elegibles para descuento, por un total de $${expiredInvoicesAmount.toFixed(2)}.</li>
        </ol>

        <p>Consideraciones estratégicas:</p>
        <ul>
          <li>Liquidez inmediata: Esta oferta de descuento le permitirá obtener $${(totalDiscountedAmount + expiredInvoicesAmount).toFixed(2)} de forma inmediata, mejorando su flujo de caja.</li>
          <li>Costo de oportunidad: Compare el costo de este descuento (${averageDiscountPercentage.toFixed(2)}%) con el costo de obtener financiamiento por otros medios.</li>
          <li>Relaciones con clientes: Ofrecer descuentos por pronto pago puede mejorar las relaciones con sus clientes y fomentar pagos más rápidos en el futuro.</li>
          <li>Riesgo de impago: Al incentivar el pago anticipado, reduce el riesgo de impagos o retrasos prolongados.</li>
        </ul>

        <p>Recomendaciones:</p>
        <ul>
          <li>Si su necesidad de liquidez es urgente y supera el costo del descuento, esta oferta podría ser beneficiosa.</li>
          <li>Considere el impacto en su margen de beneficio y asegúrese de que aún sea rentable después de aplicar el descuento.</li>
          <li>Para las facturas vencidas, considere estrategias de cobro alternativas o negociaciones específicas con esos clientes.</li>
          <li>Evalúe si puede ofrecer términos más favorables a los clientes que pagan consistentemente a tiempo.</li>
        </ul>

        <p>Recuerde que cada factura tiene su propio descuento basado en su fecha de vencimiento y TCEA. Revise los detalles en la tabla de resultados para tomar decisiones específicas para cada factura o cliente.</p>

        <h3>Explicación del Interés Total:</h3>
        <p>El Interés Total de tu cartera es de $${portfolioMetrics.totalInterest.toFixed(2)}. Este monto representa la suma de todos los intereses que ganarías si todas las facturas se pagaran en sus respectivas fechas de vencimiento.</p>
        
        <p>Cálculo del Interés Total:</p>
        <ol>
          <li>Para cada factura, calculamos el número de días entre la fecha de emisión y la fecha de vencimiento.</li>
          <li>Utilizamos la TCEA (Tasa de Costo Efectivo Anual) de cada factura para calcular el valor futuro del monto de la factura en la fecha de vencimiento.</li>
          <li>El interés de cada factura es la diferencia entre este valor futuro y el monto original de la factura.</li>
          <li>Sumamos los intereses de todas las facturas para obtener el Interés Total de la cartera.</li>
        </ol>

        <p>Es importante tener en cuenta que:</p>
        <ul>
          <li>Este cálculo asume que todas las facturas se pagarán en su fecha de vencimiento.</li>
          <li>Si se aplican descuentos por pago anticipado, el interés real ganado será menor.</li>
          <li>La TCEA Promedio Ponderada de tu cartera es de ${portfolioMetrics.weightedTCEA.toFixed(2)}%, lo que refleja el costo efectivo promedio de tu financiamiento considerando los montos de las facturas.</li>
        </ul>
      `;
    }

    this.explanation = explanationText;
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

  calculateTotalOriginalAmount(): number {
    return this.discountResults.reduce((total, result) => total + (result.totalPayment ?? 0), 0);
  }

  calculateAverageTotalDiscount(): number {
    const totalDiscount = this.discountResults.reduce((total, result) => total + (result.totalDiscount ?? 0), 0);
    return totalDiscount / this.discountResults.length;
  }

  calculateTotalFinalAmount(): number {
    return this.discountResults.reduce((total, result) => total + (result.finalDiscountedAmount || result.discountedAmount || 0), 0);
  }

  private balanceDiscounts(totalExcessDiscount: number) {
    const eligibleInvoices = this.discountResults.filter(result => result.totalDiscount / 100 < this.discountForm.get('maxTotalDiscount')?.value / 100);
    const totalEligibleAmount = eligibleInvoices.reduce((sum, invoice) => sum + invoice.totalPayment!, 0);

    eligibleInvoices.forEach(invoice => {
      const additionalDiscountPercentage = (totalExcessDiscount / totalEligibleAmount) * (invoice.totalPayment! / totalEligibleAmount);
      invoice.totalDiscount += additionalDiscountPercentage * 100;
      invoice.discountedAmount = invoice.totalPayment! * (1 - invoice.totalDiscount / 100);
    });
  }

  getTCEAPercentage(invoice: Invoice): number {
    return ((invoice.tcea ?? 0) * 100);
  }
}
