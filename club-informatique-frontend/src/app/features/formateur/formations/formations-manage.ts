import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../../../shared/components/modal/modal';
import { Formation } from '../../../core/models';

@Component({
  selector: 'app-formateur-formations-manage',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  template: `
    <div class="manage-page">
      <div class="page-title-box">
        <div class="title-row">
          <div>
            <h1>Gestion de Mes Formations & Sessions</h1>
            <p>Créez, modifiez vos modules de formation et planifiez les sessions de cours.</p>
          </div>
          <button type="button" class="btn btn-primary" (click)="openCreateModal()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouvelle Formation
          </button>
        </div>
      </div>

      <div class="glass-card table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Formation</th>
              <th>Niveau</th>
              <th>Durée</th>
              <th>Sessions</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (f of formations(); track f.id) {
              <tr>
                <td>
                  <strong>{{ f.titre }}</strong>
                </td>
                <td>
                  <span class="badge badge-amber">{{ f.niveau }}</span>
                </td>
                <td>{{ f.dureeHeures }}h</td>
                <td>{{ f.sessions.length }} session(s)</td>
                <td>
                  <span class="badge badge-success">Publiée</span>
                </td>
                <td>
                  <div class="flex gap-2">
                    <button type="button" class="btn btn-outline btn-sm" (click)="editFormation(f)">Modifier</button>
                    <button type="button" class="btn btn-secondary btn-sm" (click)="addSession(f)">+ Session</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Modal Creation / Edition -->
      <app-modal [isOpen]="isModalOpen" [title]="editId ? 'Modifier la formation' : 'Nouvelle Formation'" (closed)="isModalOpen = false">
        <form [formGroup]="formGroup" class="modal-form">
          <div class="form-group">
            <label class="form-label">Titre de la formation *</label>
            <input type="text" formControlName="titre" class="form-control" placeholder="Ex: Maîtriser Docker & Kubernetes" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Niveau</label>
              <select formControlName="niveau" class="form-control">
                <option value="DEBUTANT">Débutant</option>
                <option value="INTERMEDIAIRE">Intermédiaire</option>
                <option value="AVANCE">Avancé</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Volume horaire (heures)</label>
              <input type="number" formControlName="dureeHeures" class="form-control" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Description synthétique</label>
            <textarea formControlName="description" class="form-control" rows="3"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Objectifs pédagogiques</label>
            <textarea formControlName="objectifs" class="form-control" rows="2"></textarea>
          </div>
        </form>

        <div modal-actions>
          <button type="button" class="btn btn-outline btn-sm" (click)="isModalOpen = false">Annuler</button>
          <button type="button" class="btn btn-primary btn-sm" [disabled]="formGroup.invalid" (click)="saveFormation()">Enregistrer</button>
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
    .modal-form { display: flex; flex-direction: column; gap: 1rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  `]
})
export class FormateurFormationsManageComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly formations = signal<Formation[]>([]);
  isModalOpen = false;
  editId: number | null = null;

  readonly formGroup: FormGroup = this.fb.group({
    titre: ['', Validators.required],
    niveau: ['INTERMEDIAIRE'],
    dureeHeures: [30, Validators.required],
    description: [''],
    objectifs: ['']
  });

  ngOnInit(): void {
    this.api.getFormations(0, 50).subscribe(res => this.formations.set(res.content));
  }

  openCreateModal(): void {
    this.editId = null;
    this.formGroup.reset({ niveau: 'INTERMEDIAIRE', dureeHeures: 30 });
    this.isModalOpen = true;
  }

  editFormation(f: Formation): void {
    this.editId = f.id;
    this.formGroup.patchValue({
      titre: f.titre,
      niveau: f.niveau,
      dureeHeures: f.dureeHeures,
      description: f.description,
      objectifs: f.objectifs
    });
    this.isModalOpen = true;
  }

  addSession(f: Formation): void {
    const titreSession = prompt(`Planifier une nouvelle session pour "${f.titre}" :`, 'Session Novembre 2026');
    if (titreSession) {
      this.toast.success(`Session "${titreSession}" créée avec succès.`);
    }
  }

  saveFormation(): void {
    if (this.formGroup.invalid) return;

    if (this.editId) {
      this.formations.update(list => list.map(f => f.id === this.editId ? { ...f, ...this.formGroup.value } : f));
      this.toast.success('Formation mise à jour.');
    } else {
      const newF: Formation = {
        id: Date.now(),
        slug: 'formation-' + Date.now(),
        ...this.formGroup.value,
        publie: true,
        sessions: [],
        formateur: { id: 10, nom: 'Compaore', prenom: 'David' },
        createdAt: new Date().toISOString()
      };
      this.formations.update(list => [newF, ...list]);
      this.toast.success('Nouvelle formation publiée.');
    }
    this.isModalOpen = false;
  }
}
