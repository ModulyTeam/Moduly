import { Injectable } from '@angular/core';
import {LetterOfCredit} from "./LetterOfCredit.model";

@Injectable({
  providedIn: 'root'
})
export class TceaCalculatorService {
  calculatePortfolioTCEA(letters: LetterOfCredit[], discountDate: Date): number {
    const totalNominalValue = letters.reduce((sum, letter) => sum + letter.amount, 0);
    const totalPresentValue = letters.reduce((sum, letter) => sum + this.calculatePresentValue(letter, discountDate), 0);
    const averageTerm = this.calculateAverageTerm(letters, discountDate);

    const tcea = Math.pow(totalNominalValue / totalPresentValue, 365 / averageTerm) - 1;
    return tcea * 100; // Convert to percentage
  }

  private calculatePresentValue(letter: LetterOfCredit, discountDate: Date): number {
    const daysToMaturity = this.daysBetween(discountDate, letter.maturityDate);
    return letter.amount / Math.pow(1 + letter.discountRate, daysToMaturity / 365);
  }

  private calculateAverageTerm(letters: LetterOfCredit[], discountDate: Date): number {
    const totalWeightedDays = letters.reduce((sum, letter) =>
      sum + this.daysBetween(discountDate, letter.maturityDate) * letter.amount, 0);
    const totalAmount = letters.reduce((sum, letter) => sum + letter.amount, 0);
    return totalWeightedDays / totalAmount;
  }

  private daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
  }
}
