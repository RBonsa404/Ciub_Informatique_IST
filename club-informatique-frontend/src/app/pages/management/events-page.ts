import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ManagementApi } from '../../core/api/management.api';
import { Categorie, Evenement } from '../../core/api/models';
import { PublicApi } from '../../core/api/public.api';
import { ResourceState } from '../../core/api/resource-state';
import { normalizeSpaces } from '../../core/auth/password-policy';
import { FeatureService } from '../../core/config/feature.service';
import { toApiError } from '../../core/http/problem';
import { SeoService } from '../../core/seo/seo.service';
import { FrDatePipe, FrNumberPipe, formatDate, parseApiDate, toApiDateTime, toLocalInput } from '../../shared/format/format';
import { BadgeVariant, Badge } from '../../shared/ui/card/card';
import { Button } from '../../shared/ui/button/button';
import { DialogService } from '../../shared/ui/dialog/confirm-dialog';
import { Field, FieldControl, revealErrors } from '../../shared/ui/field/field';
import { Icon } from '../../shared/ui/icon/icon';
import { Pagination } from '../../shared/ui/pagination/pagination';
import { DataZone, PagedList } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { Switch } from '../../shared/ui/toggle/toggle';

export interface EventState {
  readonly label: string;
  readonly variant: BadgeVariant;
}

/** État affiché d'un événement, déduit de ses données réelles. */
export function eventState(event: Evenement, now = Date.now()): EventState {
  if (!event.publie) return { label: 'Brouillon', variant: 'neutral' };
  if ((parseApiDate(event.dateFin)?.getTime() ?? 0) < now) return { label: 'Passé', variant: 'neutral' };
  if (event.capaciteMax && (event.placesRestantes ?? 1) <= 0) return { label: 'Complet', variant: 'amber' };
  return { label: 'À venir', variant: 'primary' };
}

export interface CalendarCell {
  /** Jour du mois ; null pour une case hors du mois. */
  readonly day: number | null;
  readonly titles: readonly string[];
}

