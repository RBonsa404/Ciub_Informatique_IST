import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, map, tap } from 'rxjs';
import { AdminApi, CompteUtilisateur, EntreeJournal } from '../../core/api/admin.api';
import { Page } from '../../core/api/api-client';
import { ResourceState } from '../../core/api/resource-state';
import { ROLE_LABELS, ROLE_PRIORITY, Role } from '../../core/auth/auth.models';
import { AuthStore } from '../../core/auth/auth.store';
import { normalizeSpaces } from '../../core/auth/password-policy';
import { toApiError } from '../../core/http/problem';
import { BreadcrumbService } from '../../core/navigation/breadcrumb.service';
import { SeoService } from '../../core/seo/seo.service';
import { FrDatePipe, initialsOf } from '../../shared/format/format';
import { Badge } from '../../shared/ui/card/card';
import { Button } from '../../shared/ui/button/button';
import { DialogService } from '../../shared/ui/dialog/confirm-dialog';
import { Field, FieldControl, revealErrors } from '../../shared/ui/field/field';
import { Icon } from '../../shared/ui/icon/icon';
import { Pagination } from '../../shared/ui/pagination/pagination';
import { DataZone } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { ROLE_BADGES, STATUT_BADGES, STATUT_LABELS, assignableRoles, sortRoles } from './admin-model';

const PAGE_SIZE = 10;
const SEARCH_DELAY_MS = 300;

/** Le serveur applique la recherche et le filtre de rôle ; ils sont revérifiés sur la page reçue. */
export function matchesAccount(account: CompteUtilisateur, term: string, role: Role | null): boolean {
  const needle = term.trim().toLocaleLowerCase('fr');
  const haystack = `${account.prenom} ${account.nom} ${account.email}`.toLocaleLowerCase('fr');
  return (!needle || haystack.includes(needle)) && (!role || account.roles.includes(role));
}

