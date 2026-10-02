import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { EXTENSIONS_ACCEPTEES, Fichier, FilesApi, TAILLE_MAXIMALE_OCTETS } from '../../../core/api/files.api';
import { toApiError } from '../../../core/http/problem';
import { Icon } from '../icon/icon';

let sequence = 0;

/**
 * Zone de dépôt d'un fichier (écran 40 de la maquette) : choix par le bouton ou par glisser-déposer,
 * envoi immédiat au serveur, puis émission du fichier enregistré. La taille et l'extension sont vérifiées
 * avant l'envoi ; le serveur reste seul juge du type réel du contenu.
 */
@Component({
  selector: 'app-file-upload',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  styles: `
    :host {
      display: block;
      margin-bottom: 1.5rem;
    }
    .zone {
      border: 2px dashed var(--border-subtle);
      padding: 2rem;
      border-radius: 14px;
      text-align: center;
      background: color-mix(in srgb, var(--text-primary) 2%, transparent);
      transition: border-color 0.2s ease;
    }
    .zone.survol {
      border-color: var(--accent-primary);
    }
    .zone.erreur {
      border-color: var(--color-danger);
    }
    .pictogramme {
      display: block;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }
    .invite {
      font-size: 0.9rem;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
    }
    .limites {
      display: block;
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }
    .depose {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      flex-wrap: wrap;
      font-size: 0.9rem;
      overflow-wrap: anywhere;
    }
    input[type='file'] {
      position: absolute;
      width: 1px;
      height: 1px;
      opacity: 0;
      pointer-events: none;
    }
  `,
  template: `
    <span class="form-label" [id]="labelId">{{ label() }}</span>
    <div
      class="zone"
      [class.survol]="hover()"
      [class.erreur]="!!error()"
      (dragover)="onDragOver($event)"
      (dragleave)="hover.set(false)"
      (drop)="onDrop($event)"
    >
      @if (uploaded(); as fichier) {
        <p class="depose">
          <app-icon name="paperclip" [size]="16" />
          <span>{{ fichier }}</span>
          <button type="button" class="btn btn-ghost btn-sm" (click)="remove()">Retirer<span class="sr-only"> le fichier {{ fichier }}</span></button>
        </p>
      } @else {
        <span class="pictogramme"><app-icon name="upload" [size]="28" /></span>
        <p class="invite">{{ invite() }}</p>
        <span class="limites" [id]="hintId">{{ limits() }}</span>
        <input #champ type="file" [id]="inputId" [accept]="acceptAttribute()" [attr.aria-labelledby]="labelId" [attr.aria-describedby]="hintId" (change)="onPick($event)" />
        <button type="button" class="btn btn-secondary btn-sm" [disabled]="pending()" [attr.aria-busy]="pending()" (click)="champ.click()">
          {{ pending() ? 'Envoi en cours…' : 'Choisir un fichier' }}
        </button>
      }
    </div>
    <div aria-live="assertive">
      @if (error(); as message) {
        <p class="form-error" role="alert">{{ message }}</p>
      }
    </div>
  `,
})
export class FileUpload {
  readonly label = input.required<string>();
  readonly invite = input('Glissez votre fichier ici ou choisissez-le sur votre appareil.');
  /** Extensions acceptées, point compris. Par défaut, toutes celles que le serveur accepte. */
  readonly extensions = input<readonly string[]>(EXTENSIONS_ACCEPTEES);
  /** Nom du fichier déjà déposé, quand le formulaire est rouvert. */
  readonly current = input<string | null>(null);

  readonly fileUploaded = output<Fichier>();
  readonly fileRemoved = output<void>();

  private readonly api = inject(FilesApi);
  private readonly champ = viewChild<ElementRef<HTMLInputElement>>('champ');
  private readonly id = ++sequence;
  protected readonly labelId = `depot-libelle-${this.id}`;
  protected readonly hintId = `depot-aide-${this.id}`;
  protected readonly inputId = `depot-champ-${this.id}`;

  protected readonly hover = signal(false);
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly sent = signal<string | null | undefined>(undefined);
  protected readonly uploaded = computed(() => (this.sent() === undefined ? this.current() : this.sent()));
  protected readonly acceptAttribute = computed(() => this.extensions().join(','));
  protected readonly limits = computed(
    () => `${this.extensions().map((extension) => extension.slice(1).toUpperCase()).join(', ')} ; ${TAILLE_MAXIMALE_OCTETS / (1024 * 1024)} Mo au plus.`,
  );

  protected onPick(event: Event): void {
    const champ = event.target as HTMLInputElement;
    const fichier = champ.files?.[0];
    champ.value = '';
    if (fichier) this.send(fichier);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.hover.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.hover.set(false);
    const fichier = event.dataTransfer?.files?.[0];
    if (fichier && !this.pending() && !this.uploaded()) this.send(fichier);
  }

  protected remove(): void {
    this.sent.set(null);
    this.error.set(null);
    this.fileRemoved.emit();
    queueMicrotask(() => this.champ()?.nativeElement.focus());
  }

  private send(fichier: File): void {
    const refus = this.refusal(fichier);
    if (refus) {
      this.error.set(refus);
      return;
    }
    this.pending.set(true);
    this.error.set(null);
    this.api.deposer(fichier).subscribe({
      next: (depose) => {
        this.pending.set(false);
        this.sent.set(depose.nom);
        this.fileUploaded.emit(depose);
      },
      error: (failure: unknown) => {
        this.pending.set(false);
        this.error.set(messageDe(toApiError(failure).status));
      },
    });
  }

  private refusal(fichier: File): string | null {
    const nom = fichier.name.toLowerCase();
    if (!this.extensions().some((extension) => nom.endsWith(extension))) return 'Ce type de fichier n’est pas accepté.';
    if (fichier.size === 0) return 'Ce fichier est vide.';
    if (fichier.size > TAILLE_MAXIMALE_OCTETS) return 'Ce fichier dépasse la taille autorisée.';
    return null;
  }
}

function messageDe(statut: number): string {
  if (statut === 413) return 'Ce fichier dépasse la taille autorisée.';
  if (statut === 415) return 'Ce type de fichier n’est pas accepté : son contenu ne correspond pas à son extension.';
  if (statut === 0) return 'L’envoi a échoué. Vérifiez votre connexion, puis réessayez.';
  if (statut === 401 || statut === 403) return 'Vous n’avez pas le droit de déposer un fichier.';
  return 'Le fichier n’a pas pu être enregistré. Réessayez dans quelques instants.';
}
