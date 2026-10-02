import { Injectable, inject, signal } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { Crumb } from '../../shared/ui/breadcrumb/breadcrumb';

/**
 * Fil d'Ariane de l'espace connecté. Par défaut, il est lu dans la donnée de route « fil » ;
 * une page de détail peut le préciser avec set() une fois son contenu chargé.
 */
@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private readonly router = inject(Router);
  private readonly current = signal<readonly Crumb[]>([]);
  readonly crumbs = this.current.asReadonly();

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.current.set(this.fromRoute(this.router.routerState.snapshot.root));
    });
  }

  set(crumbs: readonly Crumb[]): void {
    this.current.set(crumbs);
  }

  private fromRoute(root: ActivatedRouteSnapshot): readonly Crumb[] {
    let route: ActivatedRouteSnapshot | null = root;
    let crumbs: readonly Crumb[] = [];
    while (route) {
      const data = route.data['fil'] as readonly Crumb[] | undefined;
      if (data) crumbs = data;
      route = route.firstChild;
    }
    return crumbs;
  }
}
