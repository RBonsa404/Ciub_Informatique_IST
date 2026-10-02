import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { tap } from 'rxjs';
import { Page } from '../../core/api/api-client';
import { ManagementApi } from '../../core/api/management.api';
import { Actualite, Categorie, VisibiliteActualite } from '../../core/api/models';
import { PublicApi } from '../../core/api/public.api';
import { ResourceState } from '../../core/api/resource-state';
import { normalizeSpaces } from '../../core/auth/password-policy';
import { FeatureService } from '../../core/config/feature.service';
import { toApiError } from '../../core/http/problem';
import { BreadcrumbService } from '../../core/navigation/breadcrumb.service';
import { SeoService } from '../../core/seo/seo.service';
import { FrDatePipe, safeUrl } from '../../shared/format/format';
import { Badge } from '../../shared/ui/card/card';
import { Button } from '../../shared/ui/button/button';
import { DialogService } from '../../shared/ui/dialog/confirm-dialog';
import { Field, FieldControl, revealErrors } from '../../shared/ui/field/field';
import { Icon } from '../../shared/ui/icon/icon';
import { IconName } from '../../shared/ui/icon/icon-names';
import { Pagination } from '../../shared/ui/pagination/pagination';
import { DataZone } from '../../shared/ui/states/data-zone';
import { Skeleton } from '../../shared/ui/states/states';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { webUrlValidator } from '../../shared/validators';
import { FileUpload } from '../../shared/ui/file/file-upload';
import { EXTENSIONS_IMAGES, estFichierDepose } from '../../core/api/files.api';

type StatusFilter = '' | 'publie' | 'brouillon';
const PAGE_SIZE = 10;

/** Gestion des actualités, liste (écran 43) : toutes les actualités, publication, modification et suppression. */
@Component({
  selector: 'app-news-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Badge, Button, Pagination, DataZone, Skeleton, FrDatePipe],
  styles: `
    .controls {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .controls select {
      width: auto;
      min-width: 180px;
    }
    .panel {
      padding: 1.75rem;
      border-radius: 20px;
      margin-bottom: 1.5rem;
    }
    td.actions {
      white-space: nowrap;
    }
    @media (max-width: 600px) {
      .panel {
        padding: 1rem;
      }
    }
  `,
  template: `
    <div class="space-head">
      <div>
        <h1 class="space-title">Gestion des actualités</h1>
        <p class="space-lead">Rédigez, modifiez et publiez les articles et les annonces du club.</p>
      </div>
      <div class="controls">
        <label class="sr-only" for="filtre-statut">Statut</label>
        <select id="filtre-statut" class="form-select" (change)="setFilter($event)">
          <option value="">Tous les statuts</option>
          <option value="publie">Publié</option>
          <option value="brouillon">Brouillon</option>
        </select>
        <a class="btn btn-amber" routerLink="/espace/gestion/actualites/nouvelle"><app-icon name="plus" [size]="16" /> Nouvelle actualité</a>
      </div>
    </div>

    <app-data-zone [status]="status()" [emptyMessage]="emptyMessage()" emptyIcon="newspaper" (retry)="state.load()">
      <div zone-skeleton class="glass-panel panel">
        <app-skeleton height="2.5rem" />
        <div style="margin-top: 0.75rem"><app-skeleton height="3rem" /></div>
        <div style="margin-top: 0.75rem"><app-skeleton height="3rem" /></div>
        <div style="margin-top: 0.75rem"><app-skeleton height="3rem" /></div>
      </div>

      <div class="glass-panel panel">
        <div class="table-responsive" tabindex="0" role="region" aria-label="Actualités">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">Titre de l’article</th>
                <th scope="col">Auteur</th>
                <th scope="col">Date de publication</th>
                <th scope="col">Statut</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (item of items(); track item.id) {
                <tr>
                  <td style="min-width: 220px"><strong>{{ item.titre }}</strong></td>
                  <td style="white-space: nowrap">{{ item.auteurNom }}</td>
                  <td>
                    @if (item.publie && item.datePublication) {
                      {{ item.datePublication | frDate: 'court' }}
                    } @else {
                      —
                    }
                  </td>
                  <td>
                    <app-badge [variant]="item.publie ? 'success' : 'neutral'">{{ item.publie ? 'Publié' : 'Brouillon' }}</app-badge>
                  </td>
                  <td class="actions">
                    <div class="flex items-center gap-2">
                      <a class="btn btn-primary btn-sm" [routerLink]="['/espace/gestion/actualites', item.id, 'modifier']">Modifier<span class="sr-only"> {{ item.titre }}</span></a>
                      <button appBtn variant="secondary" size="sm" type="button" [loading]="pendingKey() === 'publication-' + item.id" (click)="toggle(item)">
                        {{ item.publie ? 'Dépublier' : 'Publier' }}<span class="sr-only"> {{ item.titre }}</span>
                      </button>
                      <button
                        appBtn
                        variant="ghost"
                        size="sm"
                        [iconOnly]="true"
                        type="button"
                        [attr.aria-label]="'Supprimer ' + item.titre"
                        [loading]="pendingKey() === 'suppression-' + item.id"
                        (click)="remove(item)"
                      >
                        <app-icon name="trash-2" [size]="16" />
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
      <app-pagination [page]="page()" [totalPages]="totalPages()" label="Pages des actualités" (pageChange)="goTo($event)" />
    </app-data-zone>
  `,
})
export class NewsListPage {
  private readonly api = inject(ManagementApi);
  private readonly toasts = inject(ToastService);
  private readonly dialogs = inject(DialogService);

