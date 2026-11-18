import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, TemplateRef, inject, signal, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';
import { NavigationService } from '../../../core/navigation/navigation.service';
import { Button } from '../../ui/button/button';
import { Icon } from '../../ui/icon/icon';
import { AccountMenu } from '../account-menu/account-menu';
import { Brand } from '../brand/brand';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

/**
 * En-tête public (écran 58) : marque, navigation limitée aux modules opérationnels, bascule de thème,
 * actions de compte. En deçà de 1 024 px, la navigation passe dans un tiroir accessible.
 */
@Component({
  selector: 'app-public-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, Brand, ThemeToggle, AccountMenu, Button, Icon],
  template: `
    <header class="site-header">
      <div class="page-container header-inner">
        <app-brand />

        @if (nav.publicHeader().length > 0) {
          <nav aria-label="Navigation principale">
            <ul class="nav-links">
              @for (entry of nav.publicHeader(); track entry.route) {
                <li>
                  <a
                    class="nav-link"
                    [routerLink]="entry.route"
                    routerLinkActive="active"
                    [routerLinkActiveOptions]="{ exact: entry.exact ?? false }"
                    ariaCurrentWhenActive="page"
                    >{{ entry.label }}</a
                  >
                </li>
              }
            </ul>
          </nav>
        }

        <div class="header-actions">
          <app-theme-toggle />
          @if (auth.isAuthenticated()) {
            <a appBtn variant="primary" size="sm" routerLink="/espace" class="header-desktop-only">Mon espace</a>
            <app-account-menu class="max-[600px]:hidden" />
          } @else if (nav.authEnabled()) {
            <a appBtn variant="secondary" size="sm" routerLink="/connexion" class="header-desktop-only">Connexion</a>
            <a appBtn variant="primary" size="sm" routerLink="/inscription" class="header-desktop-only">Inscription</a>
          }
          <button
            type="button"
            class="mobile-menu-toggle"
            aria-label="Ouvrir le menu"
            aria-haspopup="dialog"
            [attr.aria-expanded]="drawerOpen()"
            (click)="openDrawer()"
          >
            <app-icon name="menu" [size]="22" />
          </button>
        </div>
      </div>
    </header>

    <ng-template #drawer>
      <div class="drawer-panel">
        <div class="flex items-center justify-between gap-4">
          <app-brand />
          <button appBtn variant="ghost" [iconOnly]="true" type="button" aria-label="Fermer le menu" (click)="closeDrawer()">
            <app-icon name="x" [size]="22" />
          </button>
        </div>
        <nav aria-label="Navigation principale">
          <ul class="flex flex-col gap-1" style="list-style:none">
            @for (entry of nav.publicHeader(); track entry.route) {
              <li>
                <a
                  class="drawer-link"
                  [routerLink]="entry.route"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{ exact: entry.exact ?? false }"
                  ariaCurrentWhenActive="page"
                  (click)="closeDrawer()"
                  >{{ entry.label }}</a
                >
              </li>
            }
          </ul>
        </nav>
        <div class="flex flex-col gap-3" style="margin-top:auto">
          @if (auth.isAuthenticated()) {
            <a appBtn variant="primary" [block]="true" routerLink="/espace" (click)="closeDrawer()">Mon espace</a>
          } @else if (nav.authEnabled()) {
            <a appBtn variant="secondary" [block]="true" routerLink="/connexion" (click)="closeDrawer()">Connexion</a>
            <a appBtn variant="primary" [block]="true" routerLink="/inscription" (click)="closeDrawer()">Inscription</a>
          }
        </div>
      </div>
    </ng-template>
  `,
})
export class PublicHeader {
  protected readonly nav = inject(NavigationService);
  protected readonly auth = inject(AuthStore);
  private readonly dialog = inject(Dialog);
  private readonly drawerTemplate = viewChild.required<TemplateRef<unknown>>('drawer');
  private readonly overlay = inject(Overlay);
  private drawerRef: DialogRef<unknown> | null = null;
  protected readonly drawerOpen = signal(false);

  protected openDrawer(): void {
    this.drawerRef = this.dialog.open(this.drawerTemplate(), {
      ariaLabel: 'Menu de navigation',
      ariaModal: true,
      backdropClass: 'modal-backdrop',
      panelClass: 'drawer-pane',
      height: '100%',
      positionStrategy: this.overlay.position().global().right('0').top('0'),
      restoreFocus: true,
    });
    this.drawerOpen.set(true);
    this.drawerRef.closed.subscribe(() => {
      this.drawerRef = null;
      this.drawerOpen.set(false);
    });
  }

  protected closeDrawer(): void {
    this.drawerRef?.close();
  }
}
