import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../../../shared/components/modal/modal';
import { Categorie } from '../../../core/models';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  template: `
    <div class="manage-page">
      <div class="page-title-box">
        <div class="title-row">
          <div>
            <h1>Gestion des Catégories & Taxonomies</h1>
            <p>Structurez les actualités, formations, événements et projets du Club.</p>
          </div>
          <button type="button" class="btn btn-primary" (click)="isModalOpen = true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouvelle Catégorie
          </button>
        </div>
      </div>

      <div class="glass-card table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Slug</th>
              <th>Domaine d'application</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (cat of categories(); track cat.id) {
              <tr>
                <td><strong>{{ cat.nom }}</strong></td>
                <td><code>{{ cat.slug }}</code></td>
                <td>
                  <span class="badge badge-amber">{{ cat.type }}</span>
                </td>
                <td>{{ cat.description }}</td>
                <td>
                  <button type="button" class="btn btn-ghost btn-sm text-error" (click)="deleteCat(cat.id)">Supprimer</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <app-modal [isOpen]="isModalOpen" title="Créer une catégorie" (closed)="isModalOpen = false">
        <form [formGroup]="formGroup" class="modal-form">
          <div class="form-group">
            <label class="form-label">Nom de la catégorie *</label>
            <input type="text" formControlName="nom" class="form-control" placeholder="Ex: Intelligence Artificielle" />
          </div>

          <div class="form-group">
            <label class="form-label">Domaine / Type d'affectation</label>
            <select formControlName="type" class="form-control">
              <option value="FORMATION">Formations</option>
              <option value="ACTUALITE">Actualités</option>
              <option value="EVENEMENT">Événements</option>
              <option value="PROJET">Projets</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <input type="text" formControlName="description" class="form-control" />
          </div>
        </form>

        <div modal-actions>
          <button type="button" class="btn btn-outline btn-sm" (click)="isModalOpen = false">Annuler</button>
          <button type="button" class="btn btn-primary btn-sm" [disabled]="formGroup.invalid" (click)="saveCat()">Créer</button>
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
    .text-error { color: var(--color-error); }
    .modal-form { display: flex; flex-direction: column; gap: 1rem; }
  `]
})
export class AdminCategoriesComponent {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly categories = signal<Categorie[]>([
    { id: 1, nom: 'Web & Mobile', slug: 'web-mobile', type: 'FORMATION', description: 'Angular, React, Flutter, Spring Boot', createdAt: '2026-09-01' },
    { id: 2, nom: 'Intelligence Artificielle', slug: 'ia-data', type: 'FORMATION', description: 'Machine Learning, LLM, Python Data', createdAt: '2026-09-01' },
    { id: 3, nom: 'Cybersécurité', slug: 'cybersecurite', type: 'EVENEMENT', description: 'CTF, audits, ethical hacking', createdAt: '2026-09-01' },
    { id: 4, nom: 'Vie Associative', slug: 'vie-associative', type: 'ACTUALITE', description: 'Événements généraux et partenariats', createdAt: '2026-09-01' }
  ]);

  isModalOpen = false;

  readonly formGroup: FormGroup = this.fb.group({
    nom: ['', Validators.required],
    type: ['FORMATION', Validators.required],
    description: ['']
  });

  saveCat(): void {
    if (this.formGroup.invalid) return;

    const { nom, type, description } = this.formGroup.value;
    const newCat: Categorie = {
      id: Date.now(),
      nom,
      slug: nom.toLowerCase().replace(/\s+/g, '-'),
      type,
      description,
      createdAt: new Date().toISOString()
    };

    this.categories.update(list => [...list, newCat]);
    this.toast.success(`Catégorie "${nom}" créée avec succès.`);
    this.isModalOpen = false;
    this.formGroup.reset({ type: 'FORMATION' });
  }

  deleteCat(id: number): void {
    this.categories.update(list => list.filter(c => c.id !== id));
    this.toast.info('Catégorie supprimée.');
  }
}
