import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../../../shared/components/modal/modal';
import { Actualite } from '../../../core/models';

@Component({
  selector: 'app-responsable-actualites-manage',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  template: `
    <div class="manage-page">
      <div class="page-title-box">
        <div class="title-row">
          <div>
            <h1>Gestion des Actualités & Articles</h1>
            <p>Rédigez, éditez et publiez les communiqués officiels du Club Informatique.</p>
          </div>
          <button type="button" class="btn btn-primary" (click)="openCreate()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouvel Article
          </button>
        </div>
      </div>

      <div class="glass-card table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Titre de l'Actualité</th>
              <th>Auteur</th>
              <th>Date Publication</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (actu of actualites(); track actu.id) {
              <tr>
                <td>
                  <strong>{{ actu.titre }}</strong>
                </td>
                <td>{{ actu.auteur.prenom }} {{ actu.auteur.nom }}</td>
                <td>{{ actu.createdAt | date:'dd/MM/yyyy' }}</td>
                <td>
                  <span class="badge" [class.badge-success]="actu.publie" [class.badge-warning]="!actu.publie">
                    {{ actu.publie ? 'En Ligne' : 'Brouillon' }}
                  </span>
                </td>
                <td>
                  <div class="flex gap-2">
                    <button type="button" class="btn btn-outline btn-sm" (click)="editActualite(actu)">Modifier</button>
                    <button type="button" class="btn btn-ghost btn-sm text-error" (click)="deleteActualite(actu.id)">Supprimer</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <app-modal [isOpen]="isModalOpen" [title]="editId ? 'Modifier l’article' : 'Rédiger une actualité'" (closed)="isModalOpen = false">
        <form [formGroup]="formGroup" class="modal-form">
          <div class="form-group">
            <label class="form-label">Titre *</label>
            <input type="text" formControlName="titre" class="form-control" />
          </div>

          <div class="form-group">
            <label class="form-label">Résumé court</label>
            <textarea formControlName="resume" class="form-control" rows="2"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Contenu complet (Markdown / Texte) *</label>
            <textarea formControlName="contenu" class="form-control" rows="5"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">URL Image de couverture</label>
            <input type="url" formControlName="imageUrl" class="form-control" />
          </div>

          <div class="checkbox-row">
            <input type="checkbox" id="publie" formControlName="publie" />
            <label for="publie">Publier immédiatement sur le portail public</label>
          </div>
        </form>

        <div modal-actions>
          <button type="button" class="btn btn-outline btn-sm" (click)="isModalOpen = false">Annuler</button>
          <button type="button" class="btn btn-primary btn-sm" [disabled]="formGroup.invalid" (click)="saveActualite()">Enregistrer</button>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    .manage-page { display: flex; flex-direction: column; gap: 2rem; }
    .title-row { display: flex; align-items: center; justify-content: space-between; }
    .title-row h1 { font-size: 1.85rem; margin-bottom: 0.35rem; }
    .title-row p { color: var(--text-secondary); font-size: 0.95rem; }
    .table-card { border-radius: 20px; overflow: hidden; padding: 0; }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; }
    .data-table th {
      padding: 1.25rem 1.5rem;
      font-size: 0.8rem;
      text-transform: uppercase;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-color);
      background: rgba(0,0,0,0.01);
    }
    .data-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); font-size: 0.9rem; }
    .flex { display: flex; }
    .gap-2 { gap: 0.5rem; }
    .text-error { color: var(--color-error); }
    .modal-form { display: flex; flex-direction: column; gap: 1rem; }
    .checkbox-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; }
  `]
})
export class ResponsableActualitesManageComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly actualites = signal<Actualite[]>([]);
  isModalOpen = false;
  editId: number | null = null;

  readonly formGroup: FormGroup = this.fb.group({
    titre: ['', Validators.required],
    resume: [''],
    contenu: ['', Validators.required],
    imageUrl: ['https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80'],
    publie: [true]
  });

  ngOnInit(): void {
    this.api.getActualites(0, 50).subscribe(res => this.actualites.set(res.content));
  }

  openCreate(): void {
    this.editId = null;
    this.formGroup.reset({ publie: true });
    this.isModalOpen = true;
  }

  editActualite(actu: Actualite): void {
    this.editId = actu.id;
    this.formGroup.patchValue({
      titre: actu.titre,
      resume: actu.resume,
      contenu: actu.contenu,
      imageUrl: actu.imageUrl,
      publie: actu.publie
    });
    this.isModalOpen = true;
  }

  saveActualite(): void {
    if (this.formGroup.invalid) return;

    if (this.editId) {
      this.actualites.update(list => list.map(a => a.id === this.editId ? { ...a, ...this.formGroup.value } : a));
      this.toast.success('Actualité mise à jour.');
    } else {
      const newA: Actualite = {
        id: Date.now(),
        slug: 'actu-' + Date.now(),
        ...this.formGroup.value,
        auteur: { id: 1, nom: 'Ouedraogo', prenom: 'Moussa' },
        createdAt: new Date().toISOString()
      };
      this.actualites.update(list => [newA, ...list]);
      this.toast.success('Actualité enregistrée avec succès.');
    }
    this.isModalOpen = false;
  }

  deleteActualite(id: number): void {
    this.actualites.update(list => list.filter(a => a.id !== id));
    this.toast.info('Actualité supprimée.');
  }
}
