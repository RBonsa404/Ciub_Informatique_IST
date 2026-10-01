import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { CdkTableModule } from '@angular/cdk/table';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SeoService } from '../../core/seo/seo.service';
import { Breadcrumb } from '../../shared/ui/breadcrumb/breadcrumb';
import { Button } from '../../shared/ui/button/button';
import { Badge, Card } from '../../shared/ui/card/card';
import { DialogService } from '../../shared/ui/dialog/confirm-dialog';
import { Field, FieldControl } from '../../shared/ui/field/field';
import { BrandIcon, Icon } from '../../shared/ui/icon/icon';
import { BRAND_NAMES, ICON_NAMES } from '../../shared/ui/icon/icon-names';
import { Pagination } from '../../shared/ui/pagination/pagination';
import { EmptyState, ErrorState, Skeleton } from '../../shared/ui/states/states';
import { TabItem, Tabs } from '../../shared/ui/tabs/tabs';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { Checkbox, Switch } from '../../shared/ui/toggle/toggle';
import { Tooltip } from '../../shared/ui/tooltip/tooltip';

/** Contenu neutre servant à présenter un gabarit seul. */
@Component({
  selector: 'app-layout-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page-container" style="padding-top:3rem;padding-bottom:3rem">
      <h1>Titre de page</h1>
      <p style="margin-top:1rem;max-width:640px">Zone de contenu du gabarit. Ce texte est un repère de mise en page pour la recette visuelle.</p>
    </section>
  `,
})
export class LayoutPlaceholder {}

interface SampleRow {
  readonly libelle: string;
  readonly etat: 'success' | 'amber' | 'danger';
  readonly etatLibelle: string;
}

/** Page interne de recette : tous les composants de base, à comparer avec la maquette dans les deux thèmes. */
@Component({
  selector: 'app-design-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    CdkTableModule,
    CdkMenuTrigger,
    CdkMenu,
    CdkMenuItem,
    Button,
    Icon,
    BrandIcon,
    Card,
    Badge,
    Field,
    FieldControl,
    Checkbox,
    Switch,
    Tabs,
    Tooltip,
    Pagination,
    Skeleton,
    EmptyState,
    ErrorState,
    Breadcrumb,
  ],
  styles: `
    section {
      padding: 2rem 0;
      border-bottom: 1px solid var(--border-subtle);
    }
    h2 {
      font-size: 1.5rem;
      margin-bottom: 1.25rem;
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.5rem;
    }
    .icon-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.7rem;
      color: var(--text-muted);
      width: 96px;
      text-align: center;
    }
  `,
  template: `
    <div class="page-container" style="padding-top:2rem;padding-bottom:2rem">
      <app-badge variant="primary">Recette interne</app-badge>
      <h1 style="margin-top:1rem">Système de design</h1>
      <p style="margin-top:0.5rem">Composants de base du socle, dans le thème courant. Page absente de la production.</p>

      <section id="boutons" aria-labelledby="t-boutons">
        <h2 id="t-boutons">Boutons</h2>
        <div class="row">
          <button appBtn type="button">Principal</button>
          <button appBtn variant="secondary" type="button">Secondaire</button>
          <button appBtn variant="amber" type="button">Ambre</button>
          <button appBtn variant="outline" type="button">Contour</button>
          <button appBtn variant="danger" type="button">Danger</button>
          <button appBtn variant="ghost" type="button">Discret</button>
        </div>
        <div class="row" style="margin-top:1rem">
          <button appBtn size="sm" type="button">Petit</button>
          <button appBtn size="lg" type="button">Grand</button>
          <button appBtn variant="secondary" [iconOnly]="true" type="button" aria-label="Rechercher" appTooltip="Rechercher">
            <app-icon name="search" />
          </button>
          <button appBtn type="button"><app-icon name="user-plus" [size]="16" /> Avec icône</button>
          <button appBtn type="button" [loading]="true">Chargement</button>
          <button appBtn type="button" disabled>Désactivé</button>
        </div>
      </section>

      <section id="badges" aria-labelledby="t-badges">
        <h2 id="t-badges">Badges</h2>
        <div class="row">
          <app-badge variant="primary">Bleu royal</app-badge>
          <app-badge variant="amber">Ambre</app-badge>
          <app-badge variant="neutral">Neutre</app-badge>
          <app-badge variant="success">Validé</app-badge>
          <app-badge variant="danger">Rejeté</app-badge>
        </div>
      </section>

      <section id="cartes" aria-labelledby="t-cartes">
        <h2 id="t-cartes">Cartes</h2>
        <div class="grid-3">
          <app-card accent="blue">
            <app-badge variant="primary">Étiquette</app-badge>
            <h3 style="margin:0.75rem 0 0.5rem;font-size:1.15rem">Carte à liseré bleu</h3>
            <p style="font-size:0.92rem">Surface vitrée, liseré supérieur et ombre diffuse.</p>
          </app-card>
          <app-card accent="amber">
            <app-badge variant="amber">Étiquette</app-badge>
            <h3 style="margin:0.75rem 0 0.5rem;font-size:1.15rem">Carte à liseré ambre</h3>
            <p style="font-size:0.92rem">Surface vitrée, liseré supérieur et ombre diffuse.</p>
          </app-card>
          <app-card>
            <app-badge variant="neutral">Étiquette</app-badge>
            <h3 style="margin:0.75rem 0 0.5rem;font-size:1.15rem">Carte neutre</h3>
            <p style="font-size:0.92rem">Bordure réactive au survol.</p>
          </app-card>
        </div>
      </section>

      <section id="formulaires" aria-labelledby="t-formulaires">
        <h2 id="t-formulaires">Formulaires</h2>
        <form [formGroup]="form" class="glass-panel" style="padding:1.5rem;max-width:560px" (ngSubmit)="form.markAllAsTouched()">
          <app-field label="Adresse électronique" [required]="true" hint="Aide associée au champ.">
            <input appControl type="email" formControlName="email" autocomplete="off" />
          </app-field>
          <app-field label="Sélecteur">
            <select appControl formControlName="choix">
              <option value="a">Option A</option>
              <option value="b">Option B</option>
            </select>
          </app-field>
          <app-field label="Zone de texte">
            <textarea appControl formControlName="texte"></textarea>
          </app-field>
          <app-checkbox formControlName="accord">Case à cocher</app-checkbox>
          <app-switch formControlName="actif">Interrupteur</app-switch>
          <div class="row" style="margin-top:1rem">
            <button appBtn type="submit">Valider</button>
          </div>
        </form>
      </section>

      <section id="onglets" aria-labelledby="t-onglets">
        <h2 id="t-onglets">Onglets</h2>
        <app-tabs #tabsRef [tabs]="tabs" label="Exemple d’onglets" [(selected)]="tab" prefix="demo" />
        @for (item of tabs; track item.id) {
          @if (tab() === item.id) {
            <div role="tabpanel" [id]="tabsRef.panelId(item.id)" [attr.aria-labelledby]="tabsRef.tabId(item.id)" tabindex="0">
              <p>Panneau « {{ item.label }} ».</p>
            </div>
          }
        }
      </section>

      <section id="superpositions" aria-labelledby="t-superpositions">
        <h2 id="t-superpositions">Modale, menu, infobulle, notifications</h2>
        <div class="row">
          <button appBtn variant="secondary" type="button" (click)="openDialog()">Ouvrir la modale</button>
          <button appBtn variant="secondary" type="button" [cdkMenuTriggerFor]="menu">Ouvrir le menu <app-icon name="chevron-down" [size]="14" /></button>
          <button appBtn variant="secondary" type="button" appTooltip="Texte de l’infobulle">Infobulle</button>
          <button appBtn variant="outline" type="button" (click)="toasts.info('Notification d’information.')">Information</button>
          <button appBtn variant="outline" type="button" (click)="toasts.success('Opération réussie.')">Succès</button>
          <button appBtn variant="outline" type="button" (click)="toasts.danger('Un problème est survenu de notre côté. Réessayez dans quelques instants.')">
            Erreur
          </button>
        </div>
        <ng-template #menu>
          <div class="menu-panel" cdkMenu>
            <button type="button" class="menu-item" cdkMenuItem><app-icon name="edit" [size]="16" /> Modifier</button>
            <button type="button" class="menu-item" cdkMenuItem><app-icon name="archive" [size]="16" /> Archiver</button>
            <div class="menu-separator" role="separator"></div>
            <button type="button" class="menu-item menu-item-danger" cdkMenuItem><app-icon name="trash-2" [size]="16" /> Supprimer</button>
          </div>
        </ng-template>
        @if (dialogResult(); as result) {
          <p style="margin-top:1rem" aria-live="polite">Réponse de la modale : {{ result }}</p>
        }
      </section>

      <section id="tableau" aria-labelledby="t-tableau">
        <h2 id="t-tableau">Tableau et pagination</h2>
        <div class="glass-panel" style="padding:1rem">
          <div class="table-responsive">
            <table cdk-table [dataSource]="rows" class="data-table">
              <caption class="sr-only">
                Exemple de tableau
              </caption>
              <ng-container cdkColumnDef="libelle">
                <th cdk-header-cell *cdkHeaderCellDef scope="col">Libellé</th>
                <td cdk-cell *cdkCellDef="let row">{{ row.libelle }}</td>
              </ng-container>
              <ng-container cdkColumnDef="etat">
                <th cdk-header-cell *cdkHeaderCellDef scope="col">État</th>
                <td cdk-cell *cdkCellDef="let row">
                  <app-badge [variant]="row.etat">{{ row.etatLibelle }}</app-badge>
                </td>
              </ng-container>
              <ng-container cdkColumnDef="actions">
                <th cdk-header-cell *cdkHeaderCellDef scope="col">Actions</th>
                <td cdk-cell *cdkCellDef="let row">
                  <button appBtn variant="secondary" size="sm" type="button"><app-icon name="edit" [size]="14" /> Modifier</button>
                </td>
              </ng-container>
              <tr cdk-header-row *cdkHeaderRowDef="columns"></tr>
              <tr cdk-row *cdkRowDef="let row; columns: columns"></tr>
            </table>
          </div>
          <div style="margin-top:1rem">
            <app-pagination [page]="page()" [totalPages]="totalPages" (pageChange)="page.set($event)" />
          </div>
        </div>
      </section>

      <section id="etats" aria-labelledby="t-etats">
        <h2 id="t-etats">États de données</h2>
        <div class="grid-3">
          <div>
            <h3 style="font-size:1rem;margin-bottom:0.75rem">Chargement</h3>
            <div class="glass-card glass-card-static" aria-busy="true">
              <app-skeleton height="140px" radius="var(--radius-md)" />
              <div style="margin-top:1rem"><app-skeleton width="70%" height="1.2rem" /></div>
              <div style="margin-top:0.6rem"><app-skeleton width="40%" /></div>
            </div>
          </div>
          <div>
            <h3 style="font-size:1rem;margin-bottom:0.75rem">Vide</h3>
            <app-empty-state message="Aucun événement n’est programmé pour le moment." icon="calendar" />
          </div>
          <div>
            <h3 style="font-size:1rem;margin-bottom:0.75rem">Erreur</h3>
            <app-error-state (retry)="toasts.info('Nouvelle tentative.')" />
          </div>
        </div>
      </section>

      <section id="fil" aria-labelledby="t-fil">
        <h2 id="t-fil">Fil d’Ariane</h2>
        <app-breadcrumb [crumbs]="crumbs" />
      </section>

      <section id="icones" aria-labelledby="t-icones">
        <h2 id="t-icones">Icônes</h2>
        <div class="row" style="align-items:flex-start">
          @for (name of iconNames; track name) {
            <span class="icon-cell"><app-icon [name]="name" [size]="22" />{{ name }}</span>
          }
        </div>
        <h3 style="font-size:1rem;margin:1.5rem 0 0.75rem">Glyphes de plateformes</h3>
        <div class="row">
          @for (name of brandNames; track name) {
            <span class="icon-cell"><app-brand-icon [name]="name" [size]="22" />{{ name }}</span>
          }
        </div>
      </section>
    </div>
  `,
})
export class DesignPage {
  protected readonly toasts = inject(ToastService);
  private readonly dialogs = inject(DialogService);

  protected readonly iconNames = ICON_NAMES;
  protected readonly brandNames = BRAND_NAMES;

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    choix: new FormControl('a', { nonNullable: true }),
    texte: new FormControl('', { nonNullable: true }),
    accord: new FormControl(false, { nonNullable: true }),
    actif: new FormControl(true, { nonNullable: true }),
  });

  protected readonly tabs: readonly TabItem[] = [
    { id: 'un', label: 'Premier' },
    { id: 'deux', label: 'Deuxième' },
    { id: 'trois', label: 'Troisième' },
  ];
  protected readonly tab = signal('un');

  protected readonly columns = ['libelle', 'etat', 'actions'];
  protected readonly rows: readonly SampleRow[] = [
    { libelle: 'Ligne A', etat: 'success', etatLibelle: 'Publié' },
    { libelle: 'Ligne B', etat: 'amber', etatLibelle: 'Brouillon' },
    { libelle: 'Ligne C', etat: 'danger', etatLibelle: 'Rejeté' },
  ];
  protected readonly page = signal(0);
  protected readonly totalPages = 8;

  protected readonly crumbs = [{ label: 'Espace', route: '/__design' }, { label: 'Section', route: '/__design' }, { label: 'Page courante' }];

  protected readonly dialogResult = signal<string | null>(null);

  constructor() {
    inject(SeoService).apply({ title: 'Système de design', noindex: true });
  }

  protected openDialog(): void {
    this.dialogs
      .confirm({
        title: 'Confirmer l’action',
        message: 'Souhaitez-vous valider cette opération ? Cette action est irréversible.',
      })
      .subscribe((confirmed) => this.dialogResult.set(confirmed ? 'confirmée' : 'annulée'));
  }
}
