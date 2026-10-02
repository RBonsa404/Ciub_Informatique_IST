import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../icon/icon';

export interface Crumb {
  readonly label: string;
  /** Absent pour la page courante. */
  readonly route?: string;
}

@Component({
  selector: 'app-breadcrumb',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  template: `
    <nav aria-label="Fil d’Ariane">
      <ol class="breadcrumb">
        @for (crumb of crumbs(); track crumb.label; let last = $last) {
          <li class="inline-flex items-center gap-[0.4rem]">
            @if (crumb.route && !last) {
              <a [routerLink]="crumb.route">{{ crumb.label }}</a>
              <app-icon name="chevron-right" [size]="14" />
            } @else {
              <span aria-current="page">{{ crumb.label }}</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
})
export class Breadcrumb {
  readonly crumbs = input.required<readonly Crumb[]>();
}