  protected readonly filter = signal<StatusFilter>('');
  protected readonly page = signal(0);
  protected readonly pendingKey = signal<string | null>(null);

  protected readonly state = new ResourceState<Page<Actualite>>(() => this.api.actualites({ page: this.page(), size: PAGE_SIZE, sort: 'createdAt,desc', publie: this.wanted() }));
  protected readonly items = computed(() => this.state.data()?.content ?? []);
  protected readonly status = computed(() => (this.state.status() === 'ready' && this.items().length === 0 ? 'empty' : this.state.status()));
  protected readonly totalPages = computed(() => this.state.data()?.totalPages ?? 0);
  protected readonly emptyMessage = computed(() =>
    this.filter() === 'publie' ? 'Aucune actualité n’est publiée.' : this.filter() === 'brouillon' ? 'Aucune actualité n’est en brouillon.' : 'Aucune actualité n’a encore été rédigée.',
  );

  constructor() {
    inject(SeoService).apply({ title: 'Gestion des actualités', noindex: true });
    this.state.load();
    inject(DestroyRef).onDestroy(() => this.state.destroy());
  }

  private wanted(): boolean | null {
    return this.filter() === '' ? null : this.filter() === 'publie';
  }

  protected setFilter(event: Event): void {
    this.filter.set((event.target as HTMLSelectElement).value as StatusFilter);
    this.page.set(0);
    this.state.load();
  }

  protected goTo(page: number): void {
    this.page.set(page);
    this.state.load();
  }

  protected toggle(item: Actualite): void {
    if (this.pendingKey()) return;
    this.pendingKey.set(`publication-${item.id}`);
    this.api.definirPublication(item.id, !item.publie).subscribe({
      next: (updated) => {
        this.pendingKey.set(null);
        this.state.refresh();
        this.toasts.success(updated.publie ? 'L’actualité est publiée.' : 'L’actualité est retirée du site.');
      },
      error: (failure: unknown) => this.fail(failure),
    });
  }

