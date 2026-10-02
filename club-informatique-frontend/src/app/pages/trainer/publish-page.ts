import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, map } from 'rxjs';
import { Formation, TYPE_RESSOURCE_LABELS, TypeRessource } from '../../core/api/models';
import { ResourceState } from '../../core/api/resource-state';
import { TrainerApi } from '../../core/api/trainer.api';
import { normalizeSpaces } from '../../core/auth/password-policy';
import { toApiError } from '../../core/http/problem';
import { BreadcrumbService } from '../../core/navigation/breadcrumb.service';
import { SeoService } from '../../core/seo/seo.service';
import { toApiDateTime } from '../../shared/format/format';
import { Button } from '../../shared/ui/button/button';
import { Field, FieldControl, revealErrors } from '../../shared/ui/field/field';
import { DataZone } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { Checkbox } from '../../shared/ui/toggle/toggle';
import { webUrlValidator } from '../../shared/validators';
import { FileUpload } from '../../shared/ui/file/file-upload';

type ItemType = 'DEVOIR' | TypeRessource;

const TYPES: readonly { value: ItemType; label: string }[] = [
  { value: 'DEVOIR', label: 'Devoir' },
  { value: 'SUPPORT_COURS', label: TYPE_RESSOURCE_LABELS.SUPPORT_COURS },
  { value: 'DOCUMENT_PDF', label: TYPE_RESSOURCE_LABELS.DOCUMENT_PDF },
  { value: 'CODE_SOURCE', label: TYPE_RESSOURCE_LABELS.CODE_SOURCE },
  { value: 'VIDEO', label: TYPE_RESSOURCE_LABELS.VIDEO },
  { value: 'LIEN_EXTERNE', label: TYPE_RESSOURCE_LABELS.LIEN_EXTERNE },
];

const URL_MAX = 500;

/** Publication d'un devoir ou d'une ressource (écran 40) pour un cours du formateur. */
@Component({
  selector: 'app-publish-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Button, Field, FieldControl, Checkbox, DataZone, Skeleton, FileUpload],
  styles: `
    .card {
      padding: 2.5rem;
      border-radius: 24px;
      max-width: 850px;
    }
    .row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 0 1.5rem;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      flex-wrap: wrap;
      padding-top: 1.5rem;
      margin-top: 1rem;
      border-top: 1px solid var(--border-subtle);
    }
    @media (max-width: 700px) {
      .card {
        padding: 1.5rem;
      }
      .row {
        grid-template-columns: 1fr;
      }
    }
  `,
  template: `
    <div class="space-head">
      <div>
        <h1 class="space-title">Publication d’un devoir ou d’une ressource</h1>
        <p class="space-lead">Mettez à la disposition des inscrits un énoncé, un support de cours ou un lien utile.</p>
      </div>
    </div>

    <app-data-zone [status]="course.status()" emptyMessage="Ce cours est indisponible." [errorMessage]="loadError()" (retry)="course.load()">
      <div zone-skeleton class="glass-panel card">
        <app-skeleton height="3rem" />
        <div style="margin-top: 1.5rem"><app-skeleton height="3rem" /></div>
        <div style="margin-top: 1.5rem"><app-skeleton height="8rem" /></div>
      </div>

      @if (course.data(); as item) {
        <form class="glass-panel card" [formGroup]="form" (ngSubmit)="submit(item)" novalidate>
          <div class="form-group">
            <label class="form-label" for="cours-associe">Cours associé</label>
            <input id="cours-associe" class="form-input" type="text" [value]="item.titre" readonly />
          </div>

          <div class="row">
            <app-field label="Titre du devoir ou de la ressource" [required]="true" [serverError]="serverErrors()['titre'] ?? null">
              <input appControl type="text" formControlName="titre" />
            </app-field>
            <app-field label="Type d’élément" [required]="true">
              <select appControl formControlName="type">
                @for (type of types; track type.value) {
                  <option [value]="type.value">{{ type.label }}</option>
                }
              </select>
            </app-field>
          </div>

          @if (isDevoir()) {
            <app-field
              label="Date limite de rendu"
              hint="Heure d’Ouagadougou."
              [required]="true"
              [messages]="{ required: 'Indiquez la date limite de rendu.' }"
              [serverError]="serverErrors()['dateLimite'] ?? null"
            >
              <input appControl type="datetime-local" formControlName="dateLimite" />
            </app-field>
          }

          <app-field
            [label]="isDevoir() ? 'Consignes' : 'Description'"
            [required]="isDevoir()"
            [messages]="{ required: 'Décrivez le travail attendu.' }"
            [serverError]="serverErrors()['description'] ?? null"
          >
            <textarea appControl rows="5" formControlName="description"></textarea>
          </app-field>

          <app-file-upload
            [label]="isDevoir() ? 'Fichier du sujet' : 'Fichier joint'"
            [invite]="isDevoir() ? 'Glissez votre énoncé ici ou choisissez-le sur votre appareil.' : 'Glissez votre document ici ou choisissez-le sur votre appareil.'"
            (fileUploaded)="form.controls.adresse.setValue($event.url)"
            (fileRemoved)="form.controls.adresse.setValue('')"
          />

          <app-field
            [label]="isDevoir() ? 'Ou adresse du sujet' : 'Ou adresse du document'"
            [hint]="isDevoir() ? 'Facultatif : lien vers l’énoncé (https://…), si aucun fichier n’est déposé.' : 'Lien vers le document (https://…), si aucun fichier n’est déposé.'"
            [required]="!isDevoir()"
            [messages]="{ adresse: 'Saisissez une adresse complète commençant par http:// ou https://, ou déposez un fichier.', required: 'Déposez un fichier ou indiquez l’adresse du document.' }"
            [serverError]="serverErrors()[isDevoir() ? 'fichierConsigne' : 'urlFichier'] ?? null"
          >
            <input appControl type="text" inputmode="url" formControlName="adresse" />
          </app-field>

          @if (!isDevoir()) {
            <app-checkbox formControlName="estPublique">Rendre cette ressource visible sur la page publique des ressources</app-checkbox>
          }

          <div aria-live="assertive">
            @if (error(); as failure) {
              <p class="form-error" role="alert" style="margin-top: 1rem">{{ failure }}</p>
            }
          </div>

          <div class="actions">
            <a appBtn variant="secondary" [routerLink]="['/espace/formateur/cours', item.id]">Annuler</a>
            <button appBtn type="submit" [loading]="pending()">Publier pour les inscrits</button>
          </div>
        </form>
      }
    </app-data-zone>
  `,
})
export class PublishPage {
  readonly id = input.required<string>();

