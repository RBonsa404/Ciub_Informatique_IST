import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Observable, forkJoin, map, of } from 'rxjs';
import { ManagementApi } from '../../core/api/management.api';
import { Inscription } from '../../core/api/models';
import { ResourceState } from '../../core/api/resource-state';
import { toApiError } from '../../core/http/problem';
import { SeoService } from '../../core/seo/seo.service';
import { FrNumberPipe, downloadText, formatDate, initialsOf, parseApiDate, toCsv } from '../../shared/format/format';
import { Badge } from '../../shared/ui/card/card';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { DataZone } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';
import { ToastService } from '../../shared/ui/toast/toast.service';

export interface Activity {
  /** Clé de sélection : « evenement-12 » ou « session-7 ». */
  readonly key: string;
  readonly kind: 'evenement' | 'session';
  readonly id: number;
  readonly label: string;
}

interface Activities {
  readonly evenements: readonly Activity[];
  readonly sessions: readonly Activity[];
}

export interface Registrations {
  readonly confirmed: readonly Inscription[];
  /** Liste d'attente dans l'ordre d'inscription : le rang est la position dans ce tableau. */
  readonly waiting: readonly Inscription[];
}

const time = (value: string | null | undefined) => parseApiDate(value)?.getTime() ?? 0;

export function splitRegistrations(inscriptions: readonly Inscription[], term = ''): Registrations {
  const needle = term.trim().toLocaleLowerCase('fr');
  const matches = (i: Inscription) => !needle || `${i.utilisateurNom ?? ''} ${i.utilisateurEmail ?? ''}`.toLocaleLowerCase('fr').includes(needle);
  const byName = (a: Inscription, b: Inscription) => (a.utilisateurNom ?? '').localeCompare(b.utilisateurNom ?? '', 'fr');
  return {
    confirmed: inscriptions.filter((i) => i.statut === 'CONFIRMEE' && matches(i)).sort(byName),
    waiting: inscriptions
      .filter((i) => i.statut === 'LISTE_ATTENTE')
      .sort((a, b) => time(a.dateInscription) - time(b.dateInscription))
      .filter(matches),
  };
}

const ACTIVITIES_FETCH_SIZE = 100;
const STATUT_CSV: Record<string, string> = { CONFIRMEE: 'Confirmée', LISTE_ATTENTE: 'Liste d’attente', ANNULEE: 'Annulée' };

