import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PublicApi } from '../../core/api/public.api';
import { normalizeSpaces } from '../../core/auth/password-policy';
import { SITE } from '../../core/config/site';
import { toApiError } from '../../core/http/problem';
import { SeoService } from '../../core/seo/seo.service';
import { Button } from '../../shared/ui/button/button';
import { Field, FieldControl, revealErrors } from '../../shared/ui/field/field';
import { InputGroup } from '../../shared/ui/field/input-group';
import { BrandIcon, Icon } from '../../shared/ui/icon/icon';
import { BrandName } from '../../shared/ui/icon/icon-names';
import { Checkbox } from '../../shared/ui/toggle/toggle';

const SOCIAL: readonly { name: BrandName; label: string; href: string }[] = [
  { name: 'whatsapp', label: 'WhatsApp', href: SITE.whatsapp.href },
  { name: 'linkedin', label: 'LinkedIn', href: SITE.social.linkedin },
  { name: 'facebook', label: 'Facebook', href: SITE.social.facebook },
  { name: 'tiktok', label: 'TikTok', href: SITE.social.tiktok },
];

const LIMITS = { nom: 100, sujet: 200, message: 4000 } as const;

/**
 * Contact (écran 13). Le message est envoyé au backend, qui l'enregistre et notifie le club.
 * Anti-spam léger : champ piège invisible et durée de saisie transmise au serveur.
 */
@Component({
  selector: 'app-contact-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Button, Icon, BrandIcon, Field, FieldControl, InputGroup, Checkbox],
  styles: `
    .layout {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 3rem;
      align-items: start;
    }
    .emblem {
      width: 180px;
      height: 180px;
      margin-bottom: 2rem;
      background: linear-gradient(135deg, #1d4ed8, #0b1e3f);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 15px 40px rgba(29, 78, 216, 0.3);
      border: 2px solid rgba(56, 189, 248, 0.2);
      color: #38bdf8;
    }
    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .way {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }
    .way-title {
      font-weight: 600;
      font-size: 0.95rem;
    }
    .way-text {
      font-size: 0.85rem;
      color: var(--text-muted);
      overflow-wrap: anywhere;
    }
    .phones {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .phones a {
      display: inline-block;
      min-height: 24px;
      line-height: 24px;
    }
    .trap {
      position: absolute;
      left: -9999px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    }
    .message app-input-group .input-icon {
      top: 1.3rem;
    }
    .result {
      border-left: 4px solid var(--color-success);
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .result.failure {
      border-left-color: var(--color-danger);
    }
    @media (max-width: 1024px) {
      .layout {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
      .emblem {
        display: none;
      }
    }
    @media (max-width: 600px) {
      .row {
        grid-template-columns: 1fr;
        gap: 0;
      }
    }
  `,
  template: `
    <div class="page-section">
      <div class="page-container layout">
        <div>
          <h1 style="font-size: clamp(2.2rem, 4.5vw, 3rem); margin-bottom: 0.75rem">Con<span class="accent">tact</span></h1>
          <p style="font-size: 1.3rem; font-weight: 600; color: var(--text-primary); font-family: var(--font-heading); line-height: 1.4; margin-bottom: 1rem">
            Échangeons<br />en toute simplicité
          </p>
          <p style="font-size: 0.95rem; color: var(--text-muted); margin-bottom: 2rem; max-width: 450px">
            Une question, une idée ou une demande d’information&nbsp;? Écrivez-nous : votre message est transmis au bureau du club.
          </p>
          <div class="emblem" aria-hidden="true"><app-icon name="message-circle" [size]="72" [strokeWidth]="1.5" /></div>

          <div aria-live="polite">
            @if (sent()) {
              <div class="glass-card glass-card-static result" role="status">
                <div class="flex items-center gap-3" style="margin-bottom: 0.5rem; color: var(--badge-success-text)">
                  <app-icon name="check-circle" [size]="20" />
                  <strong>Message envoyé</strong>
                </div>
                <p style="font-size: 0.9rem">Votre message a bien été transmis au club. Un accusé de réception vous est adressé par courriel.</p>
              </div>
            }
            @if (error(); as failure) {
              <div class="glass-card glass-card-static result failure" role="alert">
                <div class="flex items-center gap-3" style="margin-bottom: 0.5rem; color: var(--badge-danger-text)">
                  <app-icon name="alert-circle" [size]="20" />
                  <strong>Envoi impossible</strong>
                </div>
                <p style="font-size: 0.9rem">{{ failure }}</p>
              </div>
            }
          </div>

          <form class="glass-panel" style="padding: clamp(1.25rem, 4vw, 2rem)" [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="row">
              <app-field label="Nom complet" [labelHidden]="true" [required]="true" [serverError]="serverErrors()['nom'] ?? null">
                <app-input-group icon="user">
                  <input appControl type="text" formControlName="nom" placeholder="Nom complet *" autocomplete="name" [attr.maxlength]="limits.nom" />
                </app-input-group>
              </app-field>
              <app-field label="Adresse électronique" [labelHidden]="true" [required]="true" [serverError]="serverErrors()['email'] ?? null">
                <app-input-group icon="mail">
                  <input appControl type="email" formControlName="email" placeholder="Adresse électronique *" autocomplete="email" inputmode="email" />
                </app-input-group>
              </app-field>
            </div>
            <app-field label="Objet" [labelHidden]="true" [required]="true" [serverError]="serverErrors()['sujet'] ?? null">
              <app-input-group icon="target">
                <input appControl type="text" formControlName="sujet" placeholder="Objet *" [attr.maxlength]="limits.sujet" />
              </app-input-group>
            </app-field>
            <app-field class="message" label="Message" [labelHidden]="true" [required]="true" [serverError]="serverErrors()['message'] ?? null">
              <app-input-group icon="message-square">
                <textarea appControl formControlName="message" rows="5" placeholder="Message *" style="padding-left: 2.8rem" [attr.maxlength]="limits.message"></textarea>
              </app-input-group>
            </app-field>

            <div class="trap" aria-hidden="true">
              <label for="site-web">Ne pas remplir ce champ</label>
              <input id="site-web" type="text" formControlName="siteWeb" tabindex="-1" autocomplete="off" />
            </div>

            <app-checkbox formControlName="consentement" [invalid]="consentMissing()">
              J’accepte que mes données soient utilisées pour répondre à ma demande, conformément à la
              <a routerLink="/confidentialite" style="text-decoration: underline">politique de confidentialité</a>.
            </app-checkbox>
            <div class="form-error empty:hidden" aria-live="polite">{{ consentMissing() ? 'Votre accord est nécessaire pour envoyer le message.' : '' }}</div>

            <button appBtn size="lg" type="submit" [block]="true" style="margin-top: 1.25rem; background: linear-gradient(90deg, #0055ff, #0088ff)" [loading]="pending()">
              Envoyer <app-icon name="send" [size]="18" />
            </button>
          </form>
        </div>

        <aside class="glass-panel" style="padding: 2rem" aria-labelledby="titre-moyens">
          <h2 id="titre-moyens" style="font-size: 1.15rem; margin-bottom: 1.5rem">Autres moyens de contact</h2>
          <div class="flex flex-col gap-6">
            <div class="way">
              <div class="icon-disc" style="border: 0"><app-icon name="map-pin" /></div>
              <div>
                <div class="way-title">{{ site.institution }}</div>
                <div class="way-text">{{ site.city }}, {{ site.country }}</div>
              </div>
            </div>
            <div class="way">
              <div class="icon-disc" style="border: 0"><app-icon name="mail" /></div>
              <div>
                <div class="way-title">Courriel</div>
                <a class="way-text" [href]="'mailto:' + site.email">{{ site.email }}</a>
              </div>
            </div>
            <div class="way">
              <div class="icon-disc" style="border: 0"><app-icon name="phone" /></div>
              <div>
                <div class="way-title">Téléphone</div>
                <ul class="way-text phones">
                  <li>
                    <a [href]="site.whatsapp.href" target="_blank" rel="noopener noreferrer">{{ site.whatsapp.label }}</a> (WhatsApp)
                  </li>
                  @for (phone of site.phones; track phone.href) {
                    <li>
                      <a [href]="phone.href">{{ phone.label }}</a>
                    </li>
                  }
                </ul>
              </div>
            </div>
            <div class="way">
              <div class="icon-disc" style="border: 0"><app-icon name="users" /></div>
              <div>
                <div class="way-title">Réseaux sociaux</div>
                <div class="flex gap-2" style="margin-top: 0.5rem">
                  @for (link of social; track link.name) {
                    <a class="btn btn-secondary btn-icon" [href]="link.href" target="_blank" rel="noopener noreferrer" [attr.aria-label]="link.label + ' (nouvel onglet)'">
                      <app-brand-icon [name]="link.name" [size]="16" />
                    </a>
                  }
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `,
})
export class ContactPage {
  private readonly api = inject(PublicApi);
  protected readonly site = SITE;
  protected readonly social = SOCIAL;
  protected readonly limits = LIMITS;
  private readonly openedAt = Date.now();

