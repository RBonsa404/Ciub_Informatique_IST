import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ManagementApi } from '../../core/api/management.api';
import { normalizeSpaces } from '../../core/auth/password-policy';
import { SITE } from '../../core/config/site';
import { toApiError } from '../../core/http/problem';
import { NotificationsStore } from '../../core/notifications/notifications.store';
import { SeoService } from '../../core/seo/seo.service';
import { Button } from '../../shared/ui/button/button';
import { DialogService } from '../../shared/ui/dialog/confirm-dialog';
import { Field, FieldControl, revealErrors } from '../../shared/ui/field/field';
import { Icon } from '../../shared/ui/icon/icon';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { internalPathValidator } from '../../shared/validators';

const LINK_MAX = 500;

/** Composition d'une notification globale (écran 49) : diffusion immédiate à tous les membres actifs, avec aperçu. */
@Component({
  selector: 'app-broadcast-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Button, Icon, Field, FieldControl],
  styles: `
    .layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 2.5rem;
      align-items: start;
    }
    .panel {
      padding: 2rem;
      border-radius: 20px;
    }
    .audience {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      padding: 0.85rem 1rem;
      border-radius: 12px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      font-size: 0.85rem;
      margin-bottom: 1.5rem;
    }
    .audience app-icon {
      color: var(--accent-active);
      margin-top: 0.15rem;
    }
    .preview-label {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      text-align: center;
      margin-bottom: 1rem;
    }
    .phone {
      width: min(100%, 300px);
      margin: 0 auto;
      border: 8px solid #0b1220;
      border-radius: 36px;
      background: linear-gradient(180deg, #0b1e3f, #070d1e);
      padding: 1.25rem 0.85rem 2.5rem;
      min-height: 420px;
      box-shadow: var(--shadow-lg, 0 20px 50px rgba(0, 0, 0, 0.4));
    }
    .notch {
      width: 90px;
      height: 6px;
      border-radius: 999px;
      background: #1e293b;
      margin: 0 auto 1.5rem;
    }
    .bubble {
      background: rgba(255, 255, 255, 0.95);
      color: #0f172a;
      border-radius: 16px;
      padding: 0.85rem;
      overflow-wrap: anywhere;
    }
    .bubble-head {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.72rem;
      margin-bottom: 0.5rem;
      color: #334155;
    }
    .bubble-head img {
      width: 20px;
      height: 20px;
      border-radius: 5px;
    }
    .bubble strong,
    .bubble p {
      color: #0f172a;
    }
    .bubble .placeholder {
      color: #475569;
      font-style: italic;
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
    }
  `,
  template: `
    <div class="space-head">
      <div>
        <h1 class="space-title">Composition d’une notification globale</h1>
        <p class="space-lead">Diffusez une annonce immédiate à l’ensemble des membres du club.</p>
      </div>
    </div>

    <div class="layout">
      <form class="glass-panel panel" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <app-field label="Titre de la notification" [required]="true" [serverError]="serverErrors()['titre'] ?? null">
          <input appControl type="text" formControlName="titre" />
        </app-field>
        <app-field label="Message" [required]="true" [serverError]="serverErrors()['message'] ?? null">
          <textarea appControl rows="5" formControlName="message"></textarea>
        </app-field>
        <app-field
          label="Lien associé"
          hint="Facultatif : page du site à ouvrir depuis la notification, par exemple /evenements."
          [messages]="{ chemin: 'Saisissez un chemin du site commençant par « / ».' }"
          [serverError]="serverErrors()['lien'] ?? null"
        >
          <input appControl type="text" formControlName="lien" />
        </app-field>

        <div class="audience">
          <app-icon name="users" [size]="16" />
          <span>La notification est adressée à tous les membres dont le compte est actif. Elle apparaît aussitôt dans leur centre de notifications.</span>
        </div>

        <div aria-live="assertive">
          @if (error(); as failure) {
            <p class="form-error" role="alert" style="margin-bottom: 1rem">{{ failure }}</p>
          }
        </div>

        <button appBtn size="lg" type="submit" style="max-width: 100%; white-space: normal" [loading]="pending()"><app-icon name="send" [size]="18" /> Envoyer immédiatement</button>
      </form>

      <div aria-hidden="true">
        <div class="preview-label">Aperçu sur téléphone</div>
        <div class="phone">
          <div class="notch"></div>
          <div class="bubble">
            <div class="bubble-head">
              <img src="img/logo-88.webp" alt="" width="20" height="20" />
              <strong style="font-size: 0.75rem">{{ siteName }}</strong>
              <span style="margin-left: auto">Maintenant</span>
            </div>
            @if (preview().titre) {
              <strong style="display: block; font-size: 0.9rem; margin-bottom: 0.25rem">{{ preview().titre }}</strong>
            } @else {
              <strong class="placeholder" style="display: block; font-size: 0.9rem; margin-bottom: 0.25rem">Titre de la notification</strong>
            }
            @if (preview().message) {
              <p style="font-size: 0.8rem; white-space: pre-line">{{ preview().message }}</p>
            } @else {
              <p class="placeholder" style="font-size: 0.8rem">Le message apparaîtra ici.</p>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class BroadcastPage {
  private readonly api = inject(ManagementApi);
  private readonly toasts = inject(ToastService);
  private readonly dialogs = inject(DialogService);
  private readonly notifications = inject(NotificationsStore);

  protected readonly siteName = SITE.shortName;
  protected readonly form = new FormGroup({
    titre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(200)] }),
    message: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lien: new FormControl('', { nonNullable: true, validators: [internalPathValidator, Validators.maxLength(LINK_MAX)] }),
  });
  protected readonly preview = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string>>({});

  constructor() {
    inject(SeoService).apply({ title: 'Notification globale', noindex: true });
  }

  protected submit(): void {
    revealErrors(this.form);
    if (this.form.invalid || this.pending()) return;
    this.dialogs
      .confirm({
        title: 'Envoyer la notification',
        message: 'Souhaitez-vous envoyer cette notification à tous les membres actifs ? Elle ne pourra pas être retirée.',
        confirmLabel: 'Envoyer',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        const value = this.form.getRawValue();
        this.pending.set(true);
        this.error.set(null);
        this.serverErrors.set({});
        this.api.diffuserNotification({ titre: normalizeSpaces(value.titre), message: value.message.trim(), lien: value.lien.trim() || null }).subscribe({
          next: () => {
            this.pending.set(false);
            this.form.reset();
            this.notifications.refresh();
            this.toasts.success('La notification est envoyée aux membres.');
          },
          error: (failure: unknown) => {
            this.pending.set(false);
            const apiError = toApiError(failure);
            this.serverErrors.set(apiError.fieldMessages());
            if (apiError.kind !== 'server' && apiError.kind !== 'rate-limit') this.error.set(apiError.userMessage);
          },
        });
      });
  }
}
