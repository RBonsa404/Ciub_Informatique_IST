import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { FilesApi, estFichierDepose } from '../../../core/api/files.api';

/**
 * Photo de profil. Le fichier est réservé aux utilisateurs connectés : il est téléchargé avec la session, puis affiché.
 * Sans photo, ou tant qu'elle n'est pas chargée, le contenu projeté (les initiales) reste affiché.
 */
@Component({
  selector: 'app-profile-photo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: contents;
    }
    img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      display: block;
    }
  `,
  template: `
    @if (url(); as adresse) {
      <img [src]="adresse" alt="" />
    } @else {
      <ng-content />
    }
  `,
})
export class ProfilePhoto {
  /** Adresse du fichier déposé, ou null. */
  readonly src = input<string | null | undefined>(null);

  private readonly api = inject(FilesApi);
  protected readonly url = signal<string | null>(null);

  constructor() {
    effect((onCleanup) => {
      const adresse = this.src();
      this.release();
      if (!estFichierDepose(adresse)) return;
      const subscription = this.api.telecharger(adresse!).subscribe({
        next: (fichier) => {
          this.objet = URL.createObjectURL(fichier.contenu);
          this.url.set(this.objet);
        },
        error: () => this.url.set(null),
      });
      onCleanup(() => subscription.unsubscribe());
    });
    inject(DestroyRef).onDestroy(() => this.release());
  }

  /** Adresse d'objet en cours, tenue hors des signaux : la libérer ne doit pas relancer le chargement. */
  private objet: string | null = null;

  private release(): void {
    if (this.objet) URL.revokeObjectURL(this.objet);
    this.objet = null;
    this.url.set(null);
  }
}
