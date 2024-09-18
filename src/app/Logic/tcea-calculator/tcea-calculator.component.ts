import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgForOf, NgIf, DecimalPipe, CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-tca-calculator',
  templateUrl: './tcea-calculator.component.html',
  styleUrls: ['./tcea-calculator.component.css'],
  standalone: true,
  imports: [
    FormsModule,
    NgForOf,
    NgIf,
    DecimalPipe,
    CurrencyPipe
  ]
})
export class TceaCalculatorComponent implements OnInit {
  // Inputs
  amount: number = 10000;
  term: number = 12;
  rateType: string = 'nominal';
  rate: number = 10;
  capitalization: string = 'monthly';
  fees: number = 100;
  paymentFrequency: string = 'monthly';
  businessType: string = 'startup';
  riskProfile: string = 'moderate';

  // Results
  tcea: number = 0;
  periodicPayment: number = 0;
  totalCost: number = 0;
  analysis: string = '';
  amortizationSchedule: any[] = [];
  showAmortizationSchedule: boolean = false;
  tutorialStep: number = 1;
  showTutorial: boolean = true;

  // Additional financial metrics
  irr: number = 0;
  npv: number = 0;
  paybackPeriod: number = 0;
  profitabilityIndex: number = 0;

  // Market comparison
  marketComparison: any = {
    averageRate: 0,
    bestRate: 0,
    worstRate: 0
  };

  // Scenario analysis
  scenarios: any[] = [];

  ngOnInit() {
    // Check localStorage to see if tutorial has been completed
    const tutorialCompleted = localStorage.getItem('tutorialCompleted');
    if (tutorialCompleted === 'true') {
      this.showTutorial = false;
    } else {
      this.updateCalculations();
      this.generateMarketComparison();
      this.performScenarioAnalysis();
    }
  }


  updateCalculations() {
    this.calculateTCEA();
    this.calculatePeriodicPayment();
    this.calculateTotalCost();
    this.generateAnalysis();
    this.calculateAdditionalMetrics();
  }

  calculateTCEA() {
    let effectiveRate = this.convertToEffectiveRate(this.rate, this.rateType, this.capitalization);
    let periodsPerYear = this.getPeriodsPerYear(this.paymentFrequency);
    let periodicRate = Math.pow(1 + effectiveRate, 1/periodsPerYear) - 1;
    let totalPayments = this.periodicPayment * (this.term * periodsPerYear / 12);
    this.tcea = (Math.pow(totalPayments / (this.amount - this.fees), 12/this.term) - 1) * 100;
  }

  calculatePeriodicPayment() {
    let effectiveRate = this.convertToEffectiveRate(this.rate, this.rateType, this.capitalization);
    let periodsPerYear = this.getPeriodsPerYear(this.paymentFrequency);
    let periodicRate = Math.pow(1 + effectiveRate, 1/periodsPerYear) - 1;
    let totalPeriods = this.term * periodsPerYear / 12;
    this.periodicPayment = (this.amount * periodicRate * Math.pow(1 + periodicRate, totalPeriods)) / (Math.pow(1 + periodicRate, totalPeriods) - 1);
  }

  calculateTotalCost() {
    let periodsPerYear = this.getPeriodsPerYear(this.paymentFrequency);
    let totalPeriods = this.term * periodsPerYear / 12;
    this.totalCost = (this.periodicPayment * totalPeriods) + this.fees;
  }

  convertToEffectiveRate(rate: number, type: string, capitalization: string): number {
    if (type === 'effective') return rate / 100;

    let m = this.getCapitalizationFactor(capitalization);
    return Math.pow(1 + (rate / 100) / m, m) - 1;
  }

  getCapitalizationFactor(capitalization: string): number {
    switch (capitalization) {
      case 'daily': return 365;
      case 'weekly': return 52;
      case 'monthly': return 12;
      case 'quarterly': return 4;
      case 'annually': return 1;
      default: return 12;
    }
  }

  getPeriodsPerYear(frequency: string): number {
    switch (frequency) {
      case 'daily': return 365;
      case 'weekly': return 52;
      case 'monthly': return 12;
      case 'quarterly': return 4;
      case 'annually': return 1;
      default: return 12;
    }
  }

  generateAnalysis() {
    let businessContext = this.getBusinessContext();
    let riskAssessment = this.assessRisk();

    this.analysis = `Para su ${businessContext} con un perfil de riesgo ${this.riskProfile}, este préstamo tiene una TCEA del ${this.tcea.toFixed(2)}% y un costo total de $${this.totalCost.toFixed(2)} sobre ${this.term} meses.

${riskAssessment}

Considerando su tipo de negocio, una TCEA ${this.tcea > 15 ? 'por encima del 15%' : this.tcea < 8 ? 'por debajo del 8%' : 'entre 8% y 15%'} es ${this.tcea > 15 ? 'relativamente alta' : this.tcea < 8 ? 'bastante competitiva' : 'promedio para el mercado'}.

Recomendación: ${this.provideRecommendation()}`;
  }