/** Inscriptions et listes d'attente (écran 48) : effectif réel d'une activité, promotion depuis la liste d'attente, export. */
@Component({
  selector: 'app-registrations-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, Badge, Button, DataZone, Skeleton, FrNumberPipe],
  styles: `
    .toolbar {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      align-items: center;
    }
    .toolbar select {
      flex: 1 1 260px;
      max-width: 420px;
    }
    .toolbar input {
      flex: 1 1 220px;
    }
    .counter {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 0.5rem 1rem;
      text-align: center;
      min-width: 96px;
    }
    .counter span {
      display: block;
      font-size: 0.72rem;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .counter strong {
      font-size: 1.15rem;
      font-family: var(--font-heading);
    }
    .columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      align-items: start;
    }
    .panel {
      padding: 1.75rem;
      border-radius: 20px;
    }
    .panel h2 {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 1.25rem;
    }
    .rows {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .person {
      padding: 0.85rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .none {
      font-size: 0.88rem;
      color: var(--text-muted);
    }
    @media (max-width: 1000px) {
      .columns {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 600px) {
      .panel {
        padding: 1.25rem;
      }
    }
  `,
  template: `
    <div class="space-head">
      <div>
        <h1 class="space-title">Inscriptions et listes d’attente</h1>
        <p class="space-lead">Consultez l’effectif d’une activité et confirmez les membres en liste d’attente.</p>
      </div>
    </div>

    <app-data-zone [status]="activities.status()" emptyMessage="Aucun événement ni aucune séance de formation n’existe encore." emptyIcon="calendar" (retry)="activities.load()">
      <div zone-skeleton>
        <app-skeleton height="3rem" />
        <div class="columns" style="margin-top: 2rem">
          <app-skeleton height="220px" radius="20px" />
          <app-skeleton height="220px" radius="20px" />
        </div>
      </div>

      @if (activities.data(); as options) {
        <div class="toolbar">
          <label class="sr-only" for="choix-activite">Activité</label>
          <select id="choix-activite" class="form-select" [value]="selectedKey() ?? ''" (change)="select($event)">
            <option value="" disabled>Choisir une activité</option>
            @if (options.evenements.length > 0) {
              <optgroup label="Événements">
                @for (option of options.evenements; track option.key) {
                  <option [value]="option.key" [selected]="option.key === selectedKey()">{{ option.label }}</option>
                }
              </optgroup>
            }
            @if (options.sessions.length > 0) {
              <optgroup label="Séances de formation">
                @for (option of options.sessions; track option.key) {
                  <option [value]="option.key" [selected]="option.key === selectedKey()">{{ option.label }}</option>
                }
              </optgroup>
            }
          </select>

          @if (selected()) {
            <label class="sr-only" for="recherche-participant">Rechercher un participant</label>
            <input
              id="recherche-participant"
              class="form-input"
              type="search"
              placeholder="Rechercher un participant"
              autocomplete="off"
              [value]="term()"
              (input)="term.set($any($event.target).value)"
            />
            @if (registrations.status() === 'ready' || registrations.status() === 'empty') {
              <div class="counter">
                <span>Inscrits</span>
                <strong>{{ totals().confirmed | frNumber }}</strong>
              </div>
              <div class="counter">
                <span>En attente</span>
                <strong class="text-amber">{{ totals().waiting | frNumber }}</strong>
              </div>
              <button appBtn variant="secondary" type="button" [disabled]="totals().confirmed + totals().waiting === 0" (click)="exportCsv()">
                <app-icon name="download" [size]="16" /> Exporter en CSV
              </button>
            }
          }
        </div>

        @if (!selected()) {
          <p class="none">Choisissez une activité pour afficher ses inscriptions.</p>
        } @else {
          <app-data-zone [status]="registrations.status()" emptyMessage="Personne n’est inscrit à cette activité." emptyIcon="users" (retry)="registrations.load()">
            <div zone-skeleton class="columns">
              <app-skeleton height="220px" radius="20px" />
              <app-skeleton height="220px" radius="20px" />
            </div>

            <div class="columns" aria-live="polite">
              <section class="glass-panel panel" aria-labelledby="titre-confirmes">
                <h2 id="titre-confirmes">Inscrits confirmés ({{ view().confirmed.length | frNumber }})</h2>
                @if (view().confirmed.length === 0) {
                  <p class="none">{{ term() ? 'Aucun inscrit ne correspond à la recherche.' : 'Aucune inscription confirmée.' }}</p>
                } @else {
                  <ul class="rows">
                    @for (item of view().confirmed; track item.id) {
                      <li class="glass-card glass-card-static person">
                        <div class="flex min-w-0 items-center gap-3">
                          <span class="user-avatar user-avatar-sm" aria-hidden="true">{{ initials(item) }}</span>
                          <div class="min-w-0">
                            <strong style="font-size: 0.9rem; display: block">{{ item.utilisateurNom }}</strong>
                            <span style="font-size: 0.75rem; color: var(--text-muted); overflow-wrap: anywhere">
                              {{ item.utilisateurEmail }}
                              @if (item.utilisateurFiliere) {
                                • {{ item.utilisateurFiliere }}
                              }
                            </span>
                          </div>
                        </div>
                        <app-badge variant="success">Confirmé</app-badge>
                      </li>
                    }
                  </ul>
                }
              </section>

              <section class="glass-panel panel" aria-labelledby="titre-attente">
                <h2 id="titre-attente">Liste d’attente ({{ view().waiting.length | frNumber }})</h2>
                @if (view().waiting.length === 0) {
                  <p class="none">{{ term() ? 'Aucun membre en attente ne correspond à la recherche.' : 'La liste d’attente est vide.' }}</p>
                } @else {
                  <ul class="rows">
                    @for (item of view().waiting; track item.id) {
                      <li class="glass-card glass-card-static person">
                        <div class="flex min-w-0 items-center gap-3">
                          <span class="user-avatar user-avatar-sm" aria-hidden="true">{{ initials(item) }}</span>
                          <div class="min-w-0">
                            <strong style="font-size: 0.9rem; display: block">{{ item.utilisateurNom }}</strong>
                            <span style="font-size: 0.75rem; color: var(--text-muted)">Rang {{ rankOf(item) | frNumber }} sur la liste d’attente</span>
                          </div>
                        </div>
                        <button appBtn variant="amber" size="sm" type="button" [loading]="pendingId() === item.id" (click)="promote(item)">
                          Promouvoir<span class="sr-only"> {{ item.utilisateurNom }}</span>
                        </button>
                      </li>
                    }
                  </ul>
                }
              </section>
            </div>
          </app-data-zone>
        }
      }
    </app-data-zone>
  `,
})
export class RegistrationsPage {
  /** Paramètres d'adresse facultatifs : activité présélectionnée. */
  readonly evenement = input<string>();
  readonly session = input<string>();

