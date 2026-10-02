import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';
import { Devoir, Formation, NIVEAU_LABELS, Ressource, STATUT_SESSION_LABELS, SessionFormation, StatutSession, TYPE_RESSOURCE_LABELS } from '../../core/api/models';
import { ResourceState } from '../../core/api/resource-state';
import { TrainerApi } from '../../core/api/trainer.api';
import { toApiError } from '../../core/http/problem';
import { BreadcrumbService } from '../../core/navigation/breadcrumb.service';
import { SeoService } from '../../core/seo/seo.service';
import { FrDatePipe, FrNumberPipe, formatTimeRange, safeUrl, toApiDateTime } from '../../shared/format/format';
import { BadgeVariant, Badge } from '../../shared/ui/card/card';
import { Button } from '../../shared/ui/button/button';
import { DialogService } from '../../shared/ui/dialog/confirm-dialog';
import { Field, FieldControl, revealErrors } from '../../shared/ui/field/field';
import { Icon } from '../../shared/ui/icon/icon';
import { DataZone } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { enrolledLabel, enrolledOf, sessionsOf } from './trainer-model';
import { FileLink } from '../../shared/ui/file/file-link';

interface Materials {
  readonly ressources: readonly Ressource[];
  readonly devoirs: readonly Devoir[];
}

const SESSION_BADGES: Record<StatutSession, BadgeVariant> = { PLANIFIEE: 'neutral', EN_COURS: 'primary', TERMINEE: 'success', ANNULEE: 'danger' };