  getBusinessContext(): string {
    switch (this.businessType) {
      case 'startup':
        return 'empresa emergente (startup)';
      case 'sme':
        return 'pequeña o mediana empresa (PYME)';
      case 'corporate':
        return 'corporación establecida';
      default:
        return 'negocio';
    }
  }

  assessRisk(): string {
    switch (this.riskProfile) {
      case 'conservative':
        return 'Su perfil conservador sugiere que debería buscar tasas más bajas y términos más favorables, aunque esto pueda limitar el monto del préstamo.';
      case 'moderate':
        return 'Su perfil de riesgo moderado le permite cierta flexibilidad. Considere equilibrar la tasa de interés con otros beneficios como plazos más largos o montos mayores.';
      case 'aggressive':
        return 'Su perfil de riesgo agresivo le permite considerar opciones con tasas más altas si esto se traduce en beneficios significativos para su negocio, como acceso a capital más grande o términos más flexibles.';
      default:
        return 'Evalúe cuidadosamente su tolerancia al riesgo antes de tomar una decisión.';
    }
  }

  provideRecommendation(): string {
    if (this.tcea > 15) {
      return 'Considere negociar mejores términos o explorar otras opciones de financiamiento. Si decide proceder, asegúrese de que el beneficio potencial para su negocio justifique el alto costo del préstamo.';
    } else if (this.tcea < 8) {
      return 'Esta oferta parece ser muy competitiva. Si los términos se ajustan a sus necesidades, podría ser una excelente opción para su negocio.';
    } else {
      return 'Compare esta oferta con al menos otras dos o tres para asegurarse de obtener el mejor trato posible. No olvide considerar otros factores además de la tasa, como la flexibilidad en los pagos o la posibilidad de renegociar términos en el futuro.';
    }
  }

  calculateAdditionalMetrics() {
    this.calculateIRR();
    this.calculateNPV();
    this.calculatePaybackPeriod();
    this.calculateProfitabilityIndex();
  }

  calculateIRR() {
    // Implementación simplificada de IRR
    let cashFlows = [-this.amount];
    let periodsPerYear = this.getPeriodsPerYear(this.paymentFrequency);
    for (let i = 0; i < this.term * periodsPerYear / 12; i++) {
      cashFlows.push(this.periodicPayment);
    }

    let irr = 0.1; // starting guess
    let step = 0.05;
    let tolerance = 0.0001;
    let maxIterations = 1000;

    for (let i = 0; i < maxIterations; i++) {
      let npv = this.calculateNPVWithRate(irr, cashFlows);
      if (Math.abs(npv) < tolerance) {
        break;
      }
      if (npv > 0) {
        irr += step;
      } else {
        irr -= step;
      }
      step /= 2;
    }

    this.irr = irr * 100;
  }

  calculateNPVWithRate(rate: number, cashFlows: number[]): number {
    return cashFlows.reduce((npv, cashFlow, index) =>
      npv + cashFlow / Math.pow(1 + rate, index), 0);
  }

  calculateNPV() {
    let cashFlows = [-this.amount];
    let periodsPerYear = this.getPeriodsPerYear(this.paymentFrequency);
    for (let i = 0; i < this.term * periodsPerYear / 12; i++) {
      cashFlows.push(this.periodicPayment);
    }
    this.npv = this.calculateNPVWithRate(this.rate / 100, cashFlows);
  }

  calculatePaybackPeriod() {
    let remainingAmount = this.amount;
    let periodsPerYear = this.getPeriodsPerYear(this.paymentFrequency);
    let periods = 0;
    while (remainingAmount > 0 && periods < this.term * periodsPerYear / 12) {
      remainingAmount -= this.periodicPayment;
      periods++;
    }
    this.paybackPeriod = periods / periodsPerYear * 12;
  }

  calculateProfitabilityIndex() {
    this.profitabilityIndex = (this.npv + this.amount) / this.amount;
  }

  generateMarketComparison() {
    // Simulación de tasas de mercado
    this.marketComparison = {
      averageRate: this.rate + (Math.random() - 0.5) * 2,
      bestRate: this.rate - Math.random() * 3,
      worstRate: this.rate + Math.random() * 3
    };
  }

  performScenarioAnalysis() {
    this.scenarios = [
      this.calculateScenario('Optimista', 0.8, 1.1),
      this.calculateScenario('Esperado', 1, 1),
      this.calculateScenario('Pesimista', 1.2, 0.9)
    ];
  }