  protected remove(item: Actualite): void {
    this.dialogs
      .confirm({ title: 'Supprimer l’actualité', message: `Souhaitez-vous supprimer l’actualité « ${item.titre} » ? Cette action est définitive.`, confirmLabel: 'Supprimer', danger: true })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.pendingKey.set(`suppression-${item.id}`);
        this.api.supprimerActualite(item.id).subscribe({
          next: () => {
            this.pendingKey.set(null);
            this.state.load();
            this.toasts.success('L’actualité est supprimée.');
          },
          error: (failure: unknown) => this.fail(failure),
        });
      });
  }

  private fail(failure: unknown): void {
    this.pendingKey.set(null);
    const error = toApiError(failure);
    if (error.kind !== 'server' && error.kind !== 'rate-limit') this.toasts.danger(error.userMessage);
  }
}

interface BlockTool {
  readonly icon: IconName;
  readonly label: string;
  /** Texte inséré dans le contenu, au format lu par la page de l'article. */
  readonly snippet: string;
}

const BLOCKS: readonly BlockTool[] = [
  { icon: 'file-text', label: 'Paragraphe', snippet: 'Nouveau paragraphe.' },
  { icon: 'tag', label: 'Titre de section', snippet: '# Titre de la section' },
  { icon: 'message-square', label: 'Citation', snippet: '> Texte de la citation' },
];

const RESUME_MAX = 500;
const URL_MAX = 500;

/** Ajoute un bloc à la fin du contenu, séparé par une ligne vide. */
export function appendBlock(content: string, snippet: string): string {
  const base = content.replace(/\s+$/, '');
  return base ? `${base}\n\n${snippet}` : snippet;
}

