import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { LoginResponse } from '../../../core/models/models';

@Component({
  selector: 'app-membre-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto py-12 px-6">
      <!-- Header -->
      <div class="glass-card p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-6">
          <div class="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-purple-500/20">
            {{ user()?.prenom?.substring(0,1) }}{{ user()?.nom?.substring(0,1) }}
          </div>
          <div>
            <div class="flex items-center gap-3 mb-1">
              <h1 class="text-3xl font-bold font-heading">{{ user()?.prenom }} {{ user()?.nom }}</h1>
              <span class="badge badge-purple">Membre Actif</span>
            </div>
            <p class="text-slate-400 text-sm"><i class="fa-regular fa-envelope mr-2"></i>{{ user()?.email }}</p>
          </div>
        </div>
      </div>

      <!-- Overview Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="glass-card p-6">
          <div class="text-slate-400 text-xs uppercase font-semibold mb-2">Événements Inscrits</div>
          <div class="text-3xl font-bold text-cyan-400">2</div>
        </div>
        <div class="glass-card p-6">
          <div class="text-slate-400 text-xs uppercase font-semibold mb-2">Formations Suivies</div>
          <div class="text-3xl font-bold text-purple-400">1</div>
        </div>
        <div class="glass-card p-6">
          <div class="text-slate-400 text-xs uppercase font-semibold mb-2">Projets Soumis</div>
          <div class="text-3xl font-bold text-emerald-400">0</div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="glass-card p-8">
        <h2 class="text-xl font-bold mb-4 font-heading">Mon Espace Membre</h2>
        <p class="text-slate-400 text-sm leading-relaxed mb-6">
          Bienvenue dans votre espace membre ! Vous pouvez consulter les ressources exclusives du club, participer aux formations et événements planifiés.
        </p>
        <div class="flex flex-wrap gap-4">
          <a href="/evenements" class="gradient-btn text-xs">Parcourir les Événements</a>
          <a href="/ressources" class="glass-card px-4 py-2 text-xs font-semibold text-slate-200">Accéder aux Ressources Privées</a>
        </div>
      </div>
    </div>
  `
})
export class MembreDashboardComponent implements OnInit {
  user = signal<LoginResponse | null>(null);

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.user.set(this.authService.currentUser());
  }
}
