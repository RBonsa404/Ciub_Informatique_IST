import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, startWith, tap } from 'rxjs';
import { AdminApi } from '../../core/api/admin.api';
import { PageInfo } from '../../core/api/models';
import { PublicApi } from '../../core/api/public.api';
import { ResourceState } from '../../core/api/resource-state';
import { toApiError } from '../../core/http/problem';
import { SeoService } from '../../core/seo/seo.service';
import { toBlocks } from '../../shared/format/format';
import { Button } from '../../shared/ui/button/button';
import { Field, FieldControl, revealErrors } from '../../shared/ui/field/field';
import { Icon } from '../../shared/ui/icon/icon';
import { DataZone } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';
import { TabItem, Tabs } from '../../shared/ui/tabs/tabs';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { parsePresentation } from '../public/about-pages';

type Slug = 'accueil' | 'presentation';

interface Apercu {
  readonly intro: readonly string[];
  readonly sections: readonly { readonly title: string; readonly paragraphs: readonly string[] }[];
}

const PAGES: readonly (TabItem & { readonly slug: Slug; readonly adresse: string; readonly titreParDefaut: string; readonly aide: string })[] = [
  {
    id: 'accueil',
    slug: 'accueil',
    label: 'Accueil',
    adresse: '/',
    titreParDefaut: 'Accueil',
    aide: 'Texte affiché sous le nom du club, en tête de la page d’accueil. Deux ou trois phrases suffisent. Séparez les paragraphes par une ligne vide.',
  },
  {
    id: 'presentation',
    slug: 'presentation',
    label: 'Présentation',
    adresse: '/presentation',
    titreParDefaut: 'Qui sommes-nous',
    aide: 'Le texte placé avant le premier titre forme l’introduction. Chaque ligne commençant par « # » suivi d’un espace ouvre une carte, avec le texte qui la suit. Séparez les paragraphes par une ligne vide.',
  },
];

/** Aperçu de la structure telle que la page publique l'affichera. */
export function apercu(slug: Slug, contenu: string): Apercu {
  if (slug === 'presentation') return parsePresentation(contenu);
  return { intro: toBlocks(contenu).filter((block) => block.kind === 'paragraph').map((block) => block.text), sections: [] };
}

const nouveauFormulaire = () =>
  new FormGroup({
    titre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(200)] }),
    contenu: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(20000)] }),
  });

/** Textes du site : rédaction des pages d'information publiques (accueil, présentation) par l'administration. */
@Component({
  selector: 'app-site-texts-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Button, Field, FieldControl, Icon, DataZone, Skeleton, Tabs],
  styles: `
    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
      gap: 1.5rem;
      align-items: start;
      margin-top: 1.5rem;
    }
    .panel {
      padding: 2rem;
      border-radius: 20px;
    }
    textarea {
      min-height: 22rem;
      line-height: 1.6;
      resize: vertical;
    }
    .preview h3 {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--accent-active);
      margin: 1.1rem 0 0.4rem;
    }
    .preview p {
      font-size: 0.88rem;
      line-height: 1.6;
      white-space: pre-line;
      margin-bottom: 0.6rem;
    }
    .label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
    }
    .meta {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    @media (max-width: 960px) {
      .layout {
        grid-template-columns: minmax(0, 1fr);
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
        <h1 class="space-title">Textes du site</h1>
        <p class="space-lead">Rédigez les textes des pages d’accueil et de présentation. Ils sont publiés dès l’enregistrement.</p>
      </div>
    </div>

    <app-tabs [tabs]="pages" label="Page à rédiger" [(selected)]="selection" prefix="textes" />

    <div role="tabpanel" [id]="'textes-panneau-' + selection()" [attr.aria-labelledby]="'textes-onglet-' + selection()">
      <app-data-zone [status]="contenus.status()" emptyMessage="" (retry)="contenus.load()">
        <div zone-skeleton class="layout">
          <app-skeleton height="28rem" radius="20px" />
          <app-skeleton height="20rem" radius="20px" />
        </div>

        <div class="layout">
          <section class="glass-panel panel" aria-labelledby="titre-redaction">
            <h2 id="titre-redaction" class="sr-only">Rédaction de la page {{ page().label }}</h2>
            <form [formGroup]="formulaire()" (ngSubmit)="publier()" novalidate>
              <app-field label="Titre" [required]="true" hint="Sert à repérer la page ; le titre affiché en tête de page ne change pas." [serverError]="erreursChamps()['titre'] ?? null">
                <input appControl type="text" formControlName="titre" maxlength="200" />
              </app-field>
              <app-field label="Texte" [required]="true" [hint]="page().aide" [serverError]="erreursChamps()['contenu'] ?? null">
                <textarea appControl formControlName="contenu" rows="16" maxlength="20000"></textarea>
              </app-field>
              <div aria-live="assertive">
                @if (erreur(); as message) {
                  <p class="form-error" role="alert" style="margin-bottom: 1rem">{{ message }}</p>
                }
              </div>
              <div class="flex flex-wrap items-center justify-between gap-3">
                <a [routerLink]="page().adresse" target="_blank" rel="noopener" class="inline-flex items-center gap-2 accent-small" style="font-weight: 600; font-size: 0.9rem">
                  <app-icon name="external-link" [size]="16" /> Voir la page publique<span class="sr-only"> (nouvel onglet)</span>
                </a>
                <div class="flex flex-wrap gap-3">
                  <button appBtn variant="secondary" size="sm" type="button" [disabled]="!formulaire().dirty || envoi()" (click)="annuler()">Annuler les modifications</button>
                  <button appBtn size="sm" type="submit" [loading]="envoi()">Publier</button>
                </div>
              </div>
            </form>
          </section>

          <aside class="glass-panel panel preview" aria-labelledby="titre-apercu">
            <h2 id="titre-apercu" class="label">Aperçu de la structure</h2>
            @if (structure().intro.length === 0 && structure().sections.length === 0) {
              <p class="meta">La page n’affiche aucun texte tant que celui-ci est vide.</p>
            }
            @for (paragraphe of structure().intro; track $index) {
              <p>{{ paragraphe }}</p>
            }
            @for (section of structure().sections; track $index) {
              <h3>{{ section.title }}</h3>
              @for (paragraphe of section.paragraphs; track $index) {
                <p>{{ paragraphe }}</p>
              }
            }
          </aside>
        </div>
      </app-data-zone>
    </div>
  `,
})
export class SiteTextsPage {
  private readonly publicApi = inject(PublicApi);
  private readonly api = inject(AdminApi);
  private readonly toasts = inject(ToastService);