  private readonly api = inject(TrainerApi);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  private readonly breadcrumb = inject(BreadcrumbService);

  protected readonly types = TYPES;
  protected readonly form = new FormGroup({
    titre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(200)] }),
    type: new FormControl<ItemType>('DEVOIR', { nonNullable: true }),
    dateLimite: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    adresse: new FormControl('', { nonNullable: true, validators: [webUrlValidator, Validators.maxLength(URL_MAX)] }),
    estPublique: new FormControl(false, { nonNullable: true }),
  });
  private readonly type = toSignal(this.form.controls.type.valueChanges, { initialValue: this.form.controls.type.value });
  protected readonly isDevoir = computed(() => this.type() === 'DEVOIR');

  protected readonly course = new ResourceState<Formation>(() => this.api.formation(Number(this.id())));
  protected readonly loadError = computed(() => (this.course.error()?.kind === 'not-found' ? 'Ce cours est introuvable.' : null));
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string>>({});

  constructor() {
    inject(SeoService).apply({ title: 'Publication d’un devoir ou d’une ressource', noindex: true });
    this.applyRules(true);
    const a = this.form.controls.type.valueChanges.subscribe((type) => this.applyRules(type === 'DEVOIR'));
    const b = toObservable(this.id).subscribe(() => this.course.load());
    const c = toObservable(this.course.data).subscribe((item) => {
      if (item) this.breadcrumb.set([{ label: 'Mes cours', route: '/espace/formateur/cours' }, { label: item.titre, route: `/espace/formateur/cours/${item.id}` }, { label: 'Publication' }]);
    });
    inject(DestroyRef).onDestroy(() => {
      a.unsubscribe();
      b.unsubscribe();
      c.unsubscribe();
      this.course.destroy();
    });
  }

  /** Un devoir exige une échéance et des consignes ; une ressource exige une adresse. */
  private applyRules(devoir: boolean): void {
    const { dateLimite, description, adresse } = this.form.controls;
    dateLimite.setValidators(devoir ? [Validators.required] : []);
    description.setValidators(devoir ? [Validators.required] : []);
    adresse.setValidators(devoir ? [webUrlValidator, Validators.maxLength(URL_MAX)] : [Validators.required, webUrlValidator, Validators.maxLength(URL_MAX)]);
    for (const control of [dateLimite, description, adresse]) control.updateValueAndValidity({ emitEvent: false });
  }

  protected submit(course: Formation): void {
    revealErrors(this.form);
    if (this.form.invalid || this.pending()) return;
    const value = this.form.getRawValue();
    const titre = normalizeSpaces(value.titre);
    const adresse = value.adresse.trim();
    const request: Observable<unknown> =
      value.type === 'DEVOIR'
        ? this.api.creerDevoir(course.id, { titre, description: value.description.trim(), dateLimite: toApiDateTime(value.dateLimite), fichierConsigne: adresse || null })
        : this.api.creerRessource({ titre, description: value.description.trim(), type: value.type, urlFichier: adresse, estPublique: value.estPublique, formationId: course.id });

    this.pending.set(true);
    this.error.set(null);
    this.serverErrors.set({});
    request.pipe(map(() => undefined)).subscribe({
      next: () => {
        this.toasts.success(value.type === 'DEVOIR' ? 'Le devoir est publié.' : 'La ressource est publiée.');
        void this.router.navigate(['/espace/formateur/cours', course.id]);
      },
      error: (failure: unknown) => {
        this.pending.set(false);
        const apiError = toApiError(failure);
        this.serverErrors.set(apiError.fieldMessages());
        if (apiError.kind !== 'server' && apiError.kind !== 'rate-limit') this.error.set(apiError.userMessage);
      },
    });
  }
}
