import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../requests/ApiService';
import { Company } from '../../models/Company.model';
import { UserCompany } from '../../models/user-company.model';
import { CurrencyPipe, NgForOf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { currencieslist } from '../../requests/currencies';

@Component({
  selector: 'app-company-manager',
  standalone: true,
  templateUrl: './company-manager.component.html',
  imports: [
    CurrencyPipe,
    NgForOf,
    FormsModule
  ],
  styleUrls: ['./company-manager.component.css']
})
export class CompanyManagerComponent implements OnInit {
  company: Company | undefined;
  numberOfEmployees: number = 0;
  numberOfModules: number = 0;
  dollarValue: number = 0;
  convertedDollarValue: number = 0;
  selectedCurrency: string = 'PEN';
  currencies: any[] = currencieslist;
  filteredCurrencies: any[] = this.currencies;
  exchangeRates: { [key: string]: number } = {};

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadCompanyData();
    this.loadDollarValue();
    this.loadExchangeRates();
  }

  private loadCompanyData() {
    const companyId = this.route.snapshot.paramMap.get('id');
    if (companyId) {
      this.apiService.getCompanyById(companyId).subscribe(
        (company) => {
          this.company = company;
          this.loadEmployeeData(this.company.id);
        },
        (error) => {
          console.error('Error al obtener la compañía:', error);
        }
      );
    }
  }

  private loadEmployeeData(companyId: string) {
    this.apiService.getEmployeesByCompany(companyId).subscribe(
      (employees: UserCompany[]) => {
        this.numberOfEmployees = employees.length;
      },
      (error) => console.error('Error fetching employees data:', error)
    );
  }

  loadDollarValue(): void {
    this.apiService.getDollarValue().subscribe(
      (value) => {
        this.dollarValue = value; // Siempre 1 para USD
        this.convertDollarValue();
      },
      (error) => {
        console.error('Error al obtener el valor del dólar:', error);
      }
    );
  }

  loadExchangeRates(): void {
    this.apiService.getExchangeRates().subscribe(
      (response) => {
        this.exchangeRates = response.conversion_rates;
        this.applySavedCurrency();
      },
      (error) => console.error('Error al obtener las tasas de cambio:', error)
    );
  }

  applySavedCurrency() {
    const savedCurrency = localStorage.getItem('selectedCurrency');
    if (savedCurrency) {
      this.selectedCurrency = savedCurrency;
      this.convertDollarValue();
    }
  }

  onCurrencyChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedCurrency = selectElement.value;
    localStorage.setItem('selectedCurrency', this.selectedCurrency);
    this.convertDollarValue();
  }

  private convertDollarValue() {
    if (this.selectedCurrency === 'USD') {
      this.convertedDollarValue = this.dollarValue; // No conversion needed
    } else if (this.exchangeRates[this.selectedCurrency]) {
      this.convertedDollarValue = this.dollarValue * this.exchangeRates[this.selectedCurrency];
    } else {
      this.convertedDollarValue = this.dollarValue; // Default case
    }
  }

  filterCurrencies(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredCurrencies = this.currencies.filter(currency =>
      currency.code.toLowerCase().includes(searchTerm) ||
      currency.name.toLowerCase().includes(searchTerm)
    );
  }
}