/** Gestion des comptes utilisateurs, liste (écran 51, UC-23). */
@Component({
  selector: 'app-users-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Icon, Badge, Button, Field, FieldControl, Pagination, DataZone, Skeleton, FrDatePipe],
  styles: `
    .controls {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .controls input {
      width: min(100%, 280px);
    }
    .controls select {
      width: auto;
      min-width: 170px;
    }
    .panel {
      padding: 1.75rem;
      border-radius: 20px;
      margin-bottom: 1.5rem;
    }
    .form-panel {
      padding: 2rem;
      border-radius: 20px;
      margin-bottom: 2rem;
      scroll-margin-top: 1rem;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 1.5rem;
    }
    @media (max-width: 700px) {
      .controls input,
      .controls select {
        width: 100%;
      }
      .grid {
        grid-template-columns: 1fr;
      }
      .panel,
      .form-panel {
        padding: 1rem;
      }
    }
  `,
  template: `
    <div class="space-head">
      <h1 class="space-title">Gestion des comptes utilisateurs</h1>
      <div class="controls">
        <label class="sr-only" for="recherche-compte">Rechercher un compte</label>
        <input id="recherche-compte" class="form-input" type="search" placeholder="Rechercher un nom ou une adresse" autocomplete="off" (input)="onSearch($any($event.target).value)" />
        <label class="sr-only" for="filtre-role">Rôle</label>
        <select id="filtre-role" class="form-select" (change)="setRole($event)">
          <option value="">Tous les rôles</option>
          @for (role of roleOptions; track role) {
            <option [value]="role">{{ roleLabels[role] }}</option>
          }
        </select>
        <button appBtn variant="amber" type="button" (click)="openInvite()"><app-icon name="user-plus" [size]="16" /> Inviter un utilisateur</button>
      </div>
    </div>

    @if (inviting()) {
      <section #inviteSection class="glass-panel form-panel" aria-labelledby="titre-invitation" tabindex="-1">
        <h2 id="titre-invitation" style="font-size: 1.2rem; font-weight: 700; margin-bottom: 0.5rem">Inviter un utilisateur</h2>
        <p style="font-size: 0.85rem; margin-bottom: 1.25rem">La personne invitée reçoit un lien à usage unique pour choisir elle-même son mot de passe.</p>
        <form [formGroup]="inviteForm" (ngSubmit)="invite()" novalidate>
          <div class="grid">
            <app-field label="Prénom" [required]="true" [serverError]="inviteErrors()['prenom'] ?? null">
              <input appControl type="text" formControlName="prenom" />
            </app-field>
            <app-field label="Nom" [required]="true" [serverError]="inviteErrors()['nom'] ?? null">
              <input appControl type="text" formControlName="nom" />
            </app-field>
            <app-field label="Adresse électronique" [required]="true" [serverError]="inviteErrors()['email'] ?? null">
              <input appControl type="email" inputmode="email" formControlName="email" />
            </app-field>
            <app-field label="Rôle" [required]="true">
              <select appControl formControlName="role">
                @for (role of assignable; track role) {
                  <option [value]="role">{{ roleLabels[role] }}</option>
                }
              </select>
            </app-field>
          </div>
          <div aria-live="assertive">
            @if (inviteError(); as failure) {
              <p class="form-error" role="alert" style="margin-bottom: 1rem">{{ failure }}</p>
            }
          </div>
          <div class="flex flex-wrap justify-end gap-3">
            <button appBtn variant="secondary" size="sm" type="button" (click)="inviting.set(false)">Annuler</button>
            <button appBtn size="sm" type="submit" [loading]="invitePending()">Envoyer l’invitation</button>
          </div>
        </form>
      </section>
    }

    <app-data-zone [status]="status()" [emptyMessage]="filtered() ? 'Aucun compte ne correspond à cette recherche.' : 'Aucun compte n’est enregistré.'" emptyIcon="users" (retry)="state.load()">
      <div zone-skeleton class="glass-panel panel">
        <app-skeleton height="2.5rem" />
        <div style="margin-top: 0.75rem"><app-skeleton height="3rem" /></div>
        <div style="margin-top: 0.75rem"><app-skeleton height="3rem" /></div>
        <div style="margin-top: 0.75rem"><app-skeleton height="3rem" /></div>
      </div>

      <div class="glass-panel panel">
        <div class="table-responsive" tabindex="0" role="region" aria-label="Comptes utilisateurs">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col"><span class="sr-only">Avatar</span></th>
                <th scope="col">Nom complet</th>
                <th scope="col">Courriel</th>
                <th scope="col">Filière</th>
                <th scope="col">Rôle attribué</th>
                <th scope="col">Statut</th>
                <th scope="col">Date d’inscription</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (account of items(); track account.id) {
                <tr>
                  <td><span class="user-avatar user-avatar-sm" aria-hidden="true">{{ initials(account) }}</span></td>
                  <td style="white-space: nowrap"><strong>{{ account.prenom }} {{ account.nom }}</strong></td>
                  <td>{{ account.email }}</td>
                  <td>{{ account.filiere || '—' }}</td>
                  <td>
                    <div class="flex flex-wrap gap-1">
                      @for (role of sorted(account); track role) {
                        <app-badge [variant]="roleBadges[role]" style="font-size: 0.7rem">{{ roleLabels[role] }}</app-badge>
                      }
                    </div>
                  </td>
                  <td><app-badge [variant]="statutBadges[account.statut]">{{ statutLabels[account.statut] }}</app-badge></td>
                  <td style="white-space: nowrap">{{ account.createdAt | frDate: 'numerique' }}</td>
                  <td>
                    <a class="btn btn-secondary btn-sm" [routerLink]="['/espace/admin/utilisateurs', account.id]">
                      <app-icon name="edit-2" [size]="14" /> Éditer<span class="sr-only"> {{ account.prenom }} {{ account.nom }}</span>
                    </a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
      <app-pagination [page]="page()" [totalPages]="totalPages()" label="Pages des comptes" (pageChange)="goTo($event)" />
    </app-data-zone>
  `,
})
export class UsersListPage {
  private readonly api = inject(AdminApi);
  private readonly auth = inject(AuthStore);
  private readonly toasts = inject(ToastService);
  private readonly inviteSection = viewChild<ElementRef<HTMLElement>>('inviteSection');

