import { Component, OnInit, ComponentFactoryResolver, ViewChild, ViewContainerRef } from '@angular/core';
import { Module } from '../models/Module.model';
import { ApiService } from "../requests/ApiService";
import { InteractiveModuleComponent } from "../interactive-module/interactive-module.component";
import { ActivatedRoute } from '@angular/router';
import { NgClass, NgForOf, NgIf } from "@angular/common";
import { TceaCalculatorComponent } from "../Logic/tcea-calculator/tcea-calculator.component";
import {FinancialManagementComponent} from "../Logic/financial-management/financial-management.component";
@Component({
  selector: 'app-management-module',
  templateUrl: './management-module.component.html',
  standalone: true,
  imports: [
    InteractiveModuleComponent,
    NgForOf,
    NgIf,
    NgClass
  ],
  styleUrls: ['./management-module.component.css']
})
export class ManagementModuleComponent implements OnInit {
  moduleId: string | null = null;
  moduleDetails: Module | null = null;
  modules: any[] = [
    { type: 'tcea-calculator', title: 'Cálculo de TCEA', content: 'Permite calcular la Tasa de Coste Efectivo Anual (TCEA) para la cartera de letras/facturas, con opciones para ingresar tasas nominales y efectivas, y manejar diferentes monedas.' },
    { type: 'letter-management', title: 'Gestión de Letras/Facturas', content: 'Facilita el alta y la administración de letras/facturas, incluyendo la entrada de datos completos y la configuración de fechas de descuento.', notReady: true },
    { type: 'detailed-reports', title: 'Reportes Detallados', content: 'Genera y muestra reportes completos de las letras/facturas descontadas en una fecha determinada, incluyendo detalles de cada letra/factura y la TCEA de la cartera.', notReady: true },
    { type: 'portfolio-consolidation', title: 'Consolidación de Cartera', content: 'Consolida y muestra todos los datos de la cartera de letras/facturas y calcula la TCEA total. Permite imprimir o exportar los reportes consolidados.', notReady: true },
    { type: 'financial-lite-manager', title: 'Gestión de Cartera Lite', content: 'Permite administrar de manera simplificada la cartera de letras/facturas, con opciones básicas de cálculo y visualización.', notReady: true } // Nuevo tipo de módulo
  ];

  @ViewChild('moduleContainer', { read: ViewContainerRef }) moduleContainer?: ViewContainerRef;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {}

  ngOnInit() {
    this.moduleId = this.route.snapshot.paramMap.get('id');
    if (this.moduleId) {
      this.apiService.getModuleById(this.moduleId).subscribe((module: Module) => {
        this.moduleDetails = module;
      });
    }
  }

  openModule(type: string) {
    if (this.moduleContainer) {
      this.moduleContainer.clear();

      let component: any = null;

      if (type === 'tcea-calculator') {
        component = TceaCalculatorComponent;
      } else if (type === 'financial-lite-manager') {
        component = FinancialManagementComponent;
      }

      if (component) {
        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(component);
        const componentRef = this.moduleContainer.createComponent(componentFactory);
      }
    }
  }
}
