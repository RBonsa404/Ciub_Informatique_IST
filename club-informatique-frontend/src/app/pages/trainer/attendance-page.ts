import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Observable, forkJoin, map } from 'rxjs';
import { Formation, Inscription, Presence, STATUT_PRESENCE_LABELS, SessionFormation, StatutPresence } from '../../core/api/models';
import { ResourceState } from '../../core/api/resource-state';
import { TrainerApi } from '../../core/api/trainer.api';
import { toApiError } from '../../core/http/problem';
import { BreadcrumbService } from '../../core/navigation/breadcrumb.service';
import { SeoService } from '../../core/seo/seo.service';
import { FrDatePipe, FrNumberPipe, formatDate, formatTimeRange, parseApiDate } from '../../shared/format/format';
import { BadgeVariant, Badge } from '../../shared/ui/card/card';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { DataZone } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';
import { ToastService } from '../../shared/ui/toast/toast.service';

export interface AttendanceRow {
  readonly inscriptionId: number;
  readonly nom: string;
  readonly filiere: string | null;
  /** Dernier pointage enregistré côté serveur ; null si l'inscrit n'a pas encore été pointé. */
  readonly saved: StatutPresence | null;
  readonly datePointage: string | null;
}

interface Sheet {
  readonly formation: Formation;
  readonly session: SessionFormation | null;
  readonly rows: readonly AttendanceRow[];
}

/** Feuille d'une séance : inscrits confirmés, rapprochés des pointages déjà enregistrés. */
export function toAttendanceRows(inscrits: readonly Inscription[], presences: readonly Presence[]): readonly AttendanceRow[] {
  const byInscription = new Map(presences.map((p) => [p.inscriptionId, p]));
  return inscrits
    .filter((i) => i.statut === 'CONFIRMEE')
    .map((i): AttendanceRow => {
      const presence = byInscription.get(i.id);
      return { inscriptionId: i.id, nom: i.utilisateurNom ?? '', filiere: i.utilisateurFiliere ?? null, saved: presence?.statut ?? null, datePointage: presence?.datePointage ?? null };
    })
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}

const STATUTS: readonly StatutPresence[] = ['PRESENT', 'ABSENT', 'EXCUSE'];
const BADGES: Record<StatutPresence, BadgeVariant> = { PRESENT: 'success', ABSENT: 'danger', EXCUSE: 'amber' };

