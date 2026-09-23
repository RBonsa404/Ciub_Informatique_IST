import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-membre-profil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="profil-page">
      <div class="page-title-box">
        <h1>Mon Profil Utilisateur</h1>
        <p>Gérez vos coordonnées personnelles, vos informations académiques et la sécurité de votre compte.</p>
      </div>

      <div class="profil-grid">
        <!-- Informations personnelles -->
        <div class="glass-card profil-card">
          <h2>Informations Personnelles & Académiques</h2>
          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="mt-4 form-stack">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="prenom">Prénom</label>
                <input id="prenom" type="text" formControlName="prenom" class="form-control" />
              </div>
              <div class="form-group">
                <label class="form-label" for="nom">Nom</label>
                <input id="nom" type="text" formControlName="nom" class="form-control" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="email">E-mail (non modifiable)</label>
              <input id="email" type="email" formControlName="email" class="form-control" [readOnly]="true" />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="telephone">Téléphone</label>
                <input id="telephone" type="tel" formControlName="telephone" class="form-control" />
              </div>
              <div class="form-group">
                <label class="form-label" for="ville">Ville</label>
                <input id="ville" type="text" formControlName="ville" class="form-control" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="filiere">Filière / Spécialité</label>
                <input id="filiere" type="text" formControlName="filiere" class="form-control" placeholder="Ex: Génie Logiciel" />
              </div>
              <div class="form-group">
                <label class="form-label" for="anneeEtude">Année d'étude (1 à 5)</label>
                <input id="anneeEtude" type="number" formControlName="anneeEtude" class="form-control" min="1" max="5" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="biographie">Biographie / Centres d'intérêt</label>
              <textarea id="biographie" formControlName="biographie" class="form-control" rows="3" placeholder="Parlez-nous de vos passions technologiques..."></textarea>
            </div>

            <div class="text-right">
              <button type="submit" class="btn btn-primary" [disabled]="savingProfile()">
                {{ savingProfile() ? 'Enregistrement...' : 'Mettre à jour mes informations' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Colonne droite : Sécurité du compte -->
        <div class="security-col">
          <!-- Changement de mot de passe -->
          <div class="glass-card profil-card">
            <h2>Sécurité du Compte</h2>
            <p class="text-sm text-secondary mt-1">Modifiez régulièrement votre mot de passe pour garantir la protection de votre compte.</p>
            <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="mt-4 form-stack">
              <div class="form-group">
                <label class="form-label" for="currentPassword">Mot de passe actuel</label>
                <input id="currentPassword" type="password" formControlName="currentPassword" class="form-control" />
              </div>

              <div class="form-group">
                <label class="form-label" for="newPassword">Nouveau mot de passe</label>
                <input id="newPassword" type="password" formControlName="newPassword" class="form-control" />
              </div>

              <div class="form-group">
                <label class="form-label" for="confirmPassword">Confirmez le nouveau mot de passe</label>
                <input id="confirmPassword" type="password" formControlName="confirmPassword" class="form-control" />
              </div>

              <button type="submit" class="btn btn-outline w-full" [disabled]="passwordForm.invalid || savingPassword()">
                {{ savingPassword() ? 'Modification...' : 'Modifier mon mot de passe' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profil-page { display: flex; flex-direction: column; gap: 2rem; }
    .page-title-box h1 { font-size: 1.85rem; font-weight: 800; margin-bottom: 0.35rem; }
    .page-title-box p { color: var(--text-secondary); font-size: 0.95rem; }
    .profil-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 1.75rem;
    }
    .profil-card {
      padding: 2.25rem;
      border-radius: 20px;
      border: 1px solid var(--border-color);
      background: var(--bg-card);
    }
    .profil-card h2 { font-size: 1.25rem; font-weight: 700; margin: 0; color: var(--text-primary); }
    .form-stack { display: flex; flex-direction: column; gap: 1.15rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .text-right { text-align: right; }
    .w-full { width: 100%; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-4 { margin-top: 1.25rem; }
    .text-sm { font-size: 0.85rem; }
    .text-secondary { color: var(--text-secondary); }
    @media (max-width: 900px) {
      .profil-grid { grid-template-columns: 1fr; }
      .form-row { grid-template-columns: 1fr; }
    }
  `]
})
export class MembreProfilComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly savingProfile = signal(false);
  readonly savingPassword = signal(false);

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  ngOnInit(): void {
    const u = this.auth.currentUser();
    this.profileForm = this.fb.group({
      prenom: [u?.prenom || '', Validators.required],
      nom: [u?.nom || '', Validators.required],
      email: [u?.email || ''],
      telephone: [u?.telephone || ''],
      ville: [u?.ville || ''],
      filiere: [u?.filiere || ''],
      anneeEtude: [u?.anneeEtude || null],
      biographie: [u?.biographie || '']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: (f) => f.get('newPassword')?.value === f.get('confirmPassword')?.value ? null : { mismatch: true }
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.savingProfile.set(true);
    setTimeout(() => {
      this.savingProfile.set(false);
      this.toast.success('Vos informations personnelles ont été mises à jour avec succès.');
    }, 500);
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    this.savingPassword.set(true);
    setTimeout(() => {
      this.savingPassword.set(false);
      this.passwordForm.reset();
      this.toast.success('Votre mot de passe a été modifié avec succès.');
    }, 500);
  }
}