  private readonly api = inject(ManagementApi);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  protected readonly activities = new ResourceState<Activities>(
    () => this.fetchActivities(),
    (value) => value.evenements.length + value.sessions.length === 0,
  );
  protected readonly selectedKey = computed(() => (this.evenement() ? `evenement-${this.evenement()}` : this.session() ? `session-${this.session()}` : null));
  protected readonly selected = computed<Activity | null>(() => {
    const key = this.selectedKey();
    const options = this.activities.data();
    if (!key || !options) return null;
    return [...options.evenements, ...options.sessions].find((option) => option.key === key) ?? null;
  });

  protected readonly term = signal('');
  protected readonly pendingId = signal<number | null>(null);
  protected readonly registrations = new ResourceState<readonly Inscription[]>(
    () => {
      const activity = this.selected();
      if (!activity) return of([]);
      return activity.kind === 'evenement' ? this.api.inscritsEvenement(activity.id) : this.api.inscritsSession(activity.id);
    },
    (list) => !list.some((i) => i.statut !== 'ANNULEE'),
  );
  private readonly all = computed(() => splitRegistrations(this.registrations.data() ?? []));
  protected readonly totals = computed(() => ({ confirmed: this.all().confirmed.length, waiting: this.all().waiting.length }));
  protected readonly view = computed(() => splitRegistrations(this.registrations.data() ?? [], this.term()));

  constructor() {
    inject(SeoService).apply({ title: 'Inscriptions et listes d’attente', noindex: true });
    this.activities.load();
    const subscription = toObservable(this.selected).subscribe((activity) => {
      this.term.set('');
      if (activity) this.registrations.load();
    });
    inject(DestroyRef).onDestroy(() => {
      subscription.unsubscribe();
      this.activities.destroy();
      this.registrations.destroy();
    });
  }

  protected select(event: Event): void {
    const key = (event.target as HTMLSelectElement).value;
    const [kind, id] = key.split('-');
    void this.router.navigate([], { queryParams: kind === 'evenement' ? { evenement: id } : { session: id }, replaceUrl: true });
  }

  protected initials(item: Inscription): string {
    return initialsOf(item.utilisateurNom);
  }

  /** Rang réel dans la liste d'attente complète, indépendamment de la recherche. */
  protected rankOf(item: Inscription): number {
    return this.all().waiting.findIndex((i) => i.id === item.id) + 1;
  }

  protected promote(item: Inscription): void {
    if (this.pendingId()) return;
    this.pendingId.set(item.id);
    this.api.changerStatutInscription(item.id, 'CONFIRMEE').subscribe({
      next: () => {
        this.pendingId.set(null);
        this.registrations.refresh();
        this.toasts.success(`L’inscription de ${item.utilisateurNom ?? 'ce membre'} est confirmée.`);
      },
      error: (failure: unknown) => {
        this.pendingId.set(null);
        const error = toApiError(failure);
        if (error.kind !== 'server' && error.kind !== 'rate-limit') this.toasts.danger(error.userMessage);
      },
    });
  }

  protected exportCsv(): void {
    const activity = this.selected();
    if (!activity) return;
    const { confirmed, waiting } = this.all();
    const rows = [...confirmed, ...waiting].map((i) => [i.utilisateurNom ?? '', i.utilisateurEmail ?? '', STATUT_CSV[i.statut] ?? i.statut, formatDate(i.dateInscription, 'numerique')]);
    downloadText(`inscriptions-${activity.key}.csv`, toCsv([['Nom', 'Adresse électronique', 'Statut', 'Date d’inscription'], ...rows]), 'text/csv');
  }

  private fetchActivities(): Observable<Activities> {
    return forkJoin({
      evenements: this.api.evenements({ size: ACTIVITIES_FETCH_SIZE, sort: 'dateDebut,desc' }),
      formations: this.api.formations({ size: ACTIVITIES_FETCH_SIZE }),
    }).pipe(
      map(({ evenements, formations }) => ({
        evenements: evenements.content.map((e): Activity => ({ key: `evenement-${e.id}`, kind: 'evenement', id: e.id, label: `${e.titre} — ${formatDate(e.dateDebut, 'court')}` })),
        sessions: formations.content.flatMap((f) =>
          [...(f.sessions ?? [])]
            .sort((a, b) => time(a.dateDebut) - time(b.dateDebut))
            .map((s): Activity => ({ key: `session-${s.id}`, kind: 'session', id: s.id, label: `${f.titre} — ${formatDate(s.dateDebut, 'court')}` })),
        ),
      })),
    );
  }
}