  calculateScenario(name: string, rateMultiplier: number, amountMultiplier: number) {
    let scenarioRate = this.rate * rateMultiplier;
    let scenarioAmount = this.amount * amountMultiplier;
    let effectiveRate = this.convertToEffectiveRate(scenarioRate, this.rateType, this.capitalization);
    let periodsPerYear = this.getPeriodsPerYear(this.paymentFrequency);
    let periodicRate = Math.pow(1 + effectiveRate, 1/periodsPerYear) - 1;
    let totalPeriods = this.term * periodsPerYear / 12;
    let payment = (scenarioAmount * periodicRate * Math.pow(1 + periodicRate, totalPeriods)) / (Math.pow(1 + periodicRate, totalPeriods) - 1);
    let totalCost = payment * totalPeriods + this.fees;

    return {
      name: name,
      rate: scenarioRate,
      amount: scenarioAmount,
      payment: payment,
      totalCost: totalCost
    };
  }

  optimizeRate() {
    let targetProfit = 0.1 * this.amount; // Asumimos un objetivo de ganancia del 10%
    let optimalRate = (Math.pow((this.amount + targetProfit) / this.amount, 12 / this.term) - 1) * 100;
    alert(`Para obtener una ganancia del 10% en ${this.term} meses, la tasa óptima sería aproximadamente ${optimalRate.toFixed(2)}% anual.`);
  }

  compareOptions() {
    let option1 = this.tcea;
    let option2 = this.convertToEffectiveRate(this.rate + 1, this.rateType, this.capitalization) * 100;
    let option3 = this.convertToEffectiveRate(this.rate - 1, this.rateType, this.capitalization) * 100;

    alert(`Comparación de opciones:
    1. TCEA actual: ${option1.toFixed(2)}%
    2. Con tasa 1% mayor: ${option2.toFixed(2)}%
    3. Con tasa 1% menor: ${option3.toFixed(2)}%
    La opción más conveniente es la ${option3 < option1 && option3 < option2 ? '3' : option2 < option1 && option2 < option3 ? '2' : '1'}.`);
  }

  generateAmortizationSchedule() {
    this.showAmortizationSchedule = true;
    this.amortizationSchedule = [];
    let balance = this.amount;
    let effectiveRate = this.convertToEffectiveRate(this.rate, this.rateType, this.capitalization);
    let periodsPerYear = this.getPeriodsPerYear(this.paymentFrequency);
    let periodicRate = Math.pow(1 + effectiveRate, 1/periodsPerYear) - 1;
    let totalPeriods = this.term * periodsPerYear / 12;

    for (let period = 1; period <= totalPeriods; period++) {
      let interest = balance * periodicRate;
      let principal = this.periodicPayment - interest;
      balance -= principal;

      this.amortizationSchedule.push({
        period: period,
        payment: this.periodicPayment,
        interest: interest,
        principal: principal,
        balance: balance > 0 ? balance : 0
      });
    }
  }

  nextTutorialStep() {
    if (this.tutorialStep < 5) {
      this.tutorialStep++;
    } else {
      this.showTutorial = false;
      localStorage.setItem('tutorialCompleted', 'true'); // Save tutorial completion status
    }
  }


  prevTutorialStep() {
    if (this.tutorialStep > 1) {
      this.tutorialStep--;
    }
  }

  restartTutorial() {
    this.tutorialStep = 1;
    this.showTutorial = true;
    localStorage.removeItem('tutorialCompleted'); // Remove tutorial completion status
  }


  getTutorialContent(): string {
    switch (this.tutorialStep) {
      case 1:
        return "Bienvenido a la Calculadora Financiera Empresarial. Esta herramienta le ayudará a tomar decisiones informadas sobre préstamos y financiamiento para su negocio. Comencemos ingresando los datos básicos del préstamo en la sección 'Datos del Préstamo/Inversión'.";
      case 2:
        return "Ahora que ha ingresado los datos básicos, observe cómo se actualizan automáticamente los resultados en la sección 'Resultados'. Aquí verá la TCEA, el pago periódico y el costo total del préstamo.";
      case 3:
        return "En la sección 'Análisis y Recomendaciones', encontrará un resumen detallado de lo que significan estos números para su negocio, junto con recomendaciones personalizadas basadas en su perfil de riesgo y tipo de negocio.";
      case 4:
        return "Explore las funciones adicionales en la sección 'Acciones'. Puede optimizar la tasa, comparar opciones y generar una tabla de amortización detallada para entender mejor cómo se distribuyen sus pagos a lo largo del tiempo.";
      case 5:
        return "Por último, revise las métricas financieras adicionales y el análisis de escenarios para tener una visión más completa de su decisión financiera. ¡Felicidades! Ahora está listo para usar la calculadora por su cuenta.";
      default:
        return "";
    }
  }
}