/** Feuille d'émargement d'une séance (écran 39) : pointage manuel des inscrits, enregistré en une fois. */
@Component({
  selector: 'app-attendance-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Badge, Button, DataZone, Skeleton, FrDatePipe, FrNumberPipe],
  styles: `
    .sheet {
      padding: 2rem;
      border-radius: 24px;
    }
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
    }
    select {
      min-width: 130px;
      padding-top: 0.45rem;
      padding-bottom: 0.45rem;
      font-size: 0.85rem;
    }
    /* L'en-tête de ligne garde l'apparence d'une cellule de contenu. */
    tbody th {
      background: transparent;
      color: var(--text-primary);
      font-family: inherit;
      font-weight: 700;
      padding: 0.95rem 1.1rem;
      white-space: normal;
    }
    tbody tr:hover th {
      background: var(--bg-surface-hover);
    }
    .footer {
      margin-top: 1.5rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border-subtle);
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    @media (max-width: 600px) {
      .sheet {
        padding: 1.25rem;
      }
    }
  `,
  template: `
    <app-data-zone [status]="state.status()" emptyMessage="Aucun membre n’est inscrit à cette séance." emptyIcon="users" [errorMessage]="errorMessage()" (retry)="state.load()">
      <div zone-skeleton>
        <app-skeleton width="45%" height="2.2rem" />
        <div style="margin-top: 2rem"><app-skeleton height="320px" radius="24px" /></div>
      </div>
      <a zone-empty class="btn btn-secondary btn-sm" [routerLink]="['/espace/formateur/cours', id()]">Retour au cours</a>

      @if (state.data(); as sheet) {
        <div class="space-head">
          <div class="min-w-0">
            <h1 class="space-title">Feuille d’émargement</h1>
            <p class="space-lead">{{ sheet.formation.titre }} • {{ subtitle() }}</p>
          </div>
          <a class="btn btn-secondary btn-sm" [routerLink]="['/espace/formateur/cours', id()]"><app-icon name="arrow-left" [size]="14" /> Retour au cours</a>
        </div>

        <div class="glass-panel sheet">
          <div class="toolbar">
            <div class="flex flex-wrap gap-3" aria-live="polite">
              <app-badge variant="success">{{ counts().PRESENT | frNumber }} {{ counts().PRESENT > 1 ? 'présents' : 'présent' }}</app-badge>
              <app-badge variant="danger">{{ counts().ABSENT | frNumber }} {{ counts().ABSENT > 1 ? 'absents' : 'absent' }}</app-badge>
              <app-badge variant="amber">{{ counts().EXCUSE | frNumber }} {{ counts().EXCUSE > 1 ? 'excusés' : 'excusé' }}</app-badge>
              @if (unmarked() > 0) {
                <app-badge variant="neutral">{{ unmarked() | frNumber }} non {{ unmarked() > 1 ? 'pointés' : 'pointé' }}</app-badge>
              }
            </div>
            <div class="flex flex-wrap gap-3">
              <button appBtn variant="secondary" size="sm" type="button" (click)="markAllPresent(sheet.rows)">Tous présents</button>
              <button appBtn size="sm" type="button" [loading]="pending()" [disabled]="!dirty()" (click)="save(sheet)">Enregistrer la feuille</button>
            </div>
          </div>

          <div class="table-responsive" tabindex="0" role="region" aria-label="Feuille d’émargement">
            <table class="data-table">
              <thead>
                <tr>
                  <th scope="col">N°</th>
                  <th scope="col">Membre</th>
                  @if (hasFiliere()) {
                    <th scope="col">Filière</th>
                  }
                  <th scope="col">Dernier pointage</th>
                  <th scope="col">Statut</th>
                  <th scope="col">Pointer</th>
                </tr>
              </thead>
              <tbody>
                @for (row of sheet.rows; track row.inscriptionId; let index = $index) {
                  @let current = statusOf(row);
                  <tr>
                    <td>{{ index + 1 }}</td>
                    <th scope="row">{{ row.nom }}</th>
                    @if (hasFiliere()) {
                      <td>{{ row.filiere }}</td>
                    }
                    <td style="color: var(--text-muted)">
                      @if (row.datePointage) {
                        {{ row.datePointage | frDate: 'numerique' }}, {{ row.datePointage | frDate: 'heure' }}
                      } @else {
                        —
                      }
                    </td>
                    <td>
                      @if (current) {
                        <app-badge [variant]="badges[current]">{{ labels[current] }}</app-badge>
                      } @else {
                        <app-badge variant="neutral">Non pointé</app-badge>
                      }
                    </td>
                    <td>
                      <select class="form-select" [attr.aria-label]="'Statut de ' + row.nom" [value]="current ?? ''" (change)="mark(row, $event)">
                        <option value="" disabled>Choisir</option>
                        @for (statut of statuts; track statut) {
                          <option [value]="statut" [selected]="current === statut">{{ labels[statut] }}</option>
                        }
                      </select>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="footer">
            @if (lastSaved(); as date) {
              Dernier enregistrement : {{ date }}.
            } @else {
              Cette feuille n’a pas encore été enregistrée.
            }
          </div>
        </div>
      }
    </app-data-zone>
  `,
})
export class AttendancePage {
  /** Paramètres de route : identifiants du cours et de la séance. */
  readonly id = input.required<string>();
  readonly sessionId = input.required<string>();

  private readonly api = inject(TrainerApi);
  private readonly toasts = inject(ToastService);
  private readonly breadcrumb = inject(BreadcrumbService);

  protected readonly statuts = STATUTS;
  protected readonly labels = STATUT_PRESENCE_LABELS;
  protected readonly badges = BADGES;

  protected readonly state = new ResourceState<Sheet>(
    () => this.fetch(),
    (sheet) => sheet.rows.length === 0,
  );
  /** Pointages modifiés et non encore enregistrés. */
  private readonly changes = signal<ReadonlyMap<number, StatutPresence>>(new Map());
  protected readonly pending = signal(false);
  protected readonly dirty = computed(() => this.changes().size > 0);