  protected readonly roleOptions = ROLE_PRIORITY;
  protected readonly roleLabels = ROLE_LABELS;
  protected readonly roleBadges = ROLE_BADGES;
  protected readonly statutLabels = STATUT_LABELS;
  protected readonly statutBadges = STATUT_BADGES;
  protected readonly assignable = assignableRoles(this.auth.user()?.roles ?? []);
  protected readonly sorted = (account: CompteUtilisateur) => sortRoles(account.roles);
  protected readonly initials = (account: CompteUtilisateur) => initialsOf(`${account.prenom} ${account.nom}`);

  private readonly search = signal('');
  private readonly role = signal<Role | null>(null);
  private readonly searchInput = new Subject<string>();
  protected readonly page = signal(0);
  protected readonly filtered = computed(() => this.search().trim() !== '' || this.role() !== null);

  protected readonly state = new ResourceState<Page<CompteUtilisateur>>(() =>
    this.api.comptes({ page: this.page(), size: PAGE_SIZE, sort: 'createdAt,desc', search: this.search().trim() || undefined, role: this.role() }),
  );
  protected readonly items = computed(() => (this.state.data()?.content ?? []).filter((account) => matchesAccount(account, this.search(), this.role())));
  protected readonly status = computed(() => (this.state.status() === 'ready' && this.items().length === 0 ? 'empty' : this.state.status()));
  protected readonly totalPages = computed(() => this.state.data()?.totalPages ?? 0);

  // --- Invitation ---
  protected readonly inviting = signal(false);
  protected readonly invitePending = signal(false);
  protected readonly inviteError = signal<string | null>(null);
  protected readonly inviteErrors = signal<Record<string, string>>({});
  protected readonly inviteForm = new FormGroup({
    prenom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)] }),
    nom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    role: new FormControl<Role>('MEMBRE', { nonNullable: true }),
  });

  constructor() {
    inject(SeoService).apply({ title: 'Gestion des comptes utilisateurs', noindex: true });
    const subscription = this.searchInput.pipe(debounceTime(SEARCH_DELAY_MS), distinctUntilChanged()).subscribe((term) => {
      this.search.set(term);
      this.page.set(0);
      this.state.load();
    });
    this.state.load();
    inject(DestroyRef).onDestroy(() => {
      subscription.unsubscribe();
      this.state.destroy();
    });
  }

  protected onSearch(term: string): void {
    this.searchInput.next(term);
  }

  protected setRole(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.role.set(value ? (value as Role) : null);
    this.page.set(0);
    this.state.load();
  }

  protected goTo(page: number): void {
    this.page.set(page);
    this.state.load();
  }

  protected openInvite(): void {
    this.inviteForm.reset({ role: 'MEMBRE' });
    this.inviteError.set(null);
    this.inviteErrors.set({});
    this.inviting.set(true);
    setTimeout(() => this.inviteSection()?.nativeElement.focus({ preventScroll: false }));
  }

  protected invite(): void {
    revealErrors(this.inviteForm);
    if (this.inviteForm.invalid || this.invitePending()) return;
    const value = this.inviteForm.getRawValue();
    this.invitePending.set(true);
    this.inviteError.set(null);
    this.inviteErrors.set({});
    this.api.inviter({ prenom: normalizeSpaces(value.prenom), nom: normalizeSpaces(value.nom), email: value.email.trim().toLowerCase(), role: value.role }).subscribe({
      next: () => {
        this.invitePending.set(false);
        this.inviting.set(false);
        this.state.load();
        this.toasts.success('L’invitation est envoyée.');
      },
      error: (failure: unknown) => {
        this.invitePending.set(false);
        const apiError = toApiError(failure);
        this.inviteErrors.set(apiError.fieldMessages());
        if (apiError.kind !== 'server' && apiError.kind !== 'rate-limit') this.inviteError.set(apiError.userMessage);
      },
    });
  }
}

const HISTORY_LIMIT = 10;

