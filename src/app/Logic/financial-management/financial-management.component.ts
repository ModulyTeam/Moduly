import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {NgForOf, NgIf, DecimalPipe, CurrencyPipe, DatePipe, PercentPipe} from '@angular/common';
import {LetterOfCredit} from "../service/LetterOfCredit.model";
import {LetterOfCreditService} from "../service/LetterOfCreditService";
import {TceaCalculatorService} from "../service/TceaCalculatorService";
import {ReportGeneratorService} from "../service/ReportGeneratorService";
import {CurrencyConverterService} from "../service/CurrencyConverterService";


@Component({
  selector: 'app-financial-management',
  templateUrl: './financial-management.component.html',
  styleUrls: ['./financial-management.component.css'],
  standalone: true,
  imports: [
    FormsModule,
    NgForOf,
    NgIf,
    DecimalPipe,
    CurrencyPipe,
    DatePipe,
    PercentPipe
  ]
})
export class FinancialManagementComponent implements OnInit {
  letters: LetterOfCredit[] = [];
  selectedCurrency: 'PEN' | 'USD' = 'PEN';
  discountDate: Date = new Date();
  portfolioTCEA: number = 0;

  constructor(
    private letterService: LetterOfCreditService,
    private tceaCalculator: TceaCalculatorService,
    private reportGenerator: ReportGeneratorService,
    private currencyConverter: CurrencyConverterService
  ) {}

  ngOnInit() {
    this.loadLetters();
  }

  loadLetters() {
    this.letters = this.letterService.getLetters();
    this.calculatePortfolioTCEA();
  }

  addLetter(letter: LetterOfCredit) {
    this.letterService.addLetter(letter);
    this.loadLetters();
  }

  removeLetter(id: number) {
    this.letterService.removeLetter(id);
    this.loadLetters();
  }

  calculatePortfolioTCEA() {
    this.portfolioTCEA = this.tceaCalculator.calculatePortfolioTCEA(this.letters, this.discountDate);
  }

  generateReport() {
    this.reportGenerator.generateReport(this.letters, this.portfolioTCEA, this.discountDate);
  }

  changeCurrency() {
    this.letters = this.letters.map(letter => ({
      ...letter,
      amount: this.currencyConverter.convert(letter.amount, this.selectedCurrency)
    }));
    this.calculatePortfolioTCEA();
  }
}