  protected readonly form = new FormGroup({
    nom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(LIMITS.nom)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    sujet: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(LIMITS.sujet)] }),
    message: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10), Validators.maxLength(LIMITS.message)] }),
    siteWeb: new FormControl('', { nonNullable: true }),
    consentement: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
  });
  protected readonly pending = signal(false);
  protected readonly sent = signal(false);
  protected readonly submitted = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string>>({});
  private readonly tick = signal(0);

  constructor() {
    inject(SeoService).apply({
      title: 'Contact',
      description: 'Contacter le Club Informatique de l’IST : formulaire, courriel, téléphone et réseaux sociaux.',
      path: '/contact',
    });
    this.form.controls.consentement.valueChanges.subscribe(() => this.tick.update((n) => n + 1));
  }

  protected consentMissing(): boolean {
    this.tick();
    return this.submitted() && this.form.controls.consentement.invalid;
  }

  protected submit(): void {
    this.submitted.set(true);
    revealErrors(this.form);
    if (this.form.invalid || this.pending()) return;

    this.pending.set(true);
    this.sent.set(false);
    this.error.set(null);
    this.serverErrors.set({});
    const value = this.form.getRawValue();
    this.api
      .envoyerContact({
        nom: normalizeSpaces(value.nom),
        email: value.email.trim().toLowerCase(),
        sujet: normalizeSpaces(value.sujet),
        message: value.message.trim(),
        siteWeb: value.siteWeb,
        dureeSaisieMs: Date.now() - this.openedAt,
      })
      .subscribe({
        next: () => {
          this.pending.set(false);
          this.sent.set(true);
          this.submitted.set(false);
          this.form.reset();
        },
        error: (failure: unknown) => {
          this.pending.set(false);
          const apiError = toApiError(failure);
          this.serverErrors.set(apiError.fieldMessages());
          this.error.set(
            apiError.kind === 'rate-limit'
              ? 'Trop de messages envoyés. Réessayez dans quelques minutes.'
              : apiError.kind === 'validation'
                ? 'Certains champs sont invalides. Vérifiez votre saisie.'
                : apiError.userMessage,
          );
        },
      });
  }
}
