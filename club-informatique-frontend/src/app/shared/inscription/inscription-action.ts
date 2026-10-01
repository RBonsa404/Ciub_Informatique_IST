import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Inscription, STATUT_INSCRIPTION_LABELS } from '../../core/api/models';
import { PublicApi } from '../../core/api/public.api';
import { AuthStore } from '../../core/auth/auth.store';
import { FeatureService } from '../../core/config/feature.service';
import { toApiError } from '../../core/http/problem';
import { Button } from '../ui/button/button';
import { DialogService } from '../ui/dialog/confirm-dialog';
import { Icon } from '../ui/icon/icon';
import { ToastService } from '../ui/toast/toast.service';

export type InscriptionTarget = { readonly kind: 'evenement'; readonly id: number } | { readonly kind: 'session'; readonly id: number };

/**
 * Action d'inscription à un événement ou à une session de formation (UC-09).
 * Visiteur : invitation à se connecter. Membre : inscription, liste d'attente, annulation.
 * Les autres rôles (administration, DSI) ne voient aucune action.
 */
@Component({
  selector: 'app-inscription-action',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, Icon],
  template: `
    @if (!auth.isAuthenticated()) {
      @if (authEnabled && !closed()) {
        <a appBtn [size]="size()" routerLink="/connexion" [queryParams]="{ retour: router.url }">
          Se connecter pour participer <app-icon name="arrow-right" [size]="16" />
        </a>
      }
    } @else if (isMember()) {
      <div aria-live="polite" class="flex flex-wrap items-center gap-3">
        @if (loading()) {
          <button appBtn [size]="size()" type="button" [loading]="true" disabled>Chargement</button>
        } @else if (current(); as inscription) {
          <span class="badge" [class]="inscription.statut === 'CONFIRMEE' ? 'badge-success' : 'badge-amber'">
            <app-icon [name]="inscription.statut === 'CONFIRMEE' ? 'check-circle' : 'clock'" [size]="14" />
            {{ labels[inscription.statut] }}
          </span>
          <button appBtn variant="secondary" size="sm" type="button" [loading]="pending()" (click)="cancel(inscription)">Annuler mon inscription</button>
        } @else if (closed()) {
          <span class="badge badge-neutral">Inscriptions closes</span>
        } @else {
          <button appBtn [size]="size()" type="button" [loading]="pending()" (click)="register()">
            {{ full() ? 'Rejoindre la liste d’attente' : 'Participer' }} <app-icon name="arrow-right" [size]="16" />
          </button>
        }
      </div>
    }
  `,
})
export class InscriptionAction {
  readonly target = input.required<InscriptionTarget>();
  /** Aucune place restante : l'inscription se fait en liste d'attente. */
  readonly full = input(false);
  /** Événement passé, session terminée ou annulée. */
  readonly closed = input(false);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  /** Émis après une inscription ou une annulation : le parent rafraîchit les places restantes. */
  readonly changed = output<void>();

  private readonly api = inject(PublicApi);
  private readonly toasts = inject(ToastService);
  private readonly dialogs = inject(DialogService);
  protected readonly auth = inject(AuthStore);
  protected readonly router = inject(Router);
  protected readonly authEnabled = inject(FeatureService).isEnabled('authentification');
  protected readonly labels = STATUT_INSCRIPTION_LABELS;

  protected readonly isMember = computed(() => this.auth.hasAnyRole(['MEMBRE']));
  protected readonly loading = signal(false);
  protected readonly pending = signal(false);
  private readonly inscriptions = signal<readonly Inscription[]>([]);
  protected readonly current = computed(() => {
    const target = this.target();
    return (
      this.inscriptions().find(
        (i) => i.statut !== 'ANNULEE' && (target.kind === 'evenement' ? i.evenementId === target.id : i.sessionFormationId === target.id),
      ) ?? null
    );
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    effect(() => {
      this.target();
      if (!this.isMember()) return;
      untracked(() => {
        this.loading.set(true);
        const subscription = this.api.mesInscriptions({ size: 200 }).subscribe({
          next: (page) => {
            this.inscriptions.set(page.content);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
        destroyRef.onDestroy(() => subscription.unsubscribe());
      });
    });
  }

  protected register(): void {
    const target = this.target();
    const request: Observable<Inscription> = target.kind === 'evenement' ? this.api.inscrireEvenement(target.id) : this.api.inscrireSession(target.id);
    this.pending.set(true);
    request.subscribe({
      next: (inscription) => {
        this.pending.set(false);
        this.inscriptions.update((list) => [...list, inscription]);
        this.changed.emit();
        this.toasts.success(inscription.statut === 'LISTE_ATTENTE' ? 'Vous êtes inscrit sur la liste d’attente.' : 'Votre inscription est confirmée.');
      },
      error: (failure: unknown) => {
        this.pending.set(false);
        const error = toApiError(failure);
        if (error.kind === 'conflict') this.toasts.info('Vous êtes déjà inscrit.');
        else if (error.kind === 'validation') this.toasts.danger(error.userMessage);
        else if (error.kind !== 'server' && error.kind !== 'rate-limit') this.toasts.danger(error.userMessage);
      },
    });
  }

  protected cancel(inscription: Inscription): void {
    this.dialogs
      .confirm({ title: 'Annuler l’inscription', message: 'Souhaitez-vous annuler votre inscription ? Votre place sera libérée.', confirmLabel: 'Annuler l’inscription', cancelLabel: 'Conserver', danger: true })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.pending.set(true);
        this.api.annulerInscription(inscription.id).subscribe({
          next: () => {
            this.pending.set(false);
            this.inscriptions.update((list) => list.filter((i) => i.id !== inscription.id));
            this.changed.emit();
            this.toasts.success('Votre inscription est annulée.');
          },
          error: (failure: unknown) => {
            this.pending.set(false);
            const error = toApiError(failure);
            if (error.kind !== 'server' && error.kind !== 'rate-limit') this.toasts.danger(error.userMessage);
          },
        });
      });
  }
}
