import { Component, inject, signal, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  protected readonly mobileOpen = signal(false);
  protected readonly scrolled = signal(false);
  protected readonly profileOpen = signal(false);

  readonly navLinks = [
    { path: '/', label: 'Accueil', exact: true },
    { path: '/actualites', label: 'Actualités' },
    { path: '/evenements', label: 'Événements' },
    { path: '/formations', label: 'Formations' },
    { path: '/projets', label: 'Projets' },
    { path: '/ressources', label: 'Ressources' },
    { path: '/contact', label: 'Contact' },
  ];

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 20);
  }

  toggleMobile(): void {
    this.mobileOpen.update(v => !v);
  }

  toggleProfile(): void {
    this.profileOpen.update(v => !v);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    this.profileOpen.set(false);
  }
}
