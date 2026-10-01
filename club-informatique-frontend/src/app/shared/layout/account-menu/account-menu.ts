import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthStore } from '../../../core/auth/auth.store';
import { FeatureService } from '../../../core/config/feature.service';
import { Icon } from '../../ui/icon/icon';

/** Menu de compte : profil et déconnexion. Avatar neutre à initiales, sans photo. */
@Component({
  selector: 'app-account-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkMenuTrigger, CdkMenu, CdkMenuItem, RouterLink, Icon],
  template: `
    @if (auth.user(); as user) {
      <button type="button" class="btn btn-secondary btn-sm" style="padding-left:0.35rem" [cdkMenuTriggerFor]="menu" aria-label="Menu du compte">
        <span class="user-avatar user-avatar-sm" aria-hidden="true">{{ auth.initials() }}</span>
        <span class="max-[600px]:hidden">{{ user.prenom }}</span>
        <app-icon name="chevron-down" [size]="14" />
      </button>
      <ng-template #menu>
        <div class="menu-panel" cdkMenu>
          <div style="padding:0.5rem 0.75rem">
            <div class="user-name">{{ user.prenom }} {{ user.nom }}</div>
            <div class="user-role-tag">{{ auth.primaryRoleLabel() }}</div>
          </div>
          <div class="menu-separator" role="separator"></div>
          @if (profileEnabled) {
            <a class="menu-item" cdkMenuItem routerLink="/espace/profil"><app-icon name="user" [size]="16" /> Mon profil</a>
          }
          <button type="button" class="menu-item menu-item-danger" cdkMenuItem (cdkMenuItemTriggered)="logout()">
            <app-icon name="log-out" [size]="16" /> Déconnexion
          </button>
        </div>
      </ng-template>
    }
  `,
})
export class AccountMenu {
  protected readonly auth = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly profileEnabled = inject(FeatureService).isEnabled('profil');

  protected logout(): void {
    this.authService.logout().subscribe(() => void this.router.navigateByUrl('/'));
  }
}
