import { Directive, ElementRef, HostListener, computed, inject, input, signal } from '@angular/core';
import { FilesApi, estFichierDepose } from '../../../core/api/files.api';
import { ToastService } from '../toast/toast.service';

/**
 * Lien vers un document : un lien externe s'ouvre dans un nouvel onglet ; un fichier déposé sur la plateforme
 * est téléchargé avec la session de l'utilisateur, car un simple lien ne porterait pas son jeton.
 */
@Directive({
  selector: 'a[appFileLink]',
  host: {
    '[attr.href]': 'adresse()',
    '[attr.target]': 'depose() ? null : "_blank"',
    '[attr.rel]': 'depose() ? null : "noopener noreferrer"',
    '[attr.aria-busy]': 'pending() ? "true" : null',
  },
})
export class FileLink {
  readonly adresse = input.required<string>({ alias: 'appFileLink' });

  private readonly api = inject(FilesApi);
  private readonly toasts = inject(ToastService);
  private readonly element = inject<ElementRef<HTMLAnchorElement>>(ElementRef);
  protected readonly depose = computed(() => estFichierDepose(this.adresse()));
  protected readonly pending = signal(false);

  @HostListener('click', ['$event'])
  protected onClick(event: MouseEvent): void {
    if (!this.depose()) return;
    event.preventDefault();
    if (this.pending()) return;
    this.pending.set(true);
    this.api.telecharger(this.adresse()).subscribe({
      next: ({ contenu, nom }) => {
        this.pending.set(false);
        const adresseLocale = URL.createObjectURL(contenu);
        const lien = this.element.nativeElement.ownerDocument.createElement('a');
        lien.href = adresseLocale;
        lien.download = nom;
        lien.click();
        setTimeout(() => URL.revokeObjectURL(adresseLocale), 1000);
      },
      error: () => {
        this.pending.set(false);
        this.toasts.danger('Ce fichier n’a pas pu être téléchargé. Réessayez dans quelques instants.');
      },
    });
  }
}