/** Détail et édition d'un compte utilisateur (écran 52, UC-23 et UC-24) : identité, rôles, statut, historique. */
@Component({
  selector: 'app-user-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Icon, Badge, Button, Field, FieldControl, DataZone, Skeleton, FrDatePipe],
  styles: `
    .identity {
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
    .avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-blue-royal), var(--color-cyan-circuit));
      color: #fff;
      font-size: 1.4rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .layout {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 2rem;
      align-items: start;
    }
    .panel {
      padding: 2rem;
      border-radius: 20px;
    }
    .names {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 1.5rem;
    }
    fieldset {
      border: 0;
      padding: 0;
      margin: 0 0 1.25rem;
    }
    legend {
      padding: 0;
      margin-bottom: 0.6rem;
    }
    .roles {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 0.6rem;
    }
    .rows {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .entry {
      padding: 0.85rem 1rem;
    }
    @media (max-width: 1100px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 600px) {
      .panel {
        padding: 1.25rem;
      }
      .names {
        grid-template-columns: 1fr;
      }
    }
  `,
  template: `
    <div class="space-head">
      <div>
        <h1 class="space-title">Détail et édition d’un compte</h1>
        <p class="space-lead">Identité, rôles, statut et historique du compte.</p>
      </div>
      <a class="btn btn-secondary btn-sm" routerLink="/espace/admin/utilisateurs"><app-icon name="arrow-left" [size]="14" /> Retour aux comptes</a>
    </div>

    <app-data-zone [status]="account.status()" emptyMessage="Ce compte est indisponible." [errorMessage]="loadError()" (retry)="account.load()">
      <div zone-skeleton>
        <app-skeleton height="96px" radius="var(--radius-lg)" />
        <div class="layout" style="margin-top: 2rem">
          <app-skeleton height="420px" radius="20px" />
          <app-skeleton height="240px" radius="20px" />
        </div>
      </div>

      @if (account.data(); as user) {
        <div class="glass-card glass-card-static identity">
          <div class="avatar" aria-hidden="true">{{ initials() }}</div>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2" style="margin-bottom: 0.25rem">
              <h2 style="font-size: 1.3rem; font-weight: 800">{{ user.prenom }} {{ user.nom }}</h2>
              @for (role of sorted(); track role) {
                <app-badge [variant]="roleBadges[role]">{{ roleLabels[role] }}</app-badge>
              }
            </div>
            <span style="font-size: 0.88rem; color: var(--text-muted); overflow-wrap: anywhere">{{ user.email }}</span>
          </div>
        </div>

        <div class="layout">
          <form class="glass-panel panel" [formGroup]="form" (ngSubmit)="save(user)" novalidate>
            <div class="names">
              <app-field label="Prénom" [required]="true" [serverError]="serverErrors()['prenom'] ?? null">
                <input appControl type="text" formControlName="prenom" />
              </app-field>
              <app-field label="Nom" [required]="true" [serverError]="serverErrors()['nom'] ?? null">
                <input appControl type="text" formControlName="nom" />
              </app-field>
            </div>
            <div class="form-group">
              <label class="form-label" for="courriel-compte">Adresse électronique</label>
              <input id="courriel-compte" class="form-input" type="email" [value]="user.email" readonly />
            </div>
            <app-field label="Filière d’études" hint="Saisie libre." [serverError]="serverErrors()['filiere'] ?? null">
              <input appControl type="text" formControlName="filiere" />
            </app-field>

            <fieldset [disabled]="isSelf()">
              <legend class="form-label">Rôles sur la plateforme</legend>
              <div class="roles">
                @for (role of roleChoices(); track role) {
                  <label class="form-check">
                    <input type="checkbox" [checked]="selectedRoles().has(role)" [disabled]="!assignable.includes(role)" (change)="toggleRole(role, $event)" />
                    <span>{{ roleLabels[role] }}</span>
                  </label>
                }
              </div>
              @if (isSelf()) {
                <span class="form-hint">Vous ne pouvez pas modifier vos propres rôles.</span>
              }
              <span class="form-error empty:hidden" aria-live="polite">{{ rolesError() }}</span>
            </fieldset>

            <div class="form-group">
              <span class="form-label">Statut</span>
              <div class="flex flex-wrap items-center gap-3">
                <app-badge [variant]="statutBadges[user.statut]">{{ statutLabels[user.statut] }}</app-badge>
                @if (user.verrouille) {
                  <app-badge variant="amber">Verrouillé après des échecs de connexion</app-badge>
                }
              </div>
            </div>
            @if (user.createdAt) {
              <div class="form-group">
                <label class="form-label" for="creation-compte">Date de création du compte</label>
                <input id="creation-compte" class="form-input" type="text" [value]="(user.createdAt | frDate: 'long') + ', ' + (user.createdAt | frDate: 'heure')" readonly />
              </div>
            }

            <div aria-live="assertive">
              @if (error(); as failure) {
                <p class="form-error" role="alert" style="margin-bottom: 1rem">{{ failure }}</p>
              }
            </div>

            <div class="flex flex-wrap gap-3">
              <button appBtn type="submit" [loading]="pending() === 'save'">Enregistrer les modifications</button>
              @if (!isSelf()) {
                @if (user.verrouille) {
                  <button appBtn variant="secondary" type="button" [loading]="pending() === 'unlock'" (click)="unlock(user)">Déverrouiller</button>
                }
                @if (user.statut === 'SUSPENDU') {
                  <button appBtn variant="secondary" type="button" [loading]="pending() === 'status'" (click)="setStatus(user, 'ACTIF')">Réactiver</button>
                } @else {
                  <button appBtn variant="danger" type="button" [loading]="pending() === 'status'" (click)="setStatus(user, 'SUSPENDU')">Suspendre</button>
                }
              }
            </div>
          </form>

          <section class="glass-panel panel" aria-labelledby="titre-historique">
            <h2 id="titre-historique" style="font-size: 1.1rem; font-weight: 700; margin-bottom: 1.25rem">Historique d’activité</h2>
            <app-data-zone [status]="history.status()" emptyMessage="Aucune action n’est journalisée pour ce compte." emptyIcon="clipboard" (retry)="history.load()">
              <div zone-skeleton class="rows">
                <app-skeleton height="56px" radius="var(--radius-lg)" />
                <app-skeleton height="56px" radius="var(--radius-lg)" />
              </div>
              <ul class="rows">
                @for (entry of history.data() ?? []; track entry.id) {
                  <li class="glass-card glass-card-static entry">
                    <strong style="font-size: 0.88rem; display: block">{{ entry.dateAction | frDate: 'court' }} : {{ entry.action }}</strong>
                    @if (entry.description) {
                      <span style="font-size: 0.78rem; color: var(--text-muted)">{{ entry.description }}</span>
                    }
                  </li>
                }
              </ul>
            </app-data-zone>
          </section>
        </div>
      }
    </app-data-zone>
  `,
})
export class UserDetailPage {
  readonly id = input.required<string>();