/** Détail d'un cours pour le formateur (écran 38) : séances, supports, devoirs et effectif réel. */
@Component({
  selector: 'app-course-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Icon, Badge, Button, Field, FieldControl, DataZone, Skeleton, FrDatePipe, FrNumberPipe, FileLink],
  styles: `
    .layout {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
      align-items: start;
    }
    .box {
      padding: 1.75rem;
      border-radius: 20px;
    }
    .box h2 {
      font-size: 1.15rem;
      font-weight: 700;
      margin-bottom: 1.25rem;
    }
    .rows {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .session {
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem 1rem;
      flex-wrap: wrap;
    }
    .rank {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 800;
      flex-shrink: 0;
      background: var(--bg-surface-hover);
      color: var(--text-secondary);
    }
    .rank.done {
      background: var(--badge-success-bg, rgba(16, 185, 129, 0.2));
      color: var(--badge-success-text);
    }
    .file {
      padding: 0.75rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
    }
    .fact {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      font-size: 0.9rem;
      margin-bottom: 0.85rem;
    }
    .fact span {
      color: var(--text-secondary);
    }
    .session-form {
      margin-top: 1.25rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border-subtle);
    }
    .pair {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 1rem;
    }
    @media (max-width: 1100px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 600px) {
      .box {
        padding: 1.25rem;
      }
      .pair {
        grid-template-columns: 1fr;
      }
    }
  `,
  template: `
    <app-data-zone [status]="course.status()" emptyMessage="Ce cours est indisponible." [errorMessage]="errorMessage()" (retry)="reload()">
      <div zone-skeleton>
        <app-skeleton width="50%" height="2.2rem" />
        <div class="layout" style="margin-top: 2rem">
          <app-skeleton height="320px" radius="20px" />
          <app-skeleton height="220px" radius="20px" />
        </div>
      </div>

      @if (course.data(); as item) {
        <div class="space-head">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-3" style="margin-bottom: 0.5rem">
              <app-badge [variant]="item.publie ? 'success' : 'neutral'">{{ item.publie ? 'Publié' : 'Brouillon' }}</app-badge>
              <app-badge variant="primary">{{ niveauLabels[item.niveau] }}</app-badge>
              @if (item.categorieNom) {
                <app-badge variant="amber">{{ item.categorieNom }}</app-badge>
              }
            </div>
            <h1 class="space-title">{{ item.titre }}</h1>
            <p class="space-lead">
              @if (item.formateurNom) {
                Formateur : {{ item.formateurNom }} •
              }
              {{ enrolled() }}
            </p>
          </div>
          <div class="flex flex-wrap gap-3">
            <a class="btn btn-primary" [routerLink]="['/espace/formateur/cours', item.id, 'publier']"><app-icon name="plus" [size]="16" /> Ajouter un support ou un devoir</a>
            <a class="btn btn-secondary" [routerLink]="['/espace/formateur/cours', item.id, 'modifier']"><app-icon name="edit-2" [size]="16" /> Modifier</a>
          </div>
        </div>

        <div class="layout">
          <section class="glass-panel box" aria-labelledby="titre-plan">
            <h2 id="titre-plan">Plan d’apprentissage et séances</h2>
            @if (sessions().length === 0) {
              <p style="font-size: 0.9rem; color: var(--text-muted)">Aucune séance n’est planifiée pour ce cours.</p>
            } @else {
              <ol class="rows">
                @for (session of sessions(); track session.id; let index = $index) {
                  <li class="glass-card glass-card-static session">
                    <div class="flex min-w-0 items-center gap-3" style="flex: 1 1 240px">
                      <span class="rank" [class.done]="session.statut === 'TERMINEE'" aria-hidden="true">
                        @if (session.statut === 'TERMINEE') {
                          <app-icon name="check" [size]="14" />
                        } @else {
                          {{ index + 1 }}
                        }
                      </span>
                      <div class="min-w-0">
                        <strong style="font-size: 0.92rem; display: block">Séance {{ index + 1 | frNumber }} : {{ session.dateDebut | frDate: 'long' }}</strong>
                        <span style="font-size: 0.78rem; color: var(--text-muted)">
                          {{ timeRange(session) }}
                          @if (session.lieu) {
                            • {{ session.lieu }}
                          }
                          @if (capacity(session); as text) {
                            • {{ text }}
                          }
                        </span>
                      </div>
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                      <app-badge [variant]="sessionBadges[session.statut]">{{ sessionLabels[session.statut] }}</app-badge>
                      @if (session.statut !== 'ANNULEE') {
                        <a class="btn btn-primary btn-sm" [routerLink]="['/espace/formateur/cours', item.id, 'sessions', session.id, 'presences']">
                          Émargement<span class="sr-only"> de la séance {{ index + 1 }}</span>
                        </a>
                      }
                      <button
                        appBtn
                        variant="ghost"
                        size="sm"
                        [iconOnly]="true"
                        type="button"
                        [attr.aria-label]="'Supprimer la séance ' + (index + 1)"
                        [loading]="pendingKey() === 'session-' + session.id"
                        (click)="removeSession(item, session)"
                      >
                        <app-icon name="trash-2" [size]="16" />
                      </button>
                    </div>
                  </li>
                }
              </ol>
            }

            @if (!sessionOpen()) {
              <button appBtn variant="outline" size="sm" type="button" style="margin-top: 1.25rem" (click)="sessionOpen.set(true)">
                <app-icon name="plus" [size]="14" /> Planifier une séance
              </button>
            } @else {
              <form class="session-form" [formGroup]="sessionForm" (ngSubmit)="addSession(item)" novalidate>
                <div class="pair">
                  <app-field label="Début" [required]="true" [serverError]="sessionErrors()['dateDebut'] ?? null">
                    <input appControl type="datetime-local" formControlName="dateDebut" />
                  </app-field>
                  <app-field label="Fin" [required]="true" [serverError]="endError()">
                    <input appControl type="datetime-local" formControlName="dateFin" />
                  </app-field>
                </div>
                <div class="pair">
                  <app-field label="Lieu" [required]="true" [serverError]="sessionErrors()['lieu'] ?? null">
                    <input appControl type="text" formControlName="lieu" />
                  </app-field>
                  <app-field label="Capacité maximale" hint="Facultatif : laissez vide si le nombre de places est libre." [serverError]="sessionErrors()['capaciteMax'] ?? null">
                    <input appControl type="number" min="1" inputmode="numeric" formControlName="capaciteMax" />
                  </app-field>
                </div>
                <div class="flex flex-wrap gap-3">
                  <button appBtn size="sm" type="submit" [loading]="pendingKey() === 'ajout'">Planifier la séance</button>
                  <button appBtn variant="secondary" size="sm" type="button" (click)="closeSession()">Annuler</button>
                </div>
              </form>
            }
          </section>

          <div class="rows" style="gap: 1.5rem">
            <section class="glass-panel box" aria-labelledby="titre-supports">
              <h2 id="titre-supports">Supports et devoirs</h2>
              <app-data-zone [status]="materials.status()" emptyMessage="Aucun support ni devoir n’est publié." emptyIcon="file" (retry)="materials.load()">
                <div zone-skeleton class="rows">
                  <app-skeleton height="44px" radius="var(--radius-md)" />
                  <app-skeleton height="44px" radius="var(--radius-md)" />
                </div>
                @if (materials.data(); as data) {
                  <ul class="rows" style="gap: 0.6rem">
                    @for (ressource of data.ressources; track ressource.id) {
                      <li class="glass-card glass-card-static file">
                        <span class="min-w-0" style="font-size: 0.85rem">
                          @if (url(ressource.urlFichier); as href) {
                            <a [appFileLink]="href" style="font-weight: 600">{{ ressource.titre }}</a>
                          } @else {
                            <strong>{{ ressource.titre }}</strong>
                          }
                          <span style="display: block; font-size: 0.75rem; color: var(--text-muted)">{{ typeLabels[ressource.type] }}</span>
                        </span>
                        <button
                          appBtn
                          variant="ghost"
                          size="sm"
                          [iconOnly]="true"
                          type="button"
                          [attr.aria-label]="'Supprimer le support ' + ressource.titre"
                          [loading]="pendingKey() === 'ressource-' + ressource.id"
                          (click)="removeRessource(ressource)"
                        >
                          <app-icon name="trash-2" [size]="16" />
                        </button>
                      </li>
                    }
                    @for (devoir of data.devoirs; track devoir.id) {
                      <li class="glass-card glass-card-static file">
                        <span class="min-w-0" style="font-size: 0.85rem">
                          <strong>{{ devoir.titre }}</strong>
                          <span style="display: block; font-size: 0.75rem; color: var(--text-muted)">
                            Devoir
                            @if (devoir.dateLimite) {
                              • à rendre le {{ devoir.dateLimite | frDate: 'court' }}
                            }
                          </span>
                        </span>
                        <button
                          appBtn
                          variant="ghost"
                          size="sm"
                          [iconOnly]="true"
                          type="button"
                          [attr.aria-label]="'Supprimer le devoir ' + devoir.titre"
                          [loading]="pendingKey() === 'devoir-' + devoir.id"
                          (click)="removeDevoir(item, devoir)"
                        >
                          <app-icon name="trash-2" [size]="16" />
                        </button>
                      </li>
                    }
                  </ul>
                }
              </app-data-zone>
              <a class="btn btn-outline btn-sm" style="width: 100%; margin-top: 1.25rem" [routerLink]="['/espace/formateur/cours', item.id, 'publier']">
                <app-icon name="plus" [size]="14" /> Déposer une ressource
              </a>
            </section>

            <section class="glass-panel box" aria-labelledby="titre-cohorte">
              <h2 id="titre-cohorte">Cohorte</h2>
              <div class="fact">
                <span>Inscriptions aux séances</span>
                <strong>{{ enrolledCount() | frNumber }}</strong>
              </div>
              <div class="fact" style="margin-bottom: 0">
                <span>Séances planifiées</span>
                <strong>{{ sessions().length | frNumber }}</strong>
              </div>
            </section>
          </div>
        </div>
      }
    </app-data-zone>
  `,
})
export class CourseDetailPage {
  readonly id = input.required<string>();

