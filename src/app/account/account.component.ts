import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from "../models/User.model";
import { AsyncPipe, NgForOf, NgIf } from "@angular/common";
import { ApiService } from "../requests/ApiService";

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
export class AccountComponent implements OnInit {
  userId: string = localStorage.getItem('userId') || '';
  user$: Observable<User>;

  pendingInvitations: any[] = [];
  sentInvitations: any[] = [];

  constructor(private apiService: ApiService) {
    this.user$ = this.apiService.getUserById(this.userId);
  }

  ngOnInit(): void {
    this.loadPendingInvitations();
    this.loadSentInvitations();
  }

  getLocalStorageKeys(): string[] {
    return Object.keys(localStorage);
  }

  getLocalStorageItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  acceptInvitation(invitationId: string): void {
    this.apiService.updateInvitationStatus(invitationId, 'Accepted').subscribe(
      () => {
        console.log(`Invitation ${invitationId} accepted`);
        this.loadPendingInvitations(); // Reload pending invitations
      },
      error => console.error('Error accepting invitation:', error)
    );
  }

  denyInvitation(invitationId: string): void {
    this.apiService.updateInvitationStatus(invitationId, 'Rejected').subscribe(
      () => {
        console.log(`Invitation ${invitationId} denied`);
        this.loadPendingInvitations(); // Reload pending invitations
      },
      error => console.error('Error denying invitation:', error)
    );
  }

  loadPendingInvitations(): void {
    this.apiService.getPendingInvitations(this.userId).subscribe(
      (invitations) => {
        this.pendingInvitations = invitations;
      },
      error => console.error('Error loading pending invitations:', error)
    );
  }

  loadSentInvitations(): void {
    this.apiService.getSentInvitations(this.userId).subscribe(
      (invitations) => {
        this.sentInvitations = invitations;
      },
      error => console.error('Error loading sent invitations:', error)
    );
  }
}
