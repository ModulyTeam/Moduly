import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CurrencyConverterService {
  private exchangeRate = 3.7; // Ejemplo de tasa de cambio PEN/USD

  convert(amount: number, toCurrency: 'PEN' | 'USD'): number {
    if (toCurrency === 'PEN') {
      return amount * this.exchangeRate;
    } else {
      return amount / this.exchangeRate;
    }
  }
}
