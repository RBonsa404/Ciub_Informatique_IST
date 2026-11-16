import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CarteApi, CarteVerifiee, ResultatPointageCarte, SeanceAPointer } from '../../core/api/carte.api';
import { ResourceState } from '../../core/api/resource-state';
import { AuthStore } from '../../core/auth/auth.store';
import { toApiError } from '../../core/http/problem';
import { SeoService } from '../../core/seo/seo.service';
import { FrDatePipe } from '../../shared/format/format';
import { Badge } from '../../shared/ui/card/card';
import { Icon } from '../../shared/ui/icon/icon';
import { Skeleton } from '../../shared/ui/states/states';

/**
 * Page ouverte par le QR code d'une carte de membre (appareil photo du téléphone). Tout le monde y voit que la carte
 * est valide (prénom, initiale, statut) ; un formateur ou un responsable connecté y pointe la présence à une séance du jour.
 */
@Component({
  selector: 'app-carte-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Badge, Icon, Skeleton, FrDatePipe],
  styles: `
    .wrap {
      max-width: 560px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .panel {
      padding: 1.75rem;
      border-radius: 22px;
    }
    .member {
      display: flex;
      align-items: center;
      gap: 1.1rem;
    }
    .avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.6rem;
      color: #fff;
      background: linear-gradient(135deg, var(--color-blue-royal), var(--color-cyan-circuit));
    }
    .progress {
      height: 10px;
      border-radius: 999px;
      background: var(--glass-bg-subtle);
      border: 1px solid var(--border-subtle);
      overflow: hidden;
      margin-top: 0.5rem;
    }
    .progress span {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, var(--color-blue-royal), var(--color-cyan-circuit));
    }
    .progress.complete span {
      background: linear-gradient(90deg, #f59e0b, #fbbf24);
    }
    .seance {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.9rem 1rem;
      border: 1px solid var(--border-subtle);
      border-radius: 14px;
      background: var(--glass-bg-subtle);
    }
    .seance + .seance {
      margin-top: 0.6rem;
    }
    .result {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      padding: 1rem;
      border-radius: 14px;
      border: 1px solid rgba(34, 197, 94, 0.45);
      background: rgba(34, 197, 94, 0.1);
      margin-top: 1rem;
    }
    .result.deja {
      border-color: rgba(251, 191, 36, 0.5);
      background: rgba(251, 191, 36, 0.1);
    }
    .muted {
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.55;
    }
    @media (max-width: 480px) {
      .seance {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `,
  template: `
    <section class="page-section">
      <div class="page-container wrap">
        <h1 style="font-size: clamp(1.6rem, 4vw, 2.1rem)">Carte de <span class="accent">membre</span></h1>

        <div class="glass-panel panel">
          @switch (carte.status()) {
            @case ('loading') {
              <div class="member"><app-skeleton width="64px" height="64px" radius="50%" /><div style="flex: 1"><app-skeleton height="1.4rem" width="60%" /></div></div>
            }
            @case ('ready') {
              @if (carte.data(); as membre) {
                <div class="member">
                  <div class="avatar" aria-hidden="true">{{ membre.prenom.charAt(0) }}</div>
                  <div style="flex: 1; min-width: 0">
                    <div class="flex flex-wrap items-center gap-2">
                      <strong style="font-size: 1.3rem">{{ membre.prenom }} {{ membre.initialeNom }}</strong>
                      <app-badge [variant]="membre.actif ? 'amber' : 'primary'">{{ membre.actif ? 'Membre actif' : 'Membre passif' }}</app-badge>
                    </div>
                    <div class="muted" style="margin-top: 0.2rem">
                      <app-icon name="check-circle" [size]="14" /> Carte valide du Club Informatique de l’IST
                    </div>
                  </div>
                </div>
                <div style="margin-top: 1.25rem; font-weight: 700; font-size: 0.95rem">
                  {{ borne(membre.seancesSuivies, membre.seuil) }} / {{ membre.seuil }} séances de formation suivies
                </div>
                <div class="progress" [class.complete]="membre.actif"><span [style.width.%]="(100 * borne(membre.seancesSuivies, membre.seuil)) / membre.seuil"></span></div>
              }
            }
            @default {
              <div class="member">
                <div class="avatar" aria-hidden="true" style="background: var(--glass-bg-subtle); color: var(--text-muted)"><app-icon name="x-circle" [size]="28" /></div>
                <div>
                  <strong style="font-size: 1.15rem">Carte inconnue</strong>
                  <p class="muted">Ce code ne correspond à aucune carte de membre du club.</p>
                </div>
              </div>
            }
          }
        </div>

        @if (carte.status() === 'ready') {
          @if (equipe()) {
            <div class="glass-panel panel">
              <h2 class="flex items-center gap-2" style="font-size: 1.1rem; font-weight: 800; margin-bottom: 1rem">
                <app-icon name="user-check" [size]="18" /> Pointer la présence
              </h2>
              @switch (seances.status()) {
                @case ('loading') {
                  <app-skeleton height="3.5rem" radius="14px" />
                }
                @case ('ready') {
                  @for (seance of seances.data(); track seance.id) {
                    <div class="seance">
                      <div style="min-width: 0">
                        <div style="font-weight: 700">{{ seance.formation }}</div>
                        <div class="muted">{{ seance.dateDebut | frDate: 'heure' }} – {{ seance.dateFin | frDate: 'heure' }}{{ seance.lieu ? ' · ' + seance.lieu : '' }}</div>
                      </div>
                      <button type="button" class="btn btn-primary" [disabled]="enCours() !== null" (click)="pointer(seance)">
                        <app-icon name="check" [size]="16" /> {{ enCours() === seance.id ? 'Pointage…' : 'Pointer présent' }}
                      </button>
                    </div>
                  }
                }
                @case ('error') {
                  <p class="muted">Impossible de charger les séances du jour. Réessayez dans un instant.</p>
                }
                @default {
                  <p class="muted">Aucune séance de formation aujourd’hui que vous pouvez pointer. Seules les séances du jour des formations que vous animez ou gérez apparaissent ici.</p>
                }
              }

              @if (resultat(); as r) {
                <div class="result" [class.deja]="r.dejaPointe" role="status">
                  <app-icon [name]="r.dejaPointe ? 'info' : 'check-circle'" [size]="20" />
                  <div>
                    <strong>{{ r.prenom }} {{ r.nom }}</strong>
                    {{ r.dejaPointe ? 'était déjà pointé(e) présent(e) à cette séance.' : 'est pointé(e) présent(e).' }}
                    <div class="muted">{{ borne(r.seancesSuivies, r.seuil) }} / {{ r.seuil }} séances · {{ r.actif ? 'membre actif' : 'membre passif' }}</div>
                  </div>
                </div>
              }
              @if (erreur(); as message) {
                <p class="muted" role="alert" style="margin-top: 1rem; color: var(--color-danger, #ef4444)">{{ message }}</p>
              }
            </div>
          } @else if (!auth.isAuthenticated()) {
            <p class="muted" style="text-align: center">
              Vous animez une séance ?
              <a [routerLink]="['/connexion']" [queryParams]="{ retour: '/c/' + jeton }" class="accent-cyan" style="font-weight: 700">Connectez-vous</a>
              pour pointer la présence de ce membre.
            </p>
          }
        }
      </div>
    </section>
  `,
})
export class CartePage {
  private readonly api = inject(CarteApi);
  protected readonly auth = inject(AuthStore);
  protected readonly jeton = inject(ActivatedRoute).snapshot.paramMap.get('jeton') ?? '';

