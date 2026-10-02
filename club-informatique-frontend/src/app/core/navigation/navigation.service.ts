import { Injectable, computed, inject } from '@angular/core';
import { AuthStore } from '../auth/auth.store';
import { FeatureService } from '../config/feature.service';
import { NavEntry, NavSection, PUBLIC_FOOTER_NAV, PUBLIC_HEADER_NAV, SPACE_NAV } from './nav-registry';

/**
 * Politique de visibilité : une entrée n'apparaît que si la page appartient au produit (registre),
 * si le rôle de l'utilisateur l'autorise et si le module correspondant est opérationnel.
 */
@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly features = inject(FeatureService);
  private readonly auth = inject(AuthStore);

  readonly publicHeader = computed(() => PUBLIC_HEADER_NAV.filter((entry) => this.features.isEnabled(entry.module)));
  readonly publicFooter = computed(() => PUBLIC_FOOTER_NAV.filter((entry) => this.features.isEnabled(entry.module)));
  readonly contactEnabled = computed(() => this.features.isEnabled('contact'));
  readonly authEnabled = computed(() => this.features.isEnabled('authentification'));
  readonly notificationsEnabled = computed(() => this.features.isEnabled('notifications'));

  readonly space = computed<readonly NavSection[]>(() => {
    // Tant que le changement de mot de passe imposé n'est pas fait, aucune autre page de l'espace n'est proposée.
    if (!this.auth.isAuthenticated() || this.auth.user()?.changementMotDePasseRequis) return [];
    return SPACE_NAV.map((section) => ({
      title: section.title,
      entries: section.entries.filter((entry) => this.isVisible(entry)),
    })).filter((section) => section.entries.length > 0);
  });

  private isVisible(entry: NavEntry): boolean {
    if (!this.features.isEnabled(entry.module)) return false;
    return entry.roles ? this.auth.hasAnyRole(entry.roles) : true;
  }
}
