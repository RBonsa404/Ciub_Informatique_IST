import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/auth/auth.service';
import { AuthStore } from '../core/auth/auth.store';
import { BreadcrumbService } from '../core/navigation/breadcrumb.service';
import { NavigationService } from '../core/navigation/navigation.service';
import { NotificationsStore } from '../core/notifications/notifications.store';
import { AccountMenu } from '../shared/layout/account-menu/account-menu';
import { Brand } from '../shared/layout/brand/brand';
import { PublicFooter } from '../shared/layout/public-footer/public-footer';
import { PublicHeader } from '../shared/layout/public-header/public-header';
import { SkipLink } from '../shared/layout/skip-link/skip-link';
import { ThemeToggle } from '../shared/layout/theme-toggle/theme-toggle';
import { Breadcrumb } from '../shared/ui/breadcrumb/breadcrumb';
import { Button } from '../shared/ui/button/button';
import { Icon } from '../shared/ui/icon/icon';

const GLOWS = `
  <div class="ambient-glow glow-top-right" aria-hidden="true"></div>
  <div class="ambient-glow glow-bottom-left" aria-hidden="true"></div>
  <div class="ambient-glow glow-amber" aria-hidden="true"></div>
`;

const UNREAD_CAP = 99;

const SKIP_LINK = `<app-skip-link />`;

/** Gabarit public : en-tête et pied de page complets. */
@Component({
  selector: 'app-public-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SkipLink, RouterOutlet, PublicHeader, PublicFooter],
  template: `
    ${SKIP_LINK} ${GLOWS}
    <app-public-header />
    <main id="contenu" tabindex="-1" class="relative z-[1] outline-none">
      <router-outlet />
    </main>
    <app-public-footer />
  `,
})
export class PublicLayout {}

/** Gabarit d'authentification : en-tête minimal (marque, retour à l'accueil, thème), pied de page minimal. */
@Component({
  selector: 'app-auth-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SkipLink, RouterOutlet, RouterLink, Brand, ThemeToggle, PublicFooter, Button, Icon],
  template: `
    ${SKIP_LINK} ${GLOWS}
    <header class="site-header">
      <div class="page-container header-inner">
        <app-brand />
        <div class="header-actions">
          <a appBtn variant="ghost" size="sm" routerLink="/">
            <app-icon name="arrow-left" [size]="16" />
            <span class="max-[480px]:sr-only">Retour à l’accueil</span>
          </a>
          <app-theme-toggle />
        </div>
      </div>
    </header>
    <main id="contenu" tabindex="-1" class="relative z-[1] outline-none">
      <router-outlet />
    </main>
    <app-public-footer [minimal]="true" />
  `,
})
export class AuthLayout {}

/** Gabarit d'erreur : sobre, marque et bascule de thème, pied de page minimal. */
@Component({
  selector: 'app-error-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SkipLink, RouterOutlet, Brand, ThemeToggle, PublicFooter],
  template: `
    ${SKIP_LINK} ${GLOWS}
    <header class="site-header">
      <div class="page-container header-inner">
        <app-brand />
        <div class="header-actions"><app-theme-toggle /></div>
      </div>
    </header>
    <main id="contenu" tabindex="-1" class="relative z-[1] outline-none">
      <router-outlet />
    </main>
    <app-public-footer [minimal]="true" />
  `,
})
export class ErrorLayout {}

/**
 * Gabarit de l'espace connecté (écran 61) : barre latérale filtrée par rôle et par module,
 * barre supérieure, tiroir en deçà de 1 024 px, pied de page minimal.
 */
