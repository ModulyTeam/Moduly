import { Component, OnInit } from '@angular/core';
import { PermissionService } from '../services/permission.service';
import {
  MatCell,
  MatCellDef,
  MatColumnDef, MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef, MatTable
} from "@angular/material/table";

@Component({
  selector: 'app-manage-permissions',
  standalone: true,
  templateUrl: './manage-permissions.component.html',
  imports: [
    MatHeaderRow,
    MatRow,
    MatRowDef,
    MatHeaderRowDef,
    MatCellDef,
    MatHeaderCellDef,
    MatColumnDef,
    MatCell,
    MatHeaderCell,
    MatTable
  ],
  styleUrls: ['./manage-permissions.component.scss']
})
export class ManagePermissionsComponent implements OnInit {
  permissions: any[] = [];

  constructor(private permissionService: PermissionService) {}

  ngOnInit() {
    this.permissionService.getPermissions().subscribe((data: any[]) => {
      this.permissions = data;
    });
  }
}