/** Éditeur d'actualité (écran 44, décision D-02) : texte structuré, image de couverture, paramètres de publication. */
@Component({
  selector: 'app-news-editor-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Icon, Button, Field, FieldControl, DataZone, Skeleton, FileUpload],
  styles: `
    .layout {
      display: grid;
      grid-template-columns: 220px 1fr 280px;
      gap: 1.5rem;
      align-items: start;
    }
    .panel {
      padding: 1.5rem;
      border-radius: 20px;
    }
    .panel h2 {
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }
    .tools {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .tool {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.7rem 0.85rem;
      width: 100%;
      text-align: left;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-primary);
      cursor: pointer;
    }
    .tool app-icon {
      color: var(--accent-active);
    }
    .cover {
      width: 100%;
      max-height: 220px;
      object-fit: cover;
      border-radius: 12px;
      margin-bottom: 1.25rem;
      border: 1px solid var(--border-subtle);
    }
    .title-input {
      font-size: 1.25rem;
      font-weight: 700;
    }
    .head-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    @media (max-width: 1200px) {
      .layout {
        grid-template-columns: 1fr 280px;
      }
      .palette {
        grid-column: 1 / -1;
      }
      .tools {
        flex-direction: row;
        flex-wrap: wrap;
      }
      .tool {
        width: auto;
      }
    }
    @media (max-width: 800px) {
      .layout {
        grid-template-columns: 1fr;
      }
      .panel {
        padding: 1.25rem;
      }
    }
  `,
  template: `
    <form [formGroup]="form" (ngSubmit)="submit(true)" novalidate>
      <div class="space-head">
        <div>
          <h1 class="space-title">{{ editing() ? 'Modifier une actualité' : 'Nouvelle actualité' }}</h1>
          <p class="space-lead">Rédigez l’article, structurez-le par blocs, puis choisissez sa diffusion.</p>
        </div>
        <div class="head-actions">
          <a appBtn variant="ghost" routerLink="/espace/gestion/actualites">Annuler</a>
          <button appBtn variant="secondary" type="button" [loading]="pending() === 'brouillon'" [disabled]="status() !== 'ready'" (click)="submit(false)">Enregistrer le brouillon</button>
          <button appBtn variant="amber" type="submit" [loading]="pending() === 'publication'" [disabled]="status() !== 'ready'">Publier</button>
        </div>
      </div>

      <app-data-zone [status]="status()" emptyMessage="Cette actualité est indisponible." [errorMessage]="loadError()" (retry)="article.load()">
        <div zone-skeleton class="layout">
          <app-skeleton height="200px" radius="20px" />
          <app-skeleton height="420px" radius="20px" />
          <app-skeleton height="260px" radius="20px" />
        </div>

        <div class="layout">
          <section class="glass-panel panel palette" aria-labelledby="titre-blocs">
            <h2 id="titre-blocs">Blocs disponibles</h2>
            <div class="tools">
              @for (block of blocks; track block.label) {
                <button type="button" class="glass-card tool" (click)="insert(block)">
                  <app-icon [name]="block.icon" [size]="16" /> {{ block.label }}
                </button>
              }
            </div>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 1rem">Chaque bloc est ajouté à la fin du contenu. Séparez les blocs par une ligne vide.</p>
          </section>

          <section class="glass-panel panel" aria-label="Contenu de l’article">
            @if (coverUrl(); as cover) {
              <img class="cover" [src]="cover" alt="" />
            }
            <app-field label="Titre" [required]="true" [serverError]="serverErrors()['titre'] ?? null">
              <input appControl class="title-input" type="text" formControlName="titre" />
            </app-field>
            <app-field label="Résumé" [hint]="resumeHint" [serverError]="serverErrors()['resume'] ?? null">
              <textarea appControl rows="2" formControlName="resume"></textarea>
            </app-field>
            <app-field label="Contenu" [required]="true" [serverError]="serverErrors()['contenu'] ?? null">
              <textarea #content appControl rows="14" formControlName="contenu"></textarea>
            </app-field>
            <div aria-live="assertive">
              @if (error(); as failure) {
                <p class="form-error" role="alert">{{ failure }}</p>
              }
            </div>
          </section>

          <section class="glass-panel panel" aria-labelledby="titre-parametres">
            <h2 id="titre-parametres">Paramètres</h2>
            @if (membersOnlyEnabled) {
              <app-field label="Visibilité">
                <select appControl formControlName="visibilite">
                  <option value="PUBLIC">Tout le monde (site public)</option>
                  <option value="MEMBRES">Membres connectés uniquement</option>
                </select>
              </app-field>
            }
            <app-field label="Catégorie">
              <select appControl formControlName="categorieId">
                <option [ngValue]="null">Aucune catégorie</option>
                @for (categorie of categories(); track categorie.id) {
                  <option [ngValue]="categorie.id">{{ categorie.nom }}</option>
                }
              </select>
            </app-field>
            <app-field
              label="Image de couverture"
              hint="Facultatif : adresse web de l’image (https://…), ou image déposée ci-dessous."
              [messages]="{ adresse: 'Saisissez une adresse complète commençant par http:// ou https://, ou déposez une image.' }"
              [serverError]="serverErrors()['image'] ?? null"
            >
              <input appControl type="text" inputmode="url" formControlName="image" />
            </app-field>
            <app-file-upload
              label="Déposer une image de couverture"
              invite="Glissez l’image ici ou choisissez-la sur votre appareil."
              [extensions]="imageExtensions"
              (fileUploaded)="form.controls.image.setValue($event.url)"
              (fileRemoved)="form.controls.image.setValue('')"
            />
          </section>
        </div>
      </app-data-zone>
    </form>
  `,
})
export class NewsEditorPage {
  /** Paramètre de route : absent à la création. */
  readonly id = input<string>();

  private readonly api = inject(ManagementApi);
  private readonly publicApi = inject(PublicApi);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly contentArea = viewChild<ElementRef<HTMLTextAreaElement>>('content');

  protected readonly blocks = BLOCKS;
  protected readonly resumeHint = `Facultatif, ${RESUME_MAX} caractères au maximum. Affiché dans les listes.`;
  protected readonly membersOnlyEnabled = inject(FeatureService).isEnabled('publications-membres');
  protected readonly editing = computed(() => !!this.id());