@Component({
  selector: 'app-dashboard-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SkipLink, RouterOutlet, RouterLink, RouterLinkActive, Brand, ThemeToggle, AccountMenu, PublicFooter, Button, Icon, Breadcrumb],
  host: { '(document:keydown.escape)': 'closeSidebar()' },
  template: `
    ${SKIP_LINK} ${GLOWS}
    <div class="dashboard-layout">
      <div class="sidebar-backdrop" [class.open]="sidebarOpen()" (click)="closeSidebar()"></div>
      <aside id="barre-laterale" class="sidebar" [class.open]="sidebarOpen()" aria-label="Navigation de l’espace">
        <div class="sidebar-brand">
          <app-brand subtitle="Espace connecté" />
        </div>

        @if (auth.user(); as user) {
          <div class="sidebar-user-badge">
            <span class="user-avatar" aria-hidden="true">{{ auth.initials() }}</span>
            <span class="user-meta">
              <span class="user-name">{{ user.prenom }} {{ user.nom }}</span>
              <span class="user-role-tag">{{ auth.primaryRoleLabel() }}</span>
            </span>
          </div>
        }

        <nav aria-label="Menu de l’espace">
          @for (section of nav.space(); track section.title) {
            <h2 class="sidebar-section-title">{{ section.title }}</h2>
            <ul class="sidebar-nav">
              @for (entry of section.entries; track entry.route) {
                <li>
                  <a
                    class="sidebar-link"
                    [routerLink]="entry.route"
                    routerLinkActive="active"
                    [routerLinkActiveOptions]="{ exact: entry.exact ?? false }"
                    ariaCurrentWhenActive="page"
                  >
                    @if (entry.icon; as icon) {
                      <app-icon [name]="icon" />
                    }
                    {{ entry.label }}
                  </a>
                </li>
              }
            </ul>
          }
        </nav>

        <div class="sidebar-footer">
          <ul class="sidebar-nav">
            <li>
              <a class="sidebar-link" routerLink="/"><app-icon name="log-in" /> Retour au site</a>
            </li>
            <li>
              <button type="button" class="sidebar-link sidebar-link-danger" (click)="logout()"><app-icon name="log-out" /> Déconnexion</button>
            </li>
          </ul>
        </div>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col">
        <div class="content-main w-full">
          <div class="dashboard-topbar">
            <button
              appBtn
              variant="secondary"
              [iconOnly]="true"
              type="button"
              class="lg:!hidden"
              aria-label="Ouvrir le menu de l’espace"
              aria-controls="barre-laterale"
              [attr.aria-expanded]="sidebarOpen()"
              (click)="sidebarOpen.set(true)"
            >
              <app-icon name="menu" [size]="22" />
            </button>
            <div class="min-w-0 flex-1">
              @if (breadcrumb.crumbs().length > 0) {
                <app-breadcrumb [crumbs]="breadcrumb.crumbs()" />
              }
            </div>
            <div class="header-actions">
              @if (nav.notificationsEnabled()) {
                <a appBtn variant="secondary" [iconOnly]="true" routerLink="/espace/notifications" class="relative" [attr.aria-label]="bellLabel()">
                  <app-icon name="bell" />
                  @if (unreadBadge(); as badge) {
                    <span class="notif-count" aria-hidden="true">{{ badge }}</span>
                  }
                </a>
              }
              <app-theme-toggle />
              <app-account-menu />
            </div>
          </div>
          <main id="contenu" tabindex="-1" class="outline-none">
            <router-outlet />
          </main>
        </div>
        <app-public-footer [minimal]="true" />
      </div>
    </div>
  `,
})
export class DashboardLayout {
  protected readonly nav = inject(NavigationService);
  protected readonly auth = inject(AuthStore);
  protected readonly breadcrumb = inject(BreadcrumbService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationsStore);
  protected readonly sidebarOpen = signal(false);

  /** Pastille du nombre réel de notifications non lues ; absente tant que le nombre est inconnu ou nul. */
  protected readonly unreadBadge = computed(() => {
    const count = this.notifications.unread();
    return count ? (count > UNREAD_CAP ? `${UNREAD_CAP}+` : String(count)) : null;
  });
  protected readonly bellLabel = computed(() => {
    const count = this.notifications.unread();
    return count ? `Notifications, ${count} non ${count > 1 ? 'lues' : 'lue'}` : 'Notifications';
  });

  constructor() {
    if (this.nav.notificationsEnabled()) this.notifications.refresh();
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => this.sidebarOpen.set(false));
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  protected logout(): void {
    this.authService.logout().subscribe(() => void this.router.navigateByUrl('/'));
  }
}
