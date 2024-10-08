import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import {User} from "../models/User.model";
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";
import {ApiService} from "../requests/ApiService";


@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    NgForOf,
    NgIf,
    AsyncPipe
  ],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent {
  userId: string = localStorage.getItem('userId') || '';
  user$: Observable<User>;

  // Variables para las invitaciones
  pendingInvitations: any[] = [];
  sentInvitations: any[] = [];

  constructor(private apiService: ApiService) {
    this.user$ = this.apiService.getUserById(this.userId);
  }

  getLocalStorageKeys(): string[] {
    return Object.keys(localStorage);
  }

  getLocalStorageItem(key: string): string | null {
    return localStorage.getItem(key);
  }
  sendInvitation(invitationData: any): void {
    console.log('Sending invitation:', invitationData);
  }

  loadPendingInvitations(): void {
    this.pendingInvitations = [
      { id: 1, email: 'user1@example.com', status: 'Pending' },
      { id: 2, email: 'user2@example.com', status: 'Pending' }
    ];
  }

  loadSentInvitations(): void {
    this.sentInvitations = [
      { id: 3, email: 'user3@example.com', status: 'Sent' },
      { id: 4, email: 'user4@example.com', status: 'Sent' }
    ];
  }
}