  protected readonly pages = PAGES;
  protected readonly selection = signal<string>('accueil');
  protected readonly page = computed(() => PAGES.find((page) => page.id === this.selection()) ?? PAGES[0]);

  private readonly formulaires: Record<Slug, ReturnType<typeof nouveauFormulaire>> = { accueil: nouveauFormulaire(), presentation: nouveauFormulaire() };
  protected readonly formulaire = computed(() => this.formulaires[this.page().slug]);

  /** Texte saisi, suivi en continu pour l'aperçu. */
  private readonly saisies: Record<Slug, () => string> = {
    accueil: toSignal(this.formulaires.accueil.controls.contenu.valueChanges.pipe(startWith('')), { initialValue: '' }),
    presentation: toSignal(this.formulaires.presentation.controls.contenu.valueChanges.pipe(startWith('')), { initialValue: '' }),
  };
  protected readonly structure = computed(() => apercu(this.page().slug, this.saisies[this.page().slug]()));

  protected readonly envoi = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly erreursChamps = signal<Record<string, string>>({});

  /** Textes enregistrés : point de départ des formulaires et valeur rétablie par « Annuler ». */
  private readonly enregistres: Record<Slug, PageInfo | null> = { accueil: null, presentation: null };

  protected readonly contenus = new ResourceState<Record<Slug, PageInfo>>(() =>
    forkJoin({ accueil: this.publicApi.pageInfo('accueil'), presentation: this.publicApi.pageInfo('presentation') }).pipe(
      // Les formulaires reprennent les textes enregistrés à chaque chargement réussi.
      tap((textes) => this.remplir(textes)),
    ),
  );

  constructor() {
    inject(SeoService).apply({ title: 'Textes du site', noindex: true });
    this.contenus.load();
    inject(DestroyRef).onDestroy(() => this.contenus.destroy());
  }

  private remplir(textes: Record<Slug, PageInfo>): void {
    for (const slug of ['accueil', 'presentation'] as const) {
      this.enregistres[slug] = textes[slug];
      this.retablir(slug);
    }
  }

  private retablir(slug: Slug): void {
    const enregistre = this.enregistres[slug];
    const defaut = PAGES.find((page) => page.slug === slug)!.titreParDefaut;
    this.formulaires[slug].reset({ titre: enregistre?.titre || defaut, contenu: (enregistre?.contenu ?? '').replace(/\\n/g, '\n') });
  }

  protected annuler(): void {
    this.erreur.set(null);
    this.erreursChamps.set({});
    this.retablir(this.page().slug);
  }

  protected publier(): void {
    const slug = this.page().slug;
    const formulaire = this.formulaires[slug];
    revealErrors(formulaire);
    if (formulaire.invalid || this.envoi()) return;
    const valeur = formulaire.getRawValue();
    this.envoi.set(true);
    this.erreur.set(null);
    this.erreursChamps.set({});
    this.api.redigerPage(slug, { titre: valeur.titre.trim(), contenu: valeur.contenu.trim() }).subscribe({
      next: (page) => {
        this.envoi.set(false);
        this.enregistres[slug] = page;
        this.retablir(slug);
        this.toasts.success(`Le texte de la page ${this.page().label} est publié.`);
      },
      error: (failure: unknown) => {
        this.envoi.set(false);
        const apiError = toApiError(failure);
        this.erreursChamps.set(apiError.fieldMessages());
        if (apiError.kind !== 'server' && apiError.kind !== 'rate-limit') this.erreur.set(apiError.userMessage);
      },
    });
  }
}
