import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="sticky top-0 z-50 backdrop-blur-xl bg-[#090d16]/80 border-b border-white/10 px-6 py-4">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <!-- Logo -->
        <a routerLink="/" class="flex items-center gap-3 text-2xl font-bold font-heading tracking-tight">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
            <i class="fa-solid fa-code text-lg"></i>
          </div>
          <span>Club<span class="gradient-text">Info</span></span>
        </a>

        <!-- Nav Links -->
        <nav class="hidden md:flex items-center gap-8 font-medium text-slate-300 text-sm">
          <a routerLink="/" routerLinkActive="text-purple-400 font-semibold" [routerLinkActiveOptions]="{exact: true}" class="hover:text-white transition-colors">Accueil</a>
          <a routerLink="/actualites" routerLinkActive="text-purple-400 font-semibold" class="hover:text-white transition-colors">Actualités</a>
          <a routerLink="/evenements" routerLinkActive="text-purple-400 font-semibold" class="hover:text-white transition-colors">Événements</a>
          <a routerLink="/formations" routerLinkActive="text-purple-400 font-semibold" class="hover:text-white transition-colors">Formations</a>
          <a routerLink="/projets" routerLinkActive="text-purple-400 font-semibold" class="hover:text-white transition-colors">Projets</a>
          <a routerLink="/ressources" routerLinkActive="text-purple-400 font-semibold" class="hover:text-white transition-colors">Ressources</a>
          <a routerLink="/contact" routerLinkActive="text-purple-400 font-semibold" class="hover:text-white transition-colors">Contact</a>
        </nav>

        <!-- User Actions -->
        <div class="flex items-center gap-4">
          @if (authService.currentUser()) {
            <a [routerLink]="getDashboardRoute()" class="glass-card px-4 py-2 text-sm font-semibold flex items-center gap-2 hover:border-purple-500/50">
              <i class="fa-solid fa-user-gear text-purple-400"></i>
              <span>Dashboard ({{ authService.currentUser()?.prenom }})</span>
            </a>
            <button (click)="logout()" class="text-slate-400 hover:text-rose-400 transition-colors p-2 text-sm">
              <i class="fa-solid fa-right-from-bracket"></i>
            </button>
          } @else {
            <a routerLink="/login" class="text-slate-300 hover:text-white font-medium text-sm px-3 py-2">Connexion</a>
            <a routerLink="/register" class="gradient-btn text-sm">
              <span>Rejoindre</span>
              <i class="fa-solid fa-arrow-right text-xs"></i>
            </a>
          }
        </div>
      </div>
    </header>
  `
})
export class NavbarComponent {
  constructor(public authService: AuthService) {}

  logout() {
    this.authService.logout();
  }

  getDashboardRoute(): string {
    const role = this.authService.getUserRole();
    if (role === 'ADMINISTRATEUR' || role === 'SUPERADMIN' || role === 'DSI') return '/dashboard/admin';
    return '/dashboard/membre';
  }
}
