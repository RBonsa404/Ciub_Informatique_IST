import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CarteApi, EtatCarte } from '../../../core/api/carte.api';
import { ResourceState } from '../../../core/api/resource-state';
import { Badge } from '../card/card';
import { Icon } from '../icon/icon';
import { DataZone } from '../states/data-zone';
import { Skeleton } from '../states/states';

/**
 * « Ma carte de membre » : la carte telle qu'envoyée par courriel, son téléchargement et la progression
 * vers le statut de membre actif (séances de formation pointées).
 */
@Component({
  selector: 'app-member-card-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge, Icon, DataZone, Skeleton],
  styles: `
    .panel {
      padding: 2rem;
      border-radius: 24px;
      max-width: 900px;
      margin: 1.5rem auto 0;
    }
    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
      gap: 2rem;
      align-items: center;
    }
    .card-image {
      width: 100%;
      aspect-ratio: 1600 / 1010;
      border-radius: 18px;
      box-shadow: 0 18px 40px rgba(5, 10, 24, 0.45);
      display: block;
    }
    .progress {
      height: 10px;
      border-radius: 999px;
      background: var(--glass-bg-subtle);
      border: 1px solid var(--border-subtle);
      overflow: hidden;
      margin: 0.6rem 0 0.4rem;
    }
    .progress span {
      display: block;
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--color-blue-royal), var(--color-cyan-circuit));
      transition: width 0.4s ease;
    }
    .progress.complete span {
      background: linear-gradient(90deg, #f59e0b, #fbbf24);
    }
    .note {
      font-size: 0.88rem;
      line-height: 1.55;
      color: var(--text-secondary);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1.25rem;
    }
    @media (max-width: 760px) {
      .panel {
        padding: 1.25rem;
      }
      .layout {
        grid-template-columns: 1fr;
        gap: 1.25rem;
      }
    }
  `,
  template: `
    <section class="glass-panel panel" aria-labelledby="titre-carte">
      <h2 id="titre-carte" class="flex items-center gap-2" style="font-size: 1.25rem; font-weight: 800; margin-bottom: 1.25rem">
        <app-icon name="award" [size]="20" /> Ma carte de membre
      </h2>

      <app-data-zone [status]="etat.status()" emptyMessage="Votre carte est indisponible pour le moment." (retry)="charger()">
        <div zone-skeleton class="layout">
          <app-skeleton height="14rem" radius="18px" />
          <div><app-skeleton height="1.4rem" width="70%" /><div style="margin-top: 1rem"><app-skeleton height="4rem" /></div></div>
        </div>

        @if (etat.data(); as carte) {
          <div class="layout">
            <div>
              @if (image(); as src) {
                <img class="card-image" [src]="src" [alt]="'Carte de membre n° ' + carte.numeroMembre" width="1600" height="1010" />
              } @else {
                <app-skeleton height="14rem" radius="18px" />
              }
            </div>

            <div>
              <div class="flex flex-wrap items-center gap-2" style="margin-bottom: 0.5rem">
                <app-badge [variant]="carte.actif ? 'amber' : 'primary'">{{ carte.actif ? 'Membre actif' : 'Membre passif' }}</app-badge>
                <span style="font-size: 0.85rem; color: var(--text-muted)">N° {{ carte.numeroMembre }}</span>
              </div>

              <div style="font-size: 0.95rem; font-weight: 700">
                {{ affiche(carte) }} / {{ carte.seuil }} séances de formation suivies
              </div>
              <div class="progress" [class.complete]="carte.actif" role="progressbar" [attr.aria-valuenow]="affiche(carte)" aria-valuemin="0" [attr.aria-valuemax]="carte.seuil">
                <span [style.width.%]="pourcentage(carte)"></span>
              </div>

              @if (carte.actif) {
                <p class="note">Bravo : vous êtes membre actif du club. Continuez à présenter votre carte à chaque séance.</p>
              } @else {
                <p class="note">
                  Présentez votre carte à chaque séance de formation pour faire enregistrer votre présence. Vous deviendrez
                  <strong>membre actif</strong> après {{ carte.seuil }} séances ; il vous en reste {{ carte.seuil - carte.seancesSuivies }}.
                </p>
              }
              <p class="note" style="margin-top: 0.5rem">Les séances de formation ont lieu {{ carte.joursDesSeances }}. Les événements ne comptent pas.</p>

              @if (image(); as src) {
                <div class="actions">
                  <a class="btn btn-primary" [href]="src" [attr.download]="'carte-membre-' + carte.numeroMembre + '.png'">
                    <app-icon name="download" [size]="16" /> Télécharger ma carte
                  </a>
                </div>
              }
            </div>
          </div>
        }
      </app-data-zone>
    </section>
  `,
})
export class MemberCardPanel {
  private readonly api = inject(CarteApi);
  protected readonly etat = new ResourceState<EtatCarte>(() => this.api.maCarte());
  protected readonly image = signal<string | null>(null);
  private adresse: string | null = null;

  protected readonly affiche = (carte: EtatCarte) => Math.min(carte.seancesSuivies, carte.seuil);
  protected readonly pourcentage = (carte: EtatCarte) => Math.round((100 * Math.min(carte.seancesSuivies, carte.seuil)) / carte.seuil);
  protected readonly vide = computed(() => this.etat.status() === 'empty');

  constructor() {
    this.charger();
    inject(DestroyRef).onDestroy(() => {
      this.etat.destroy();
      if (this.adresse) URL.revokeObjectURL(this.adresse);
    });
  }

  protected charger(): void {
    this.etat.load();
    this.api.imageDeMaCarte().subscribe({
      next: (fichier) => {
        if (this.adresse) URL.revokeObjectURL(this.adresse);
        this.adresse = URL.createObjectURL(fichier);
        this.image.set(this.adresse);
      },
      error: () => this.image.set(null),
    });
  }
}