  private readonly api = inject(TrainerApi);
  private readonly toasts = inject(ToastService);
  private readonly dialogs = inject(DialogService);
  private readonly breadcrumb = inject(BreadcrumbService);

  protected readonly niveauLabels = NIVEAU_LABELS;
  protected readonly sessionLabels = STATUT_SESSION_LABELS;
  protected readonly sessionBadges = SESSION_BADGES;
  protected readonly typeLabels = TYPE_RESSOURCE_LABELS;
  protected readonly url = safeUrl;

  protected readonly course = new ResourceState<Formation>(() => this.api.formation(Number(this.id())));
  protected readonly materials = new ResourceState<Materials>(
    (): Observable<Materials> => forkJoin({ ressources: this.api.ressources(Number(this.id())), devoirs: this.api.devoirs(Number(this.id())) }),
    (value) => value.ressources.length + value.devoirs.length === 0,
  );
  protected readonly sessions = computed(() => {
    const item = this.course.data();
    return item ? sessionsOf(item) : [];
  });
  protected readonly enrolledCount = computed(() => {
    const item = this.course.data();
    return item ? enrolledOf(item) : 0;
  });
  protected readonly enrolled = computed(() => (this.sessions().length > 0 ? enrolledLabel(this.enrolledCount()) : 'Aucune séance planifiée'));
  protected readonly errorMessage = computed(() => (this.course.error()?.kind === 'not-found' ? 'Ce cours est introuvable.' : null));

