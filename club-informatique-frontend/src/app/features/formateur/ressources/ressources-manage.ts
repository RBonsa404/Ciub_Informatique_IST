import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../../../shared/components/modal/modal';
import { Ressource } from '../../../core/models';

@Component({
  selector: 'app-formateur-ressources-manage',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  template: `
    <div class="manage-page">
      <div class="page-title-box">
        <div class="title-row">
          <div>
            <h1>Gestion de Mes Ressources</h1>
            <p>Téléversez des supports de cours, slides, fiches mémo et vidéos pour vos apprenants.</p>
          </div>
          <button type="button" class="btn btn-primary" (click)="isModalOpen = true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Ajouter une ressource
          </button>
        </div>
      </div>

      <div class="glass-card table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Ressource</th>
              <th>Type</th>
              <th>Visibilité</th>
              <th>Date d'ajout</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (r of ressources(); track r.id) {
              <tr>
                <td>
                  <strong>{{ r.titre }}</strong>
                  <div class="text-xs text-secondary">{{ r.description }}</div>
                </td>
                <td>
                  <span class="badge badge-amber">{{ r.type }}</span>
                </td>
                <td>
                  <span class="badge" [class.badge-success]="r.publique" [class.badge-warning]="!r.publique">
                    {{ r.publique ? 'Publique' : 'Membres uniquement' }}
                  </span>
                </td>
                <td>{{ r.createdAt | date:'dd/MM/yyyy' }}</td>
                <td>
                  <button type="button" class="btn btn-outline btn-sm text-error" (click)="deleteRessource(r.id)">
                    Supprimer
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Modal Creation -->
      <app-modal [isOpen]="isModalOpen" title="Publier une ressource pédagogique" (closed)="isModalOpen = false">
        <form [formGroup]="formGroup" class="modal-form">
          <div class="form-group">
            <label class="form-label">Titre de la ressource *</label>
            <input type="text" formControlName="titre" class="form-control" placeholder="Ex: TP 2 - Guide d'installation Docker" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Format / Type</label>
              <select formControlName="type" class="form-control">
                <option value="PDF">Document PDF</option>
                <option value="VIDEO">Vidéo / Replay</option>
                <option value="COURS">Cheat Sheet / Code</option>
                <option value="LIEN">Lien externe</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Accès</label>
              <select formControlName="publique" class="form-control">
                <option [value]="true">Public (Tous les visiteurs)</option>
                <option [value]="false">Privé (Membres connectés)</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">URL ou chemin du fichier</label>
            <input type="text" formControlName="url" class="form-control" placeholder="https://..." />
          </div>

          <div class="form-group">
            <label class="form-label">Description synthétique</label>
            <textarea formControlName="description" class="form-control" rows="2"></textarea>
          </div>
        </form>

        <div modal-actions>
          <button type="button" class="btn btn-outline btn-sm" (click)="isModalOpen = false">Annuler</button>
          <button type="button" class="btn btn-primary btn-sm" [disabled]="formGroup.invalid" (click)="saveRessource()">
            Publier la ressource
          </button>
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
    .text-xs { font-size: 0.75rem; margin-top: 0.2rem; }
    .text-error { color: var(--color-error); }
    .modal-form { display: flex; flex-direction: column; gap: 1rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  `]
})
export class FormateurRessourcesManageComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly ressources = signal<Ressource[]>([]);
  isModalOpen = false;

  readonly formGroup: FormGroup = this.fb.group({
    titre: ['', Validators.required],
    type: ['PDF'],
    publique: [true],
    url: ['https://clubinfo-ist.bf/docs/demo.pdf'],
    description: ['']
  });

  ngOnInit(): void {
    this.api.getRessources(0, 50).subscribe(res => this.ressources.set(res.content));
  }

  saveRessource(): void {
    if (this.formGroup.invalid) return;

    const newR: Ressource = {
      id: Date.now(),
      ...this.formGroup.value,
      auteur: { id: 10, nom: 'Compaore', prenom: 'David' },
      createdAt: new Date().toISOString()
    };

    this.ressources.update(list => [newR, ...list]);
    this.toast.success('Ressource ajoutée avec succès.');
    this.isModalOpen = false;
    this.formGroup.reset({ type: 'PDF', publique: true, url: '' });
  }

  deleteRessource(id: number): void {
    this.ressources.update(list => list.filter(r => r.id !== id));
    this.toast.info('Ressource supprimée.');
  }
}