  protected readonly form = new FormGroup({
    titre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(200)] }),
    resume: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(RESUME_MAX)] }),
    contenu: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    visibilite: new FormControl<VisibiliteActualite>('PUBLIC', { nonNullable: true }),
    categorieId: new FormControl<number | null>(null),
    image: new FormControl('', { nonNullable: true, validators: [webUrlValidator, Validators.maxLength(URL_MAX)] }),
  });
  private readonly image = toSignal(this.form.controls.image.valueChanges, { initialValue: '' });
  /** Aperçu d'une image externe seulement : une image déposée n'est lisible qu'une fois l'actualité publiée. */
  protected readonly coverUrl = computed(() => {
    const adresse = this.form.controls.image.valid ? safeUrl(this.image()) : null;
    return adresse && !estFichierDepose(adresse) ? adresse : null;
  });
  protected readonly imageExtensions = EXTENSIONS_IMAGES;

  private readonly categoriesState = new ResourceState<readonly Categorie[]>(() => this.publicApi.categories());
  protected readonly categories = computed(() => this.categoriesState.data() ?? []);
  protected readonly article = new ResourceState<Actualite>(() =>
    this.api.actualite(Number(this.id())).pipe(
      tap((item) => {
        this.form.reset({
          titre: item.titre,
          resume: item.resume ?? '',
          contenu: item.contenu,
          visibilite: item.visibilite ?? 'PUBLIC',
          categorieId: item.categorieId ?? null,
          image: item.image ?? '',
        });
        this.breadcrumb.set([{ label: 'Actualités', route: '/espace/gestion/actualites' }, { label: item.titre }]);
      }),
    ),
  );
  protected readonly status = computed(() => (this.editing() ? this.article.status() : 'ready'));
  protected readonly loadError = computed(() => (this.article.error()?.kind === 'not-found' ? 'Cette actualité est introuvable.' : null));

  protected readonly pending = signal<'brouillon' | 'publication' | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string>>({});

  constructor() {
    const seo = inject(SeoService);
    this.categoriesState.load();
    const subscription = toObservable(this.id).subscribe((id) => {
      seo.apply({ title: id ? 'Modifier une actualité' : 'Nouvelle actualité', noindex: true });
      if (id) this.article.load();
    });
    inject(DestroyRef).onDestroy(() => {
      subscription.unsubscribe();
      this.article.destroy();
      this.categoriesState.destroy();
    });
  }

  protected insert(block: BlockTool): void {
    const control = this.form.controls.contenu;
    control.setValue(appendBlock(control.value, block.snippet));
    control.markAsDirty();
    const area = this.contentArea()?.nativeElement;
    if (!area) return;
    area.focus();
    // Le texte d'exemple du bloc est sélectionné pour être remplacé à la frappe.
    const start = control.value.length - block.snippet.replace(/^[#>]\s/, '').length;
    area.setSelectionRange(start, control.value.length);
  }

  protected submit(publish: boolean): void {
    revealErrors(this.form);
    if (this.form.invalid || this.pending()) return;
    const value = this.form.getRawValue();
    const payload = {
      titre: normalizeSpaces(value.titre),
      resume: value.resume.trim(),
      contenu: value.contenu.trim(),
      image: value.image.trim() || null,
      categorieId: value.categorieId,
      publie: publish,
      visibilite: value.visibilite,
    };
    const id = this.id();
    this.pending.set(publish ? 'publication' : 'brouillon');
    this.error.set(null);
    this.serverErrors.set({});
    (id ? this.api.modifierActualite(Number(id), payload) : this.api.creerActualite(payload)).subscribe({
      next: () => {
        this.toasts.success(publish ? 'L’actualité est publiée.' : 'Le brouillon est enregistré.');
        void this.router.navigateByUrl('/espace/gestion/actualites');
      },
      error: (failure: unknown) => {
        this.pending.set(null);
        const apiError = toApiError(failure);
        this.serverErrors.set(apiError.fieldMessages());
        if (apiError.kind !== 'server' && apiError.kind !== 'rate-limit') this.error.set(apiError.userMessage);
      },
    });
  }
}
