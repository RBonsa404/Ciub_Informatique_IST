import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.css',
})
export class DashboardLayout {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  protected sidebarCollapsed = false;

  readonly memberLinks = [
    { path: '/membre/dashboard', label: 'Tableau de bord', icon: 'grid' },
    { path: '/membre/profil', label: 'Mon Profil', icon: 'user' },
    { path: '/membre/inscriptions', label: 'Mes Inscriptions', icon: 'calendar' },
    { path: '/membre/devoirs', label: 'Mes Devoirs', icon: 'book' },
    { path: '/membre/proposer-projet', label: 'Proposer un Projet', icon: 'rocket' },
    { path: '/membre/notifications', label: 'Notifications', icon: 'bell' },
  ];

  readonly formateurLinks = [
    { path: '/formateur/formations', label: 'Mes Formations', icon: 'book-open' },
    { path: '/formateur/presences', label: 'Présences', icon: 'check-square' },
    { path: '/formateur/ressources', label: 'Ressources', icon: 'file' },
    { path: '/formateur/projets', label: 'Suivi Projets', icon: 'folder' },
  ];

  readonly responsableLinks = [
    { path: '/responsable/actualites', label: 'Actualités', icon: 'newspaper' },
    { path: '/responsable/evenements', label: 'Événements', icon: 'calendar-plus' },
    { path: '/responsable/projets', label: 'Valider Projets', icon: 'check-circle' },
    { path: '/responsable/inscriptions', label: 'Inscriptions', icon: 'users' },
    { path: '/responsable/notifications', label: 'Notifications', icon: 'send' },
  ];

  readonly adminLinks = [
    { path: '/admin/statistiques', label: 'Statistiques', icon: 'bar-chart' },
    { path: '/admin/utilisateurs', label: 'Utilisateurs', icon: 'users' },
    { path: '/admin/roles', label: 'Rôles & Permissions', icon: 'shield' },
    { path: '/admin/categories', label: 'Catégories', icon: 'tag' },
    { path: '/admin/securite', label: 'Sécurité', icon: 'lock' },
    { path: '/admin/systeme', label: 'Système', icon: 'settings' },
    { path: '/admin/conformite', label: 'Conformité DSI', icon: 'clipboard' },
  ];

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout(): void {
    this.auth.logout();
  }
}