  protected readonly counts = computed(() => {
    const result: Record<StatutPresence, number> = { PRESENT: 0, ABSENT: 0, EXCUSE: 0 };
    for (const row of this.state.data()?.rows ?? []) {
      const status = this.statusOf(row);
      if (status) result[status] += 1;
    }
    return result;
  });
  protected readonly unmarked = computed(() => (this.state.data()?.rows ?? []).filter((row) => !this.statusOf(row)).length);
  protected readonly hasFiliere = computed(() => (this.state.data()?.rows ?? []).some((row) => !!row.filiere));
  protected readonly subtitle = computed(() => {
    const session = this.state.data()?.session;
    if (!session) return '';
    const place = session.lieu ? ` • ${session.lieu}` : '';
    return `Séance du ${formatDate(session.dateDebut, 'long')}, ${formatTimeRange(session.dateDebut, session.dateFin)}${place}`;
  });
  protected readonly lastSaved = computed(() => {
    const times = (this.state.data()?.rows ?? []).map((row) => parseApiDate(row.datePointage)?.getTime() ?? 0);
    const latest = Math.max(0, ...times);
    return latest > 0 ? `${formatDate(new Date(latest), 'long')}, ${formatDate(new Date(latest), 'heure')}` : null;
  });
  protected readonly errorMessage = computed(() => (this.state.error()?.kind === 'not-found' ? 'Cette séance est introuvable.' : null));

  constructor() {
    inject(SeoService).apply({ title: 'Feuille d’émargement', noindex: true });
    const params = computed(() => `${this.id()}/${this.sessionId()}`);
    const a = toObservable(params).subscribe(() => {
      this.changes.set(new Map());
      this.state.load();
    });
    const b = toObservable(this.state.data).subscribe((sheet) => {
      if (!sheet) return;
      this.breadcrumb.set([
        { label: 'Mes cours', route: '/espace/formateur/cours' },
        { label: sheet.formation.titre, route: `/espace/formateur/cours/${sheet.formation.id}` },
        { label: 'Émargement' },
      ]);
    });
    inject(DestroyRef).onDestroy(() => {
      a.unsubscribe();
      b.unsubscribe();
      this.state.destroy();
    });
  }

  protected statusOf(row: AttendanceRow): StatutPresence | null {
    return this.changes().get(row.inscriptionId) ?? row.saved;
  }

  protected mark(row: AttendanceRow, event: Event): void {
    const value = (event.target as HTMLSelectElement).value as StatutPresence;
    this.changes.update((map) => {
      const next = new Map(map);
      if (value === row.saved) next.delete(row.inscriptionId);
      else next.set(row.inscriptionId, value);
      return next;
    });
  }

  protected markAllPresent(rows: readonly AttendanceRow[]): void {
    this.changes.set(new Map(rows.filter((row) => row.saved !== 'PRESENT').map((row) => [row.inscriptionId, 'PRESENT' as StatutPresence])));
  }

  protected save(sheet: Sheet): void {
    if (!this.dirty() || this.pending()) return;
    const payload = [...this.changes()].map(([inscriptionId, statut]) => ({ inscriptionId, statut }));
    this.pending.set(true);
    this.api.enregistrerPresences(Number(this.sessionId()), payload).subscribe({
      next: () => {
        this.pending.set(false);
        this.changes.set(new Map());
        this.state.refresh();
        this.toasts.success(sheet.rows.length > 1 ? 'La feuille d’émargement est enregistrée.' : 'Le pointage est enregistré.');
      },
      error: (failure: unknown) => {
        this.pending.set(false);
        const error = toApiError(failure);
        if (error.kind !== 'server' && error.kind !== 'rate-limit') this.toasts.danger(error.userMessage);
      },
    });
  }

  private fetch(): Observable<Sheet> {
    const sessionId = Number(this.sessionId());
    return forkJoin({
      formation: this.api.formation(Number(this.id())),
      inscrits: this.api.inscrits(sessionId),
      presences: this.api.presences(sessionId),
    }).pipe(
      map(({ formation, inscrits, presences }) => ({
        formation,
        session: (formation.sessions ?? []).find((s) => s.id === sessionId) ?? null,
        rows: toAttendanceRows(inscrits, presences),
      })),
    );
  }
}
