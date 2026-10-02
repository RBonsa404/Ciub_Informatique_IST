import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { tap } from 'rxjs';
import { EntreeJournal } from '../../core/api/admin.api';
import { Page } from '../../core/api/api-client';
import { ResourceState } from '../../core/api/resource-state';
import { ConfigurationSysteme, Conformite, Sauvegarde, SystemApi } from '../../core/api/system.api';
import { normalizeSpaces } from '../../core/auth/password-policy';
import { toApiError } from '../../core/http/problem';
import { SeoService } from '../../core/seo/seo.service';
import { FrDatePipe, FrNumberPipe } from '../../shared/format/format';
import { Badge } from '../../shared/ui/card/card';
import { Button } from '../../shared/ui/button/button';
import { DialogService } from '../../shared/ui/dialog/confirm-dialog';
import { Field, FieldControl, revealErrors } from '../../shared/ui/field/field';
import { Icon } from '../../shared/ui/icon/icon';
import { Pagination } from '../../shared/ui/pagination/pagination';
import { DataZone } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { Checkbox } from '../../shared/ui/toggle/toggle';

const OCTETS_PAR_MO = 1_048_576;

/** Taille lisible d'un fichier, en mégaoctets (un chiffre après la virgule). */
export function formatSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return '';
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(bytes / OCTETS_PAR_MO)} Mo`;
}

/**
 * Configuration du système et sauvegardes (écran 56, UC-28, décision D-09) : réglages de la plateforme
 * et état réel des sauvegardes réalisées hors de l'application.
 */
@Component({
  selector: 'app-system-config-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Icon, Badge, Button, Field, FieldControl, Checkbox, DataZone, Skeleton, FrDatePipe],
  styles: `
    .layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      align-items: start;
    }
    .panel {
      padding: 2rem;
      border-radius: 20px;
    }
    .panel h2 {
      font-size: 1.2rem;
      font-weight: 700;
      margin-bottom: 1.25rem;
    }
    .pair {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 1.25rem;
    }
    .checks {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .rows {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .backup {
      padding: 0.85rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    @media (max-width: 1000px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 600px) {
      .panel {
        padding: 1.25rem;
      }
      .pair {
        grid-template-columns: 1fr;
      }
    }
  `,
  template: `
    <div class="space-head">
      <div>
        <h1 class="space-title">Configuration du système et sauvegardes</h1>
        <p class="space-lead">Réglages de la plateforme, mode maintenance et état des sauvegardes de la base de données.</p>
      </div>
    </div>

    <div class="layout">
      <section class="glass-panel panel" aria-labelledby="titre-reglages">
        <h2 id="titre-reglages">Paramètres de la plateforme</h2>
        <app-data-zone [status]="config.status()" emptyMessage="Les réglages sont indisponibles." (retry)="config.load()">
          <div zone-skeleton>
            <app-skeleton height="3rem" />
            <div style="margin-top: 1.25rem"><app-skeleton height="3rem" /></div>
            <div style="margin-top: 1.25rem"><app-skeleton height="4rem" /></div>
          </div>

          @if (config.data(); as current) {
            <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
              <app-field label="Nom de la plateforme" [required]="true" [serverError]="serverErrors()['nomPlateforme'] ?? null">
                <input appControl type="text" formControlName="nomPlateforme" />
              </app-field>
              <div class="pair">
                <app-field label="Tentatives de connexion avant verrouillage" [required]="true" [messages]="rangeMessages" [serverError]="serverErrors()['maxLoginAttempts'] ?? null">
                  <input appControl type="number" min="3" max="10" inputmode="numeric" formControlName="maxLoginAttempts" />
                </app-field>
                <app-field label="Durée du verrouillage (minutes)" [required]="true" [messages]="lockMessages" [serverError]="serverErrors()['lockoutDurationMinutes'] ?? null">
                  <input appControl type="number" min="5" max="1440" inputmode="numeric" formControlName="lockoutDurationMinutes" />
                </app-field>
              </div>
              <div class="checks">
                <app-checkbox formControlName="maintenanceMode">Activer le mode maintenance</app-checkbox>
                @if (hasRegistrationSwitch()) {
                  <app-checkbox formControlName="inscriptionsOuvertes">Autoriser les nouvelles inscriptions</app-checkbox>
                }
              </div>
              @if (current.version) {
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.25rem">Version du serveur : {{ current.version }}</p>
              }
              <div aria-live="assertive">
                @if (error(); as failure) {
                  <p class="form-error" role="alert" style="margin-bottom: 1rem">{{ failure }}</p>
                }
              </div>
              <button appBtn type="submit" [loading]="pending()">Enregistrer les réglages</button>
            </form>
          }
        </app-data-zone>
      </section>

      <section class="glass-panel panel" aria-labelledby="titre-sauvegardes">
        <h2 id="titre-sauvegardes">Sauvegardes de la base de données</h2>
        <p style="font-size: 0.88rem; margin-bottom: 1.5rem">
          Les sauvegardes sont réalisées par une tâche planifiée, en dehors de l’application. Cette page en affiche le résultat.
        </p>
        @switch (backups.status()) {
          @case ('loading') {
            <div role="status" aria-busy="true" class="rows">
              <span class="sr-only">Chargement en cours</span>
              <app-skeleton height="56px" radius="var(--radius-lg)" />
              <app-skeleton height="56px" radius="var(--radius-lg)" />
            </div>
          }
          @case ('error') {
            <div role="alert">
              <p style="font-size: 0.88rem; margin-bottom: 0.75rem">L’état des sauvegardes n’est pas disponible.</p>
              <button appBtn variant="secondary" size="sm" type="button" (click)="backups.load()"><app-icon name="refresh-cw" [size]="14" /> Réessayer</button>
            </div>
          }
          @case ('empty') {
            <p style="font-size: 0.88rem; color: var(--text-muted)">Aucune sauvegarde n’a encore été enregistrée.</p>
          }
          @default {
            <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.85rem">Dernières sauvegardes</h3>
            <ul class="rows">
              @for (backup of backups.data() ?? []; track backup.id) {
                <li class="glass-card glass-card-static backup">
                  <div>
                    <strong style="font-size: 0.88rem; display: block">{{ backup.date | frDate: 'long' }}, {{ backup.date | frDate: 'heure' }}</strong>
                    @if (size(backup); as text) {
                      <span style="font-size: 0.78rem; color: var(--text-muted)">{{ text }}</span>
                    }
                  </div>
                  <app-badge [variant]="backup.statut === 'REUSSIE' ? 'success' : 'danger'">{{ backup.statut === 'REUSSIE' ? 'Réussie' : 'Échouée' }}</app-badge>
                </li>
              }
            </ul>
          }
        }
      </section>
    </div>
  `,
})
export class SystemConfigPage {
  private readonly api = inject(SystemApi);
  private readonly toasts = inject(ToastService);
  private readonly dialogs = inject(DialogService);

  protected readonly rangeMessages = { min: 'Indiquez une valeur comprise entre 3 et 10.', max: 'Indiquez une valeur comprise entre 3 et 10.' };
  protected readonly lockMessages = { min: 'Indiquez une durée comprise entre 5 et 1 440 minutes.', max: 'Indiquez une durée comprise entre 5 et 1 440 minutes.' };
  protected readonly size = (backup: Sauvegarde) => formatSize(backup.tailleOctets);

  protected readonly form = new FormGroup({
    nomPlateforme: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    maxLoginAttempts: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(3), Validators.max(10)] }),
    lockoutDurationMinutes: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(5), Validators.max(1440)] }),
    maintenanceMode: new FormControl(false, { nonNullable: true }),
    inscriptionsOuvertes: new FormControl(true, { nonNullable: true }),
  });
  protected readonly config = new ResourceState<ConfigurationSysteme>(() => this.api.configuration().pipe(tap((value) => this.adopt(value))));
  protected readonly backups = new ResourceState<readonly Sauvegarde[]>(() => this.api.sauvegardes());
  /** L'interrupteur des inscriptions n'apparaît que si le serveur gère ce réglage. */
  protected readonly hasRegistrationSwitch = computed(() => typeof this.config.data()?.inscriptionsOuvertes === 'boolean');

  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string>>({});

  constructor() {
    inject(SeoService).apply({ title: 'Configuration du système', noindex: true });
    this.config.load();
    this.backups.load();
    inject(DestroyRef).onDestroy(() => {
      this.config.destroy();
      this.backups.destroy();
    });
  }

  private adopt(value: ConfigurationSysteme): void {
    this.form.reset({
      nomPlateforme: value.nomPlateforme,
      maxLoginAttempts: value.maxLoginAttempts,
      lockoutDurationMinutes: value.lockoutDurationMinutes,
      maintenanceMode: value.maintenanceMode,
      inscriptionsOuvertes: value.inscriptionsOuvertes ?? true,
    });
  }

  protected submit(): void {
    revealErrors(this.form);
    if (this.form.invalid || this.pending()) return;
    const value = this.form.getRawValue();
    const enabling = value.maintenanceMode && !this.config.data()?.maintenanceMode;
    const proceed = () => {
      this.pending.set(true);
      this.error.set(null);
      this.serverErrors.set({});
      this.api
        .enregistrerConfiguration({
          nomPlateforme: normalizeSpaces(value.nomPlateforme),
          maxLoginAttempts: Math.round(value.maxLoginAttempts ?? 0),
          lockoutDurationMinutes: Math.round(value.lockoutDurationMinutes ?? 0),
          maintenanceMode: value.maintenanceMode,
          inscriptionsOuvertes: value.inscriptionsOuvertes,
        })
        .subscribe({
          next: () => {
            this.pending.set(false);
            this.config.refresh();
            this.toasts.success('Les réglages sont enregistrés.');
          },
          error: (failure: unknown) => {
            this.pending.set(false);
            const apiError = toApiError(failure);
            this.serverErrors.set(apiError.fieldMessages());
            if (apiError.kind !== 'server' && apiError.kind !== 'rate-limit') this.error.set(apiError.userMessage);
          },
        });
    };
    if (!enabling) return proceed();
    this.dialogs
      .confirm({
        title: 'Activer le mode maintenance',
        message: 'Souhaitez-vous activer le mode maintenance ? Les visiteurs et les membres ne pourront plus utiliser la plateforme.',
        confirmLabel: 'Activer',
        danger: true,
      })
      .subscribe((confirmed) => {
        if (confirmed) proceed();
      });
  }
}

const JOURNAL_PAGE_SIZE = 15;

/**
 * Supervision technique et conformité (écran 57, UC-29) : consultation seule, par la DSI, des contrôles
 * calculés par le serveur et du journal d'audit.
 */
@Component({
  selector: 'app-compliance-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, Badge, Pagination, DataZone, Skeleton, FrDatePipe, FrNumberPipe],
  styles: `
    .facts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .fact {
      padding: 1.5rem;
      border-radius: 18px;
    }
    .fact span {
      font-size: 0.82rem;
      color: var(--text-muted);
      display: block;
      margin-bottom: 0.4rem;
    }
    .fact strong {
      font-size: 1.2rem;
      font-family: var(--font-heading);
      overflow-wrap: anywhere;
    }
    .panel {
      padding: 1.75rem;
      border-radius: 20px;
      margin-bottom: 2rem;
    }
    .panel h2 {
      font-size: 1.15rem;
      font-weight: 700;
      margin-bottom: 1.25rem;
    }
    .checks {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
      gap: 0.75rem;
    }
    .check {
      padding: 0.85rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.88rem;
    }
    @media (max-width: 600px) {
      .panel {
        padding: 1rem;
      }
    }
  `,
  template: `
    <app-data-zone [status]="state.status()" emptyMessage="Les contrôles de conformité sont indisponibles." emptyIcon="server" (retry)="state.load()">
      <div zone-skeleton>
        <app-skeleton width="50%" height="2.2rem" />
        <div class="facts" style="margin-top: 2rem">
          <app-skeleton height="96px" radius="18px" />
          <app-skeleton height="96px" radius="18px" />
          <app-skeleton height="96px" radius="18px" />
        </div>
        <app-skeleton height="220px" radius="20px" />
      </div>

      @if (state.data(); as data) {
        <div class="space-head">
          <div>
            <div class="flex flex-wrap gap-3" style="margin-bottom: 0.5rem">
              @if (data.statut) {
                <app-badge [variant]="allCompliant() ? 'success' : 'amber'">{{ allCompliant() ? 'Contrôles conformes' : 'Contrôles à examiner' }}</app-badge>
              }
              <app-badge variant="neutral"><app-icon name="eye" [size]="13" /> Consultation seule</app-badge>
            </div>
            <h1 class="space-title">Supervision technique et conformité</h1>
            <p class="space-lead">Vue d’audit technique destinée à la direction des systèmes d’information de l’IST.</p>
          </div>
        </div>

        <div class="facts">
          @if (data.versionBackend) {
            <div class="glass-panel fact">
              <span>Version du serveur</span>
              <strong>{{ data.versionBackend }}</strong>
            </div>
          }
          @if (data.versionJava) {
            <div class="glass-panel fact">
              <span>Version de Java</span>
              <strong>{{ data.versionJava }}</strong>
            </div>
          }
          @if (data.comptesActifs !== null && data.comptesActifs !== undefined) {
            <div class="glass-panel fact">
              <span>Comptes actifs</span>
              <strong>{{ data.comptesActifs | frNumber }}</strong>
            </div>
          }
          @if (data.tentativesEchouees !== null && data.tentativesEchouees !== undefined) {
            <div class="glass-panel fact">
              <span>Tentatives de connexion échouées</span>
              <strong>{{ data.tentativesEchouees | frNumber }}</strong>
            </div>
          }
        </div>

        <section class="glass-panel panel" aria-labelledby="titre-controles">
          <h2 id="titre-controles">Contrôles de conformité</h2>
          @if (data.verifications.length === 0) {
            <p style="font-size: 0.88rem; color: var(--text-muted)">Aucun contrôle n’est renvoyé par le serveur.</p>
          } @else {
            <ul class="checks">
              @for (check of data.verifications; track check.code) {
                <li class="glass-card glass-card-static check">
                  <span>{{ check.libelle }}</span>
                  <app-badge [variant]="check.conforme ? 'success' : 'danger'">{{ check.conforme ? 'Conforme' : 'Non conforme' }}</app-badge>
                </li>
              }
            </ul>
          }
        </section>
      }
    </app-data-zone>

    <section class="glass-panel panel" aria-labelledby="titre-journal-dsi">
      <h2 id="titre-journal-dsi">Journal d’audit</h2>
      <app-data-zone [status]="journal.status()" emptyMessage="Aucune action n’a encore été journalisée." emptyIcon="clipboard" (retry)="journal.load()">
        <div zone-skeleton>
          <app-skeleton height="2.5rem" />
          <div style="margin-top: 0.75rem"><app-skeleton height="3rem" /></div>
          <div style="margin-top: 0.75rem"><app-skeleton height="3rem" /></div>
        </div>
        <div class="table-responsive" tabindex="0" role="region" aria-label="Journal d’audit">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">Horodatage (UTC)</th>
                <th scope="col">Événement</th>
                <th scope="col">Acteur</th>
                <th scope="col">Adresse réseau</th>
              </tr>
            </thead>
            <tbody>
              @for (entry of journal.data()?.content ?? []; track entry.id) {
                <tr>
                  <td style="white-space: nowrap">{{ entry.dateAction | frDate: 'numerique' }}, {{ entry.dateAction | frDate: 'heure' }}</td>
                  <td>
                    <app-badge [variant]="entry.statut === 'SUCCES' ? 'success' : 'danger'">{{ entry.action }}</app-badge>
                  </td>
                  <td>{{ entry.utilisateurEmail || '—' }}</td>
                  <td>{{ entry.ipAddress || '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div style="margin-top: 1.5rem">
          <app-pagination [page]="page()" [totalPages]="totalPages()" label="Pages du journal" (pageChange)="goTo($event)" />
        </div>
      </app-data-zone>
    </section>
  `,
})
export class CompliancePage {
  private readonly api = inject(SystemApi);

  protected readonly state = new ResourceState<Conformite>(() => this.api.conformite());
  protected readonly allCompliant = computed(() => {
    const checks = this.state.data()?.verifications ?? [];
    return checks.length > 0 && checks.every((check) => check.conforme);
  });
  protected readonly page = signal(0);
  protected readonly journal = new ResourceState<Page<EntreeJournal>>(() => this.api.journalConformite({ page: this.page(), size: JOURNAL_PAGE_SIZE, sort: 'dateAction,desc' }));
  protected readonly totalPages = computed(() => this.journal.data()?.totalPages ?? 0);

  constructor() {
    inject(SeoService).apply({ title: 'Supervision technique', noindex: true });
    this.state.load();
    this.journal.load();
    inject(DestroyRef).onDestroy(() => {
      this.state.destroy();
      this.journal.destroy();
    });
  }

  protected goTo(page: number): void {
    this.page.set(page);
    this.journal.load();
  }
}