  protected readonly pendingKey = signal<string | null>(null);
  protected readonly sessionOpen = signal(false);
  protected readonly sessionErrors = signal<Record<string, string>>({});
  protected readonly sessionForm = new FormGroup({
    dateDebut: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    dateFin: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lieu: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200)] }),
    capaciteMax: new FormControl<number | null>(null, { validators: [Validators.min(1)] }),
  });
  private readonly orderError = signal<string | null>(null);
  protected readonly endError = computed(() => this.orderError() ?? this.sessionErrors()['dateFin'] ?? null);

  constructor() {
    const seo = inject(SeoService);
    seo.apply({ title: 'Détail du cours', noindex: true });
    const a = toObservable(this.id).subscribe(() => this.reload());
    const b = toObservable(this.course.data).subscribe((item) => {
      if (!item) return;
      seo.apply({ title: item.titre, noindex: true });
      this.breadcrumb.set([{ label: 'Mes cours', route: '/espace/formateur/cours' }, { label: item.titre }]);
    });
    inject(DestroyRef).onDestroy(() => {
      a.unsubscribe();
      b.unsubscribe();
      this.course.destroy();
      this.materials.destroy();
    });
  }

  protected reload(): void {
    this.course.load();
    this.materials.load();
  }

  protected timeRange(session: SessionFormation): string {
    return formatTimeRange(session.dateDebut, session.dateFin);
  }

  protected capacity(session: SessionFormation): string {
    const label = enrolledLabel(session.nombreInscrits);
    if (!label) return '';
    return session.capaciteMax ? `${label} sur ${new Intl.NumberFormat('fr-FR').format(session.capaciteMax)} places` : label;
  }

  protected closeSession(): void {
    this.sessionOpen.set(false);
    this.sessionForm.reset();
    this.sessionErrors.set({});
    this.orderError.set(null);
  }

  protected addSession(course: Formation): void {
    revealErrors(this.sessionForm);
    const value = this.sessionForm.getRawValue();
    this.orderError.set(value.dateDebut && value.dateFin && value.dateFin <= value.dateDebut ? 'La fin doit être postérieure au début.' : null);
    if (this.sessionForm.invalid || this.orderError() || this.pendingKey()) return;
    this.pendingKey.set('ajout');
    this.sessionErrors.set({});
    this.api
      .ajouterSession(course.id, { dateDebut: toApiDateTime(value.dateDebut), dateFin: toApiDateTime(value.dateFin), lieu: value.lieu.trim(), lienVisio: null, capaciteMax: value.capaciteMax })
      .subscribe({
        next: () => {
          this.pendingKey.set(null);
          this.closeSession();
          this.course.refresh();
          this.toasts.success('La séance est planifiée.');
        },
        error: (failure: unknown) => {
          this.pendingKey.set(null);
          const error = toApiError(failure);
          const fields = error.fieldMessages();
          this.sessionErrors.set(fields);
          if (Object.keys(fields).length === 0 && error.kind !== 'server' && error.kind !== 'rate-limit') this.toasts.danger(error.userMessage);
        },
      });
  }

  protected removeSession(course: Formation, session: SessionFormation): void {
    this.confirmRemoval('Supprimer la séance', 'Souhaitez-vous supprimer cette séance ? Les inscriptions associées seront perdues.', `session-${session.id}`, () =>
      this.api.supprimerSession(course.id, session.id),
    );
  }

  protected removeRessource(ressource: Ressource): void {
    this.confirmRemoval('Supprimer le support', `Souhaitez-vous supprimer le support « ${ressource.titre} » ?`, `ressource-${ressource.id}`, () => this.api.supprimerRessource(ressource.id));
  }

  protected removeDevoir(course: Formation, devoir: Devoir): void {
    this.confirmRemoval('Supprimer le devoir', `Souhaitez-vous supprimer le devoir « ${devoir.titre} » ?`, `devoir-${devoir.id}`, () => this.api.supprimerDevoir(course.id, devoir.id));
  }

  private confirmRemoval(title: string, message: string, key: string, action: () => Observable<void>): void {
    this.dialogs.confirm({ title, message, confirmLabel: 'Supprimer', danger: true }).subscribe((confirmed) => {
      if (!confirmed) return;
      this.pendingKey.set(key);
      action().subscribe({
        next: () => {
          this.pendingKey.set(null);
          this.course.refresh();
          this.materials.load();
          this.toasts.success('La suppression est effectuée.');
        },
        error: (failure: unknown) => {
          this.pendingKey.set(null);
          const error = toApiError(failure);
          if (error.kind !== 'server' && error.kind !== 'rate-limit') this.toasts.danger(error.userMessage);
        },
      });
    });
  }
}
