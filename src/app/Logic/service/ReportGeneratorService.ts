import { Injectable } from '@angular/core';
import {LetterOfCredit} from "./LetterOfCredit.model";

@Injectable({
  providedIn: 'root'
})
export class ReportGeneratorService {
  generateReport(letters: LetterOfCredit[], portfolioTCEA: number, discountDate: Date): void {
    let reportContent = `Reporte de Cartera de Letras/Facturas - Fecha: ${discountDate.toLocaleDateString()}\n\n`;
    reportContent += `TCEA de la Cartera: ${portfolioTCEA.toFixed(2)}%\n\n`;
    reportContent += 'Detalle de Letras/Facturas:\n';
    reportContent += '-----------------------------\n';

    letters.forEach(letter => {
      reportContent += `ID: ${letter.id}\n`;
      reportContent += `Monto: ${letter.amount.toFixed(2)}\n`;
      reportContent += `Fecha de Vencimiento: ${letter.maturityDate.toLocaleDateString()}\n`;
      reportContent += `Tasa de Descuento: ${(letter.discountRate * 100).toFixed(2)}%\n`;
      reportContent += '-----------------------------\n';
    });

    // En un entorno real, aquí se implementaría la lógica para guardar o imprimir el reporte
    console.log(reportContent);
    alert('Reporte generado. Ver consola para detalles.');
  }
}
