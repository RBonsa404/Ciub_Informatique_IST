import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../../../shared/components/modal/modal';
import { Evenement } from '../../../core/models';

@Component({
  selector: 'app-responsable-evenements-manage',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  template: `
    <div class="manage-page">
      <div class="page-title-box">
        <div class="title-row">
          <div>
            <h1>Gestion des Événements & Hackathons</h1>
            <p>Planifiez les hackathons, séminaires, conférences et gagnez en visibilité.</p>
          </div>
          <button type="button" class="btn btn-primary" (click)="openCreate()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Créer un Événement
          </button>
        </div>
      </div>

      <div class="glass-card table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Événement</th>
              <th>Date Début</th>
              <th>Lieu</th>
              <th>Capacité</th>
              <th>Inscrits</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (ev of evenements(); track ev.id) {
              <tr>
                <td>
                  <strong>{{ ev.titre }}</strong>
                </td>
                <td>{{ ev.dateDebut | date:'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ ev.lieu }}</td>
                <td>{{ ev.capaciteMax }} places</td>
                <td>
                  <span class="badge badge-amber">{{ ev.nbInscrits }} / {{ ev.capaciteMax }}</span>
                </td>
                <td>
                  <div class="flex gap-2">
                    <button type="button" class="btn btn-outline btn-sm" (click)="editEvent(ev)">Modifier</button>
                    <button type="button" class="btn btn-ghost btn-sm text-error" (click)="deleteEvent(ev.id)">Supprimer</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <app-modal [isOpen]="isModalOpen" [title]="editId ? 'Modifier l’événement' : 'Créer un nouvel événement'" (closed)="isModalOpen = false">
        <form [formGroup]="formGroup" class="modal-form">
          <div class="form-group">
            <label class="form-label">Titre de l'événement *</label>
            <input type="text" formControlName="titre" class="form-control" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Date et heure de début *</label>
              <input type="datetime-local" formControlName="dateDebut" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Date et heure de fin *</label>
              <input type="datetime-local" formControlName="dateFin" class="form-control" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Lieu *</label>
              <input type="text" formControlName="lieu" class="form-control" placeholder="Campus IST Amphi B" />
            </div>
            <div class="form-group">
              <label class="form-label">Capacité maximale</label>
              <input type="number" formControlName="capaciteMax" class="form-control" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Description détaillée</label>
            <textarea formControlName="description" class="form-control" rows="3"></textarea>
          </div>
        </form>

        <div modal-actions>
          <button type="button" class="btn btn-outline btn-sm" (click)="isModalOpen = false">Annuler</button>
          <button type="button" class="btn btn-primary btn-sm" [disabled]="formGroup.invalid" (click)="saveEvent()">Enregistrer</button>
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
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  `]
})
export class ResponsableEvenementsManageComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly evenements = signal<Evenement[]>([]);
  isModalOpen = false;
  editId: number | null = null;

  readonly formGroup: FormGroup = this.fb.group({
    titre: ['', Validators.required],
    dateDebut: ['2026-10-15T08:00', Validators.required],
    dateFin: ['2026-10-17T18:00', Validators.required],
    lieu: ['Campus IST Amphi B', Validators.required],
    capaciteMax: [100, Validators.required],
    description: ['']
  });

  ngOnInit(): void {
    this.api.getEvenements(0, 50, false).subscribe(res => this.evenements.set(res.content));
  }

  openCreate(): void {
    this.editId = null;
    this.formGroup.reset({ capaciteMax: 100, lieu: 'Campus Principal IST' });
    this.isModalOpen = true;
  }

  editEvent(ev: Evenement): void {
    this.editId = ev.id;
    this.formGroup.patchValue({
      titre: ev.titre,
      dateDebut: ev.dateDebut ? ev.dateDebut.substring(0, 16) : '',
      dateFin: ev.dateFin ? ev.dateFin.substring(0, 16) : '',
      lieu: ev.lieu,
      capaciteMax: ev.capaciteMax,
      description: ev.description
    });
    this.isModalOpen = true;
  }

  saveEvent(): void {
    if (this.formGroup.invalid) return;

    if (this.editId) {
      this.evenements.update(list => list.map(e => e.id === this.editId ? { ...e, ...this.formGroup.value } : e));
      this.toast.success('Événement mis à jour.');
    } else {
      const newE: Evenement = {
        id: Date.now(),
        slug: 'ev-' + Date.now(),
        ...this.formGroup.value,
        nbInscrits: 0,
        publie: true,
        organisateur: { id: 1, nom: 'Bureau', prenom: 'Club Info' },
        createdAt: new Date().toISOString()
      };
      this.evenements.update(list => [newE, ...list]);
      this.toast.success('Événement créé avec succès.');
    }
    this.isModalOpen = false;
  }

  deleteEvent(id: number): void {
    this.evenements.update(list => list.filter(e => e.id !== id));
    this.toast.info('Événement supprimé.');
  }
}
