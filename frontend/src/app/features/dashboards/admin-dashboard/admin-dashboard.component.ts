import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { User } from '../../../core/models/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  users = signal<User[]>([]);
  auditLogs = signal<any[]>([]);
  activeTab: 'utilisateurs' | 'formations' | 'audit' = 'utilisateurs';
  isLoading = true;
  errorMsg = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getAllUsers().subscribe({
      next: (res) => {
        this.users.set(res.content ?? res);
        this.isLoading = false;
      },
      error: () => {
        this.errorMsg = 'Impossible de charger les utilisateurs.';
        this.isLoading = false;
      }
    });

    this.apiService.getAuditLogs().subscribe({
      next: (res) => this.auditLogs.set(res.content ?? res ?? []),
      error: () => {}
    });
  }

  getRoleBadgeClass(dtype: string): string {
    const map: Record<string, string> = {
      'ADMIN': 'role-admin',
      'FORMATEUR': 'role-formateur',
      'MEMBRE': 'role-membre',
    };
    return map[dtype?.toUpperCase()] ?? 'role-membre';
  }
}