  private readonly api = inject(AdminApi);
  private readonly auth = inject(AuthStore);
  private readonly toasts = inject(ToastService);
  private readonly dialogs = inject(DialogService);
  private readonly breadcrumb = inject(BreadcrumbService);

  protected readonly roleLabels = ROLE_LABELS;
  protected readonly roleBadges = ROLE_BADGES;
  protected readonly statutLabels = STATUT_LABELS;
  protected readonly statutBadges = STATUT_BADGES;
  protected readonly assignable = assignableRoles(this.auth.user()?.roles ?? []);

  protected readonly form = new FormGroup({
    prenom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)] }),
    nom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)] }),
    filiere: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
  });
  protected readonly selectedRoles = signal<ReadonlySet<Role>>(new Set());
  protected readonly rolesError = signal('');

  protected readonly account = new ResourceState<CompteUtilisateur>(() => this.api.compte(Number(this.id())).pipe(tap((user) => this.adopt(user))));
  protected readonly history = new ResourceState<readonly EntreeJournal[]>(() => {
    const email = this.account.data()?.email ?? '';
    return this.api.journal({ size: HISTORY_LIMIT, sort: 'dateAction,desc', utilisateur: email }).pipe(map((page) => page.content.filter((entry) => entry.utilisateurEmail === email)));
  });
  protected readonly initials = computed(() => {
    const user = this.account.data();
    return user ? initialsOf(`${user.prenom} ${user.nom}`) : '';
  });
  protected readonly sorted = computed(() => sortRoles(this.account.data()?.roles ?? []));
  protected readonly isSelf = computed(() => this.account.data()?.id === this.auth.user()?.id);
  /** Les rôles déjà détenus restent visibles même s'ils ne sont pas attribuables par l'utilisateur courant. */
  protected readonly roleChoices = computed(() => ROLE_PRIORITY.filter((role) => this.assignable.includes(role) || (this.account.data()?.roles ?? []).includes(role)).reverse());
  protected readonly loadError = computed(() => (this.account.error()?.kind === 'not-found' ? 'Ce compte est introuvable.' : null));

  protected readonly pending = signal<'save' | 'status' | 'unlock' | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string>>({});

  constructor() {
    inject(SeoService).apply({ title: 'Compte utilisateur', noindex: true });
    const a = toObservable(this.id).subscribe(() => this.account.load());
    const b = toObservable(this.account.data).subscribe((user) => {
      if (user) this.history.load();
    });
    inject(DestroyRef).onDestroy(() => {
      a.unsubscribe();
      b.unsubscribe();
      this.account.destroy();
      this.history.destroy();
    });
  }

  private adopt(user: CompteUtilisateur): void {
    this.form.reset({ prenom: user.prenom, nom: user.nom, filiere: user.filiere ?? '' });
    this.selectedRoles.set(new Set(user.roles));
    this.rolesError.set('');
    this.breadcrumb.set([{ label: 'Utilisateurs', route: '/espace/admin/utilisateurs' }, { label: `${user.prenom} ${user.nom}` }]);
  }

  protected toggleRole(role: Role, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedRoles.update((current) => {
      const next = new Set(current);
      if (checked) next.add(role);
      else next.delete(role);
      return next;
    });
    this.rolesError.set('');
  }

  protected save(user: CompteUtilisateur): void {
    revealErrors(this.form);
    const roles = ROLE_PRIORITY.filter((role) => this.selectedRoles().has(role));
    this.rolesError.set(roles.length === 0 ? 'Attribuez au moins un rôle.' : '');
    if (this.form.invalid || roles.length === 0 || this.pending()) return;
    const value = this.form.getRawValue();
    const rolesChanged = !this.isSelf() && (roles.length !== user.roles.length || roles.some((role) => !user.roles.includes(role)));
    this.pending.set('save');
    this.error.set(null);
    this.serverErrors.set({});
    this.api.modifierCompte(user.id, { prenom: normalizeSpaces(value.prenom), nom: normalizeSpaces(value.nom), filiere: normalizeSpaces(value.filiere) }).subscribe({
      next: () => {
        if (!rolesChanged) return this.done('Le compte est mis à jour.');
        this.api.changerRoles(user.id, roles).subscribe({
          next: () => this.done('Le compte et ses rôles sont mis à jour.'),
          error: (failure: unknown) => this.fail(failure),
        });
      },
      error: (failure: unknown) => this.fail(failure),
    });
  }

  protected setStatus(user: CompteUtilisateur, statut: 'ACTIF' | 'SUSPENDU'): void {
    const suspend = statut === 'SUSPENDU';
    this.dialogs
      .confirm({
        title: suspend ? 'Suspendre le compte' : 'Réactiver le compte',
        message: suspend
          ? `Souhaitez-vous suspendre le compte de ${user.prenom} ${user.nom} ? La personne ne pourra plus se connecter.`
          : `Souhaitez-vous réactiver le compte de ${user.prenom} ${user.nom} ?`,
        confirmLabel: suspend ? 'Suspendre' : 'Réactiver',
        danger: suspend,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.pending.set('status');
        this.api.changerStatut(user.id, statut).subscribe({
          next: () => this.done(suspend ? 'Le compte est suspendu.' : 'Le compte est réactivé.'),
          error: (failure: unknown) => this.fail(failure),
        });
      });
  }

  protected unlock(user: CompteUtilisateur): void {
    this.pending.set('unlock');
    this.api.deverrouiller(user.id).subscribe({
      next: () => this.done('Le compte est déverrouillé.'),
      error: (failure: unknown) => this.fail(failure),
    });
  }

  private done(message: string): void {
    this.pending.set(null);
    this.account.refresh();
    this.toasts.success(message);
  }

  private fail(failure: unknown): void {
    this.pending.set(null);
    const apiError = toApiError(failure);
    this.serverErrors.set(apiError.fieldMessages());
    if (apiError.kind !== 'server' && apiError.kind !== 'rate-limit') this.error.set(apiError.userMessage);
  }
}
