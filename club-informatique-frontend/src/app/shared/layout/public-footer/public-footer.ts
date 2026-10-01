import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE } from '../../../core/config/site';
import { LEGAL_NAV } from '../../../core/navigation/nav-registry';
import { NavigationService } from '../../../core/navigation/navigation.service';
import { BrandIcon } from '../../ui/icon/icon';
import { BrandName } from '../../ui/icon/icon-names';

interface SocialLink {
  readonly name: BrandName;
  readonly label: string;
  readonly href: string;
}

const SOCIAL: readonly SocialLink[] = [
  { name: 'whatsapp', label: 'WhatsApp', href: SITE.whatsapp.href },
  { name: 'linkedin', label: 'LinkedIn', href: SITE.social.linkedin },
  { name: 'facebook', label: 'Facebook', href: SITE.social.facebook },
  { name: 'tiktok', label: 'TikTok', href: SITE.social.tiktok },
];

/**
 * Pied de page (écran 59). Version complète pour le gabarit public, version minimale (liens légaux)
 * pour l'authentification et l'espace connecté. Aucun lien vers une page inexistante ou non prête.
 */
@Component({
  selector: 'app-public-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, BrandIcon],
  template: `
    @if (minimal()) {
      <footer class="site-footer site-footer-minimal">
        <div class="page-container footer-bottom">
          <div>© {{ year }} {{ site.name }}</div>
          <nav aria-label="Informations légales" class="flex flex-wrap justify-center gap-x-6 gap-y-2">
            @for (link of legal; track link.route) {
              <a [routerLink]="link.route">{{ link.label }}</a>
            }
          </nav>
        </div>
      </footer>
    } @else {
      <footer class="site-footer">
        <div class="page-container">
          <div class="footer-grid">
            <div class="footer-brand">
              <div class="flex items-center gap-3">
                <img
                  src="img/logo-88.png"
                  srcset="img/logo-88.png 1x, img/logo-176.png 2x"
                  alt=""
                  width="40"
                  height="40"
                  loading="lazy"
                  style="background:#fff;border-radius:8px;padding:2px"
                />
                <span class="font-heading font-bold" style="font-size:1.1rem;color:var(--text-primary)">{{ site.name }}</span>
              </div>
              <!-- Présentation factuelle d'une phrase : à fournir par le club (docs/informations-a-fournir.md, E.1 et E.4). -->
              <div class="flex gap-[0.85rem]" style="margin-top:1.25rem">
                @for (link of social; track link.name) {
                  <a class="btn btn-secondary btn-icon" [href]="link.href" target="_blank" rel="noopener noreferrer" [attr.aria-label]="link.label + ' (nouvel onglet)'">
                    <app-brand-icon [name]="link.name" />
                  </a>
                }
              </div>
            </div>

            @if (nav.publicFooter().length > 0) {
              <nav aria-label="Navigation du pied de page">
                <h2 class="footer-col-title">Navigation</h2>
                <ul class="footer-links">
                  @for (entry of nav.publicFooter(); track entry.route) {
                    <li>
                      <a [routerLink]="entry.route">{{ entry.label }}</a>
                    </li>
                  }
                </ul>
              </nav>
            }

            <nav aria-label="Informations légales">
              <h2 class="footer-col-title">Informations légales</h2>
              <ul class="footer-links">
                @for (link of legal; track link.route) {
                  <li>
                    <a [routerLink]="link.route">{{ link.label }}</a>
                  </li>
                }
              </ul>
            </nav>

            <div>
              <h2 class="footer-col-title">Contact</h2>
              <ul class="footer-links" style="color:var(--text-secondary);font-size:0.9rem">
                <li>
                  <strong style="color:var(--text-primary)">{{ site.institution }}</strong>
                </li>
                <li>{{ site.city }}, {{ site.country }}</li>
                <li>
                  Courriel&nbsp;: <a [href]="'mailto:' + site.email">{{ site.email }}</a>
                </li>
                <li>
                  WhatsApp&nbsp;: <a [href]="site.whatsapp.href" target="_blank" rel="noopener noreferrer">{{ site.whatsapp.label }}</a>
                </li>
                <li>
                  Téléphone&nbsp;:
                  @for (phone of site.phones; track phone.href; let last = $last) {
                    <a [href]="phone.href">{{ phone.label }}</a
                    >@if (!last) {
                      <span> / </span>
                    }
                  }
                </li>
                @if (nav.contactEnabled()) {
                  <li style="margin-top:0.5rem">
                    <a routerLink="/contact" class="btn btn-sm btn-outline">Formulaire de contact</a>
                  </li>
                }
              </ul>
            </div>
          </div>

          <div class="footer-bottom">
            <div>© {{ year }} {{ site.name }}</div>
          </div>
        </div>
      </footer>
    }
  `,
})
export class PublicFooter {
  readonly minimal = input(false);
  protected readonly nav = inject(NavigationService);
  protected readonly site = SITE;
  protected readonly legal = LEGAL_NAV;
  protected readonly social = SOCIAL;
  protected readonly year = new Date().getFullYear();
}
