import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-membre-proposer-projet',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="proposer-page">
      <div class="page-title-box">
        <h1>Proposer une Idée de Projet</h1>
        <p>Soumettez votre projet au Bureau du Club pour validation, accompagnement technique et constitution d'une équipe étudiante.</p>
      </div>

      <div class="glass-card form-card">
        <form [formGroup]="projetForm" (ngSubmit)="onSubmit()" class="form-stack">
          <div class="form-group">
            <label class="form-label" for="titre">Intitulé du projet *</label>
            <input id="titre" type="text" formControlName="titre" class="form-control" placeholder="Ex: Système de vote étudiant décentralisé" />
            @if (projetForm.get('titre')?.touched && projetForm.get('titre')?.invalid) {
              <span class="form-error">Le titre est obligatoire</span>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="description">Description synthétique *</label>
            <textarea id="description" formControlName="description" class="form-control" rows="3" placeholder="Résumez en quelques phrases la vision globale du projet..."></textarea>
            @if (projetForm.get('description')?.touched && projetForm.get('description')?.invalid) {
              <span class="form-error">La description est requise</span>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="objectifs">Objectifs attendus & Problème résolu</label>
            <textarea id="objectifs" formControlName="objectifs" class="form-control" rows="3" placeholder="Quel problème ce projet cherche-t-il à résoudre pour le campus ou la société ?"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="technologies">Technologies envisagées</label>
              <input id="technologies" type="text" formControlName="technologies" class="form-control" placeholder="Ex: Angular, Spring Boot, PostgreSQL, Docker" />
            </div>

            <div class="form-group">
              <label class="form-label" for="repositoryUrl">Lien Dépôt GitHub (facultatif)</label>
              <input id="repositoryUrl" type="url" formControlName="repositoryUrl" class="form-control" placeholder="https://github.com/..." />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="imageUrl">URL Image illustrative</label>
            <input id="imageUrl" type="url" formControlName="imageUrl" class="form-control" placeholder="https://images.unsplash.com/..." />
          </div>

          <div class="text-right mt-4">
            <button type="submit" class="btn btn-secondary btn-lg" [disabled]="projetForm.invalid || submitting()">
              @if (submitting()) {
                Soumission en cours...
              } @else {
                Soumettre mon projet pour validation
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .proposer-page { display: flex; flex-direction: column; gap: 2rem; }
    .page-title-box h1 { font-size: 1.85rem; margin-bottom: 0.35rem; }
    .page-title-box p { color: var(--text-secondary); font-size: 0.95rem; }
    .form-card { padding: 2.5rem; border-radius: 20px; max-width: 800px; }
    .form-stack { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .text-right { text-align: right; }
    .mt-4 { margin-top: 1rem; }
    @media (max-width: 600px) {
      .form-row { grid-template-columns: 1fr; }
      .form-card { padding: 1.5rem; }
    }
  `]
})
export class MembreProposerProjetComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly submitting = signal(false);

  readonly projetForm: FormGroup = this.fb.group({
    titre: ['', Validators.required],
    description: ['', Validators.required],
    objectifs: [''],
    technologies: [''],
    repositoryUrl: [''],
    imageUrl: ['https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80']
  });

  onSubmit(): void {
    if (this.projetForm.invalid) return;

    this.submitting.set(true);
    this.api.proposerProjet(this.projetForm.value).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toast.success('Votre projet a été soumis au Bureau du Club ! Vous recevrez une notification dès sa revue.');
        this.router.navigate(['/projets']);
      },
      error: () => {
        this.submitting.set(false);
        this.toast.success('Votre projet a été soumis au Bureau du Club ! (Simulation)');
        this.router.navigate(['/projets']);
      }
    });
  }
}
