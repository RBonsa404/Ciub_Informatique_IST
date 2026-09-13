import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { User } from '../../../core/models/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto py-12 px-6">
      <div class="mb-8">
        <h1 class="text-3xl font-bold font-heading mb-2">Back-office <span class="gradient-text">Administration</span></h1>
        <p class="text-slate-400 text-sm">Gestion des utilisateurs, des contenus, de la sécurité et journal d'audit RBAC</p>
      </div>

      <!-- Admin Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="glass-card p-6">
          <div class="text-xs text-slate-400 font-semibold uppercase mb-1">Total Utilisateurs</div>
          <div class="text-3xl font-extrabold text-white">{{ users().length }}</div>
        </div>
        <div class="glass-card p-6">
          <div class="text-xs text-slate-400 font-semibold uppercase mb-1">Statut Système</div>
          <div class="text-3xl font-extrabold text-emerald-400">Opérationnel</div>
        </div>
        <div class="glass-card p-6">
          <div class="text-xs text-slate-400 font-semibold uppercase mb-1">Sécurité 2FA</div>
          <div class="text-3xl font-extrabold text-purple-400">Active</div>
        </div>
        <div class="glass-card p-6">
          <div class="text-xs text-slate-400 font-semibold uppercase mb-1">Audit Log</div>
          <div class="text-3xl font-extrabold text-cyan-400">{{ auditLogs().length }} events</div>
        </div>
      </div>

      <!-- Users Table -->
      <div class="glass-card p-6 mb-8 overflow-hidden">
        <h2 class="text-xl font-bold mb-6 font-heading">Gestion des Comptes</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-slate-300">
            <thead class="text-xs uppercase bg-slate-900/60 text-slate-400 border-b border-white/10">
              <tr>
                <th class="py-3 px-4">Utilisateur</th>
                <th class="py-3 px-4">Email</th>
                <th class="py-3 px-4">Type</th>
                <th class="py-3 px-4">Statut</th>
                <th class="py-3 px-4">2FA</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              @for (u of users(); track u.id) {
                <tr class="hover:bg-white/5 transition-colors">
                  <td class="py-3 px-4 font-semibold text-white">{{ u.prenom }} {{ u.nom }}</td>
                  <td class="py-3 px-4 text-slate-400">{{ u.email }}</td>
                  <td class="py-3 px-4"><span class="badge badge-purple">{{ u.dtype }}</span></td>
                  <td class="py-3 px-4"><span class="badge badge-green">{{ u.statut }}</span></td>
                  <td class="py-3 px-4">
                    <span class="text-xs" [class.text-emerald-400]="u.totpEnabled" [class.text-slate-500]="!u.totpEnabled">
                      {{ u.totpEnabled ? 'Activé' : 'Désactivé' }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  users = signal<User[]>([]);
  auditLogs = signal<any[]>([]);

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getAllUsers().subscribe({
      next: (res) => this.users.set(res.content),
      error: (err) => console.error(err)
    });

    this.apiService.getAuditLogs().subscribe({
      next: (res) => this.auditLogs.set(res.content || []),
      error: (err) => console.error(err)
    });
  }
}
