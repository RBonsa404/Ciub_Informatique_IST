import { ChangeDetectionStrategy, Component, DestroyRef, Signal, computed, inject, input, output, signal } from '@angular/core';
import { Observable, Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { Page } from '../../../core/api/api-client';
import { LoadStatus, ResourceState } from '../../../core/api/resource-state';
import { IconName } from '../icon/icon-names';
import { EmptyState, ErrorState } from './states';

/**
 * Zone de données à quatre états. Le squelette est projeté dans [zone-skeleton], une action d'état vide
 * dans [zone-empty], le contenu dans l'emplacement par défaut (le parent le conditionne à la donnée).
 * hideWhenEmpty : sur une page publique de présentation, une section sans donnée ou en erreur est masquée.
 */
@Component({
  selector: 'app-data-zone',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState, ErrorState],
  host: { style: 'display:block' },
  template: `
    @switch (status()) {
      @case ('loading') {
        <div role="status" aria-busy="true">
          <span class="sr-only">Chargement en cours</span>
          <ng-content select="[zone-skeleton]" />
        </div>
      }
      @case ('error') {
        @if (!hideWhenEmpty()) {
          <app-error-state [message]="errorMessage() ?? defaultError" (retry)="retry.emit()" />
        }
      }
      @case ('empty') {
        @if (!hideWhenEmpty()) {
          <app-empty-state [message]="emptyMessage()" [icon]="emptyIcon()"><ng-content select="[zone-empty]" /></app-empty-state>
        }
      }
      @default {
        <ng-content />
      }
    }
  `,
})
export class DataZone {
  readonly status = input.required<LoadStatus>();
  readonly emptyMessage = input.required<string>();
  readonly emptyIcon = input<IconName>('inbox');
  readonly errorMessage = input<string | null>(null);
  readonly hideWhenEmpty = input(false);
  readonly retry = output<void>();
  protected readonly defaultError = 'Les données n’ont pas pu être chargées. Vérifiez votre connexion, puis réessayez.';
}

/** Liste paginée côté serveur avec recherche différée et filtre par catégorie. */
export class PagedList<T> {
  readonly page = signal(0);
  readonly search = signal('');
  readonly categorieId = signal<number | null>(null);
  private readonly searchInput = new Subject<string>();
  private readonly state: ResourceState<Page<T>>;

  readonly status: Signal<LoadStatus>;
  readonly items: Signal<readonly T[]>;
  readonly totalPages: Signal<number>;
  readonly filtered = computed(() => this.search().trim() !== '' || this.categorieId() !== null);

  constructor(
    fetch: (query: { page: number; size: number; search?: string; categorieId?: number | null }) => Observable<Page<T>>,
    readonly size: number,
    destroyRef: DestroyRef = inject(DestroyRef),
  ) {
    this.state = new ResourceState(() =>
      fetch({ page: this.page(), size: this.size, search: this.search().trim() || undefined, categorieId: this.categorieId() }),
    );
    this.status = this.state.status;
    this.items = computed(() => this.state.data()?.content ?? []);
    this.totalPages = computed(() => this.state.data()?.totalPages ?? 0);
    const subscription = this.searchInput.pipe(debounceTime(300), distinctUntilChanged()).subscribe((term) => {
      this.search.set(term);
      this.page.set(0);
      this.state.load();
    });
    destroyRef.onDestroy(() => {
      subscription.unsubscribe();
      this.state.destroy();
    });
    this.state.load();
  }

  reload(): void {
    this.state.load();
  }

  onSearch(term: string): void {
    this.searchInput.next(term);
  }

  setCategorie(id: number | null): void {
    this.categorieId.set(id);
    this.page.set(0);
    this.state.load();
  }

  goTo(page: number): void {
    this.page.set(page);
    this.state.load();
  }

  resetFilters(): void {
    this.search.set('');
    this.categorieId.set(null);
    this.page.set(0);
    this.state.load();
  }
}
