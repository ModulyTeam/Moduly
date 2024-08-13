import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-main',
  standalone: true,
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  imports: [CommonModule]
})
export class MainComponent {
  companyData = {
    name: 'Acme Corporation',
    description: 'Leading provider of innovative solutions.',
    revenue: '$1,000,000',
    employees: 35,
  };

  constructor(private router: Router) {}

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