  protected readonly carte = new ResourceState<CarteVerifiee>(() => this.api.verifier(this.jeton));
  protected readonly seances = new ResourceState<readonly SeanceAPointer[]>(() => this.api.seancesDuJour());
  protected readonly equipe = computed(() => this.auth.hasAnyRole(['FORMATEUR', 'RESPONSABLE_CLUB']));
  protected readonly enCours = signal<number | null>(null);
  protected readonly resultat = signal<ResultatPointageCarte | null>(null);
  protected readonly erreur = signal<string | null>(null);

  protected readonly borne = (suivies: number, seuil: number) => Math.min(suivies, seuil);

  constructor() {
    inject(SeoService).apply({ title: 'Carte de membre', path: '/c', noindex: true });
    this.carte.load();
    if (this.equipe()) this.seances.load();
    inject(DestroyRef).onDestroy(() => {
      this.carte.destroy();
      this.seances.destroy();
    });
  }

  protected pointer(seance: SeanceAPointer): void {
    this.enCours.set(seance.id);
    this.erreur.set(null);
    this.api.pointer(seance.id, this.jeton).subscribe({
      next: (resultat) => {
        this.resultat.set(resultat);
        this.enCours.set(null);
        this.carte.refresh();
      },
      error: (erreur) => {
        this.erreur.set(toApiError(erreur).message || 'Le pointage n’a pas abouti. Réessayez.');
        this.enCours.set(null);
      },
    });
  }
}