/** Grille d'un mois (semaines du lundi au dimanche, en UTC) avec les événements qui débutent chaque jour. */
export function buildMonth(year: number, month: number, events: readonly Evenement[]): readonly (readonly CalendarCell[])[] {
  const offset = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const byDay = new Map<number, string[]>();
  for (const event of events) {
    const date = parseApiDate(event.dateDebut);
    if (!date || date.getUTCFullYear() !== year || date.getUTCMonth() !== month) continue;
    byDay.set(date.getUTCDate(), [...(byDay.get(date.getUTCDate()) ?? []), event.titre]);
  }
  const cells: CalendarCell[] = [];
  for (let i = 0; i < offset; i++) cells.push({ day: null, titles: [] });
  for (let day = 1; day <= days; day++) cells.push({ day, titles: byDay.get(day) ?? [] });
  while (cells.length % 7 !== 0) cells.push({ day: null, titles: [] });
  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

const WEEK_DAYS = [
  { short: 'Lu', full: 'lundi' },
  { short: 'Ma', full: 'mardi' },
  { short: 'Me', full: 'mercredi' },
  { short: 'Je', full: 'jeudi' },
  { short: 'Ve', full: 'vendredi' },
  { short: 'Sa', full: 'samedi' },
  { short: 'Di', full: 'dimanche' },
] as const;

const PAGE_SIZE = 6;
const MONTH_FETCH_SIZE = 200;
const isoDay = (date: Date) => date.toISOString().slice(0, 10);

/** Gestion des événements (écran 45) : calendrier du mois, liste paginée, création, modification et suppression. */
@Component({
  selector: 'app-events-management-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Icon, Badge, Button, Field, FieldControl, Switch, Pagination, DataZone, Skeleton, FrDatePipe, FrNumberPipe],
  styles: `
    .layout {
      display: grid;
      grid-template-columns: 1fr 1.5fr;
      gap: 2rem;
      align-items: start;
      margin-bottom: 2rem;
    }
    .calendar-panel {
      padding: 1.5rem;
      border-radius: 20px;
    }
    .calendar-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .calendar-head h2 {
      font-size: 1.05rem;
      font-weight: 700;
      text-transform: capitalize;
    }
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 4px;
      text-align: center;
      font-size: 0.82rem;
    }
    thead th {
      color: var(--text-muted);
      font-weight: 600;
      padding-bottom: 0.4rem;
    }
    tbody td {
      height: 34px;
      border-radius: 8px;
      color: var(--text-secondary);
    }
    tbody td.marked {
      background: var(--color-blue-royal);
      color: #fff;
      font-weight: 700;
    }
    .rows {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .event {
      padding: 1.25rem 1.5rem;
      border-radius: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .form-panel {
      padding: 2rem;
      border-radius: 20px;
      scroll-margin-top: 1rem;
    }
    .pair {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 1.5rem;
    }
    .form-foot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 0.5rem;
    }
    @media (max-width: 1100px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 700px) {
      .pair {
        grid-template-columns: 1fr;
      }
      .form-panel {
        padding: 1.25rem;
      }
    }
  `,
  template: `
    <div class="space-head">
      <div>
        <h1 class="space-title">Gestion des événements</h1>
        <p class="space-lead">Calendrier, participants et publication des événements du club.</p>
      </div>
      <button appBtn variant="amber" type="button" (click)="startCreate()"><app-icon name="plus" [size]="16" /> Nouvel événement</button>
    </div>

    <div class="layout">
      <section class="glass-panel calendar-panel" aria-labelledby="titre-calendrier">
        <div class="calendar-head">
          <button appBtn variant="ghost" size="sm" [iconOnly]="true" type="button" aria-label="Mois précédent" (click)="shiftMonth(-1)">
            <app-icon name="chevron-left" [size]="18" />
          </button>
          <h2 id="titre-calendrier" aria-live="polite">{{ monthLabel() }}</h2>
          <button appBtn variant="ghost" size="sm" [iconOnly]="true" type="button" aria-label="Mois suivant" (click)="shiftMonth(1)">
            <app-icon name="chevron-right" [size]="18" />
          </button>
        </div>
        @if (monthEvents.status() === 'loading') {
          <div role="status" aria-busy="true">
            <span class="sr-only">Chargement en cours</span>
            <app-skeleton height="220px" radius="var(--radius-md)" />
          </div>
        } @else if (monthEvents.status() === 'error') {
          <div role="alert">
            <p style="font-size: 0.85rem; margin-bottom: 0.75rem">Le calendrier n’a pas pu être chargé.</p>
            <button appBtn variant="secondary" size="sm" type="button" (click)="monthEvents.load()"><app-icon name="refresh-cw" [size]="14" /> Réessayer</button>
          </div>
        } @else {
          <table aria-labelledby="titre-calendrier">
            <thead>
              <tr>
                @for (day of weekDays; track day.full) {
                  <th scope="col" [attr.abbr]="day.full">{{ day.short }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (week of weeks(); track $index) {
                <tr>
                  @for (cell of week; track $index) {
                    <td [class.marked]="cell.titles.length > 0" [attr.title]="cell.titles.length > 0 ? cell.titles.join(', ') : null">
                      @if (cell.day !== null) {
                        {{ cell.day }}
                        @if (cell.titles.length > 0) {
                          <span class="sr-only"> : {{ cell.titles.join(', ') }}</span>
                        }
                      }
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
          @if (!hasMonthEvents()) {
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.75rem">Aucun événement ne débute ce mois-ci.</p>
          }
        }
      </section>

      <section aria-label="Liste des événements">
        <app-data-zone [status]="list.status()" emptyMessage="Aucun événement n’a encore été créé." emptyIcon="calendar" (retry)="list.reload()">
          <div zone-skeleton class="rows">
            <app-skeleton height="86px" radius="16px" />
            <app-skeleton height="86px" radius="16px" />
            <app-skeleton height="86px" radius="16px" />
          </div>
          <ul class="rows">
            @for (event of list.items(); track event.id) {
              @let state = stateOf(event);
              <li class="glass-panel event">
                <div style="flex: 1 1 240px; min-width: 0">
                  <h2 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.25rem">{{ event.titre }}</h2>
                  <span class="meta-line" style="flex-wrap: wrap">
                    <app-icon name="map-pin" [size]="13" /> {{ event.lieu }} • {{ event.dateDebut | frDate: 'long' }}
                  </span>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <app-badge [variant]="state.variant">{{ state.label }}</app-badge>
                  @if (registrationsEnabled) {
                    <a class="btn btn-outline btn-sm" routerLink="/espace/gestion/inscriptions" [queryParams]="{ evenement: event.id }">
                      Gérer les inscrits
                      @if (event.nombreInscrits !== null && event.nombreInscrits !== undefined) {
                        ({{ event.nombreInscrits | frNumber }})
                      }
                      <span class="sr-only"> de {{ event.titre }}</span>
                    </a>
                  }
                  <button appBtn variant="secondary" size="sm" type="button" (click)="startEdit(event)">Modifier<span class="sr-only"> {{ event.titre }}</span></button>
                  <button
                    appBtn
                    variant="ghost"
                    size="sm"
                    [iconOnly]="true"
                    type="button"
                    [attr.aria-label]="'Supprimer ' + event.titre"
                    [loading]="deletingId() === event.id"
                    (click)="remove(event)"
                  >
                    <app-icon name="trash-2" [size]="16" />
                  </button>
                </div>
              </li>
            }
          </ul>
          <app-pagination [page]="list.page()" [totalPages]="list.totalPages()" label="Pages des événements" (pageChange)="list.goTo($event)" />
        </app-data-zone>
      </section>
    </div>

    @if (editing(); as target) {
      <section #formSection class="glass-panel form-panel" aria-labelledby="titre-formulaire" tabindex="-1">
        <h2 id="titre-formulaire" style="font-size: 1.2rem; font-weight: 700; margin-bottom: 1.5rem">
          {{ target === 'nouveau' ? 'Créer un événement' : 'Modifier un événement' }}
        </h2>
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="pair">
            <app-field label="Titre de l’événement" [required]="true" [serverError]="serverErrors()['titre'] ?? null">
              <input appControl type="text" formControlName="titre" />
            </app-field>
            <app-field label="Lieu" [required]="true" [serverError]="serverErrors()['lieu'] ?? null">
              <input appControl type="text" formControlName="lieu" />
            </app-field>
          </div>
          <div class="pair">
            <app-field label="Début" hint="Heure d’Ouagadougou." [required]="true" [serverError]="serverErrors()['dateDebut'] ?? null">
              <input appControl type="datetime-local" formControlName="dateDebut" />
            </app-field>
            <app-field label="Fin" [required]="true" [serverError]="endError()">
              <input appControl type="datetime-local" formControlName="dateFin" />
            </app-field>
          </div>
          <div class="pair">
            <app-field label="Capacité maximale" hint="Facultatif. Au-delà, les inscriptions passent en liste d’attente." [serverError]="serverErrors()['capaciteMax'] ?? null">
              <input appControl type="number" min="1" inputmode="numeric" formControlName="capaciteMax" />
            </app-field>
            <app-field label="Catégorie">
              <select appControl formControlName="categorieId">
                <option [ngValue]="null">Aucune catégorie</option>
                @for (categorie of categories(); track categorie.id) {
                  <option [ngValue]="categorie.id">{{ categorie.nom }}</option>
                }
              </select>
            </app-field>
          </div>
          <app-field label="Description" [required]="true" [serverError]="serverErrors()['description'] ?? null">
            <textarea appControl rows="4" formControlName="description"></textarea>
          </app-field>

          <div aria-live="assertive">
            @if (error(); as failure) {
              <p class="form-error" role="alert" style="margin-bottom: 1rem">{{ failure }}</p>
            }
          </div>

          <div class="form-foot">
            <app-switch formControlName="publie">Publier l’événement sur le site</app-switch>
            <div class="flex flex-wrap gap-3">
              <button appBtn variant="secondary" size="sm" type="button" (click)="cancel()">Annuler</button>
              <button appBtn size="sm" type="submit" [loading]="pending()">Enregistrer l’événement</button>
            </div>
          </div>
        </form>
      </section>
    }
  `,
})
export class EventsManagementPage {
  private readonly api = inject(ManagementApi);
  private readonly publicApi = inject(PublicApi);
  private readonly toasts = inject(ToastService);
  private readonly dialogs = inject(DialogService);
  private readonly formSection = viewChild<ElementRef<HTMLElement>>('formSection');

  protected readonly weekDays = WEEK_DAYS;
  protected readonly registrationsEnabled = inject(FeatureService).isEnabled('inscriptions');

  protected readonly list = new PagedList<Evenement>((query) => this.api.evenements({ page: query.page, size: query.size, sort: 'dateDebut,desc' }), PAGE_SIZE);

  // --- Calendrier ---
  private readonly month = signal(startOfMonth(new Date()));
  protected readonly monthLabel = computed(() => formatDate(this.month(), 'moisAnnee'));
  protected readonly monthEvents = new ResourceState<readonly Evenement[]>(
    () => {
      const first = this.month();
      const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0));
      return this.api.evenements({ size: MONTH_FETCH_SIZE, du: isoDay(first), au: isoDay(last) }).pipe(map((page) => page.content));
    },
    () => false,
  );
  protected readonly weeks = computed(() => buildMonth(this.month().getUTCFullYear(), this.month().getUTCMonth(), this.monthEvents.data() ?? []));
  protected readonly hasMonthEvents = computed(() => this.weeks().some((week) => week.some((cell) => cell.titles.length > 0)));

  // --- Formulaire ---
  private readonly categoriesState = new ResourceState<readonly Categorie[]>(() => this.publicApi.categories());
  protected readonly categories = computed(() => this.categoriesState.data() ?? []);
  protected readonly editing = signal<Evenement | 'nouveau' | null>(null);
  protected readonly pending = signal(false);
  protected readonly deletingId = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string>>({});
  private readonly orderError = signal<string | null>(null);
  protected readonly endError = computed(() => this.orderError() ?? this.serverErrors()['dateFin'] ?? null);
  protected readonly form = new FormGroup({
    titre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(200)] }),
    lieu: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200)] }),
    dateDebut: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    dateFin: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    capaciteMax: new FormControl<number | null>(null, { validators: [Validators.min(1)] }),
    categorieId: new FormControl<number | null>(null),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    publie: new FormControl(true, { nonNullable: true }),
  });

  constructor() {
    inject(SeoService).apply({ title: 'Gestion des événements', noindex: true });
    this.monthEvents.load();
    this.categoriesState.load();
    inject(DestroyRef).onDestroy(() => {
      this.monthEvents.destroy();
      this.categoriesState.destroy();
    });
  }

  protected stateOf(event: Evenement): EventState {
    return eventState(event);
  }

  protected shiftMonth(delta: number): void {
    const current = this.month();
    this.month.set(new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + delta, 1)));
    this.monthEvents.load();
  }

  protected startCreate(): void {
    this.form.reset({ publie: true });
    this.open('nouveau');
  }

  protected startEdit(event: Evenement): void {
    this.form.reset({
      titre: event.titre,
      lieu: event.lieu,
      dateDebut: toLocalInput(event.dateDebut),
      dateFin: toLocalInput(event.dateFin),
      capaciteMax: event.capaciteMax ?? null,
      categorieId: event.categorieId ?? null,
      description: event.description,
      publie: !!event.publie,
    });
    this.open(event);
  }

  private open(target: Evenement | 'nouveau'): void {
    this.error.set(null);
    this.serverErrors.set({});
    this.orderError.set(null);
    this.editing.set(target);
    // Le formulaire apparaît sous la liste : il est amené à l'écran et reçoit le focus.
    setTimeout(() => {
      const element = this.formSection()?.nativeElement;
      if (!element) return;
      if (typeof element.scrollIntoView === 'function') element.scrollIntoView({ block: 'start' });
      element.focus({ preventScroll: true });
    });
  }

  protected cancel(): void {
    this.editing.set(null);
  }

  protected submit(): void {
    revealErrors(this.form);
    const value = this.form.getRawValue();
    this.orderError.set(value.dateDebut && value.dateFin && value.dateFin <= value.dateDebut ? 'La fin doit être postérieure au début.' : null);
    const target = this.editing();
    if (this.form.invalid || this.orderError() || this.pending() || !target) return;
    const payload = {
      titre: normalizeSpaces(value.titre),
      description: value.description.trim(),
      dateDebut: toApiDateTime(value.dateDebut),
      dateFin: toApiDateTime(value.dateFin),
      lieu: normalizeSpaces(value.lieu),
      capaciteMax: value.capaciteMax,
      categorieId: value.categorieId,
      publie: value.publie,
    };
    this.pending.set(true);
    this.error.set(null);
    this.serverErrors.set({});
    (target === 'nouveau' ? this.api.creerEvenement(payload) : this.api.modifierEvenement(target.id, payload)).subscribe({
      next: () => {
        this.pending.set(false);
        this.editing.set(null);
        this.refresh();
        this.toasts.success(target === 'nouveau' ? 'L’événement est créé.' : 'L’événement est mis à jour.');
      },
      error: (failure: unknown) => {
        this.pending.set(false);
        const apiError = toApiError(failure);
        this.serverErrors.set(apiError.fieldMessages());
        if (apiError.kind !== 'server' && apiError.kind !== 'rate-limit') this.error.set(apiError.userMessage);
      },
    });
  }

  protected remove(event: Evenement): void {
    this.dialogs
      .confirm({
        title: 'Supprimer l’événement',
        message: `Souhaitez-vous supprimer l’événement « ${event.titre} » ? Les inscriptions associées seront perdues.`,
        confirmLabel: 'Supprimer',
        danger: true,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.deletingId.set(event.id);
        this.api.supprimerEvenement(event.id).subscribe({
          next: () => {
            this.deletingId.set(null);
            if (this.editing() === event) this.editing.set(null);
            this.refresh();
            this.toasts.success('L’événement est supprimé.');
          },
          error: (failure: unknown) => {
            this.deletingId.set(null);
            const error = toApiError(failure);
            if (error.kind !== 'server' && error.kind !== 'rate-limit') this.toasts.danger(error.userMessage);
          },
        });
      });
  }

  private refresh(): void {
    this.list.reload();
    this.monthEvents.load();
  }
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}
