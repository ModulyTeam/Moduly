import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import { ApiService } from '../../requests/ApiService';
import { Company } from '../../models/Company.model';
import { UserCompany } from '../../models/user-company.model';
import { Module } from '../../models/Module.model';
import {CurrencyPipe, NgClass, NgForOf, NgIf} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { currencieslist } from '../../requests/currencies';

@Component({
  selector: 'app-company-manager',
  standalone: true,
  templateUrl: './company-manager.component.html',
  imports: [
    CurrencyPipe,
    NgForOf,
    FormsModule,
    NgIf,
    NgClass,
    RouterLink
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
  showModal: boolean = false;
  moduleName: string = '';
  moduleType: string = '';
  loading: boolean = false;
  companyModules: Module[] = [];
  moduleSearchQuery: string = '';
  filteredCompanyModules: Module[] = [];
  showDeleteConfirmation: boolean = false;
  moduleToDelete: Module | null = null;
  showEditModal: boolean = false;
  moduleToEdit: Module = { moduleName: '', moduleType: '', companyId: '', userId: '', id: '' }; // Inicialización

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const companyId = this.route.snapshot.paramMap.get('id') || localStorage.getItem('companyId');
    if (companyId) {
      this.loadCompanyData(companyId);
    } else {
      console.error('No company ID available');
      // Manejar el caso en que no hay ID de compañía disponible
    }
    this.loadDollarValue();
    this.loadExchangeRates();
  }

  private loadCompanyData(companyId: string) {
    localStorage.setItem('companyId', companyId);
    this.apiService.getCompanyById(companyId).subscribe(
      (company) => {
        this.company = company;
        this.loadEmployeeData(companyId);
        this.loadCompanyModules(companyId);
      },
      (error) => {
        console.error('Error al obtener la compañía:', error);
      }
    );
  }

  private loadEmployeeData(companyId: string) {
    this.apiService.getEmployeesByCompany(companyId).subscribe(
      (employees: UserCompany[]) => {
        this.numberOfEmployees = employees.length;
      },
      (error) => console.error('Error fetching employees data:', error)
    );
  }
  isAdminModule(module: Module): boolean {
    return module.moduleName === 'Admin Module' && module.moduleType === 'Here, permissions are assigned to employees and invitations are sent.';
  }
  private loadCompanyModules(companyId: string) {
    this.apiService.getModules(companyId).subscribe(
      (modules: Module[]) => {
        this.companyModules = modules;
        this.filteredCompanyModules = modules;
        this.numberOfModules = modules.length;
      },
      (error) => console.error('Error fetching company modules:', error)
    );
  }

  loadDollarValue(): void {
    this.apiService.getDollarValue().subscribe(
      (value) => {
        this.dollarValue = value;
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
      this.convertedDollarValue = this.dollarValue;
    } else if (this.exchangeRates[this.selectedCurrency]) {
      this.convertedDollarValue = this.dollarValue * this.exchangeRates[this.selectedCurrency];
    } else {
      this.convertedDollarValue = this.dollarValue;
    }
  }

  filterCurrencies(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredCurrencies = this.currencies.filter(currency =>
      currency.code.toLowerCase().includes(searchTerm) ||
      currency.name.toLowerCase().includes(searchTerm)
    );
  }

  filterModules() {
    const query = this.moduleSearchQuery.toLowerCase();
    this.filteredCompanyModules = this.companyModules.filter(module =>
      module.moduleName.toLowerCase().includes(query)
    );
  }

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  confirmDeleteModule(module: Module) {
    this.moduleToDelete = { ...module };
    this.showDeleteConfirmation = true;
  }

  closeDeleteConfirmation() {
    this.showDeleteConfirmation = false;
    this.moduleToDelete = null;
  }


  openEditModal(module: Module) {
    this.moduleToEdit = { ...module };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.moduleToEdit = { moduleName: '', moduleType: '', companyId: '', userId: '', id: '' }; // Reinicializa
  }

  createModule() {
    if (!this.company) return;

    if (!this.moduleName || !this.moduleType) {
      console.error('Module name and type are required.');
      return;
    }

    // Check for duplicate module name and type
    if (this.companyModules.some(module =>
      module.moduleName === this.moduleName && module.moduleType === this.moduleType)) {
      console.error('A module with the same name and type already exists.');
      return;
    }

    this.loading = true;

    const companyId = this.route.snapshot.paramMap.get('id');
    if (!companyId) {
      console.error('Company ID is missing.');
      this.loading = false;
      return;
    }
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error('User ID not found in localStorage');
      this.loading = false;
      return;
    }
    const moduleData: Module = {
      moduleName: this.moduleName,
      moduleType: this.moduleType,
      companyId: companyId,
      userId: userId,
      id: ''
    };

    this.apiService.createModule(moduleData).subscribe(
      () => {
        this.loading = false;
        this.showModal = false;
        this.loadCompanyModules(companyId);
      },
      (error) => {
        console.error('Error creating module:', error);
        this.loading = false;
      }
    );
  }

  updateModule() {
    if (!this.moduleToEdit || !this.company) {
      console.error('No module selected for editing or company information is missing.');
      return;
    }

    if (this.isAdminModule(this.moduleToEdit)) {
      console.error('Cannot update Admin Module.');
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error('User ID not found in localStorage');
      return;
    }

    const updatedModuleData: Module = {
      ...this.moduleToEdit,
      userId: userId // Ensure userId type matches expected model
    };

    this.apiService.updateModule(updatedModuleData).subscribe(
      () => {
        this.showEditModal = false;
        this.moduleToEdit = { moduleName: '', moduleType: '', companyId: '', userId: '', id: '' }; // Reset
        if (this.company && this.company.id) {
          this.loadCompanyModules(this.company.id);
        } else {
          console.error('Company or company ID is undefined.');
        }
      },
      error => {
        console.error('Error updating module:', error);
      }
    );
  }

  deleteModule() {
    if (!this.moduleToDelete || !this.company) return;

    if (this.isAdminModule(this.moduleToDelete)) {
      console.error('Cannot delete Admin Module.');
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error('User ID not found in localStorage');
      return;
    }

    this.apiService.deleteModule(this.moduleToDelete.id, userId).subscribe(
      () => {
        this.showDeleteConfirmation = false;
        this.moduleToDelete = null;
        if (this.company && this.company.id) {
          this.loadCompanyModules(this.company.id);
        } else {
          console.error('Company or company ID is undefined.');
        }
      },
      error => {
        console.error('Error deleting module:', error);
      }
    );
  }}
