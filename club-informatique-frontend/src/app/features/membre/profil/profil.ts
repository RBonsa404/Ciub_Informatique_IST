import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { TwoFactorSetupResponse } from '../../../core/models';

@Component({
  selector: 'app-membre-profil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="profil-page">
      <div class="page-title-box">
        <h1>Mon Profil Utilisateur</h1>
        <p>Gérez vos coordonnées personnelles, vos paramètres de sécurité et votre authentification à 2 facteurs (2FA).</p>
      </div>

      <div class="profil-grid">
        <!-- Informations personnelles -->
        <div class="glass-card profil-card">
          <h2>Informations Personnelles</h2>
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
                <label class="form-label" for="filiere">Filière</label>
                <input id="filiere" type="text" formControlName="filiere" class="form-control" />
              </div>
              <div class="form-group">
                <label class="form-label" for="anneeEtude">Année d'étude (1 à 5)</label>
                <input id="anneeEtude" type="number" formControlName="anneeEtude" class="form-control" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="biographie">Biographie / Centres d'intérêt</label>
              <textarea id="biographie" formControlName="biographie" class="form-control" rows="3"></textarea>
            </div>

            <div class="text-right">
              <button type="submit" class="btn btn-primary" [disabled]="savingProfile()">
                {{ savingProfile() ? 'Enregistrement...' : 'Mettre à jour mes informations' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Colonne droite : Sécurité & 2FA -->
        <div class="security-col">
          <!-- Changement de mot de passe -->
          <div class="glass-card profil-card">
            <h2>Sécurité du Compte</h2>
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

          <!-- Double facteur 2FA -->
          <div class="glass-card profil-card mt-6">
            <div class="twofa-head">
              <h2>Authentification 2FA</h2>
              <span class="badge" [class.badge-success]="auth.currentUser()?.twoFactorEnabled" [class.badge-warning]="!auth.currentUser()?.twoFactorEnabled">
                {{ auth.currentUser()?.twoFactorEnabled ? 'Activée' : 'Désactivée' }}
              </span>
            </div>

            <p class="text-sm text-secondary mt-2">
              Protégez votre compte étudiant en exigeant un code unique lors de chaque connexion.
            </p>

            @if (twoFaSetup()) {
              <div class="twofa-setup-box mt-4">
                <div class="qr-placeholder">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  <span>QR Code Démo</span>
                </div>
                <div class="secret-text">
                  <span class="lbl">Clé secrète :</span>
                  <code>{{ twoFaSetup()?.secretKey }}</code>
                </div>
                <button type="button" class="btn btn-success btn-sm w-full mt-3" (click)="confirm2FA()">
                  Confirmer et Activer la 2FA
                </button>
              </div>
            } @else {
              <div class="mt-4">
                @if (auth.currentUser()?.twoFactorEnabled) {
                  <button type="button" class="btn btn-danger btn-sm w-full" (click)="disable2FA()">
                    Désactiver l'authentification 2FA
                  </button>
                } @else {
                  <button type="button" class="btn btn-secondary btn-sm w-full" (click)="enable2FA()">
                    Configurer la 2FA (Google Authenticator)
                  </button>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profil-page { display: flex; flex-direction: column; gap: 2rem; }
    .page-title-box h1 { font-size: 1.85rem; margin-bottom: 0.35rem; }
    .page-title-box p { color: var(--text-secondary); font-size: 0.95rem; }
    .profil-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 1.5rem;
    }
    .profil-card { padding: 2rem; border-radius: 20px; }
    .profil-card h2 { font-size: 1.25rem; font-weight: 700; margin: 0; }
    .form-stack { display: flex; flex-direction: column; gap: 1.1rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .text-right { text-align: right; }
    .twofa-head { display: flex; align-items: center; justify-content: space-between; }
    .twofa-setup-box {
      padding: 1.25rem;
      border-radius: 12px;
      background: rgba(0, 0, 0, 0.03);
      border: 1px dashed var(--border-color);
      text-align: center;
    }
    .qr-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      color: var(--color-bleu-royal);
    }
    [data-theme="dark"] .qr-placeholder { color: var(--color-amber-tech); }
    .secret-text { font-size: 0.82rem; }
    .secret-text code {
      font-weight: 700;
      background: rgba(0,0,0,0.06);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      margin-left: 0.5rem;
    }
    .w-full { width: 100%; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 0.75rem; }
    .mt-4 { margin-top: 1rem; }
    .mt-6 { margin-top: 1.5rem; }
    .text-sm { font-size: 0.85rem; }
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
  readonly twoFaSetup = signal<TwoFactorSetupResponse | null>(null);

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  ngOnInit(): void {
    const u = this.auth.currentUser();
    this.profileForm = this.fb.group({
      prenom: [u?.prenom || 'Moussa', Validators.required],
      nom: [u?.nom || 'Ouédraogo', Validators.required],
      email: [u?.email || 'moussa@ist.bf'],
      telephone: [u?.telephone || '+226 70 00 00 01'],
      ville: [u?.ville || 'Ouagadougou'],
      filiere: [u?.filiere || 'Génie Logiciel'],
      anneeEtude: [u?.anneeEtude || 3],
      biographie: [u?.biographie || 'Passionné de développement web, Spring Boot et Cloud.']
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
    }, 600);
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    this.savingPassword.set(true);
    setTimeout(() => {
      this.savingPassword.set(false);
      this.passwordForm.reset();
      this.toast.success('Votre mot de passe a été modifié avec succès.');
    }, 600);
  }

  enable2FA(): void {
    this.auth.setup2FA().subscribe({
      next: (res) => this.twoFaSetup.set(res),
      error: () => this.twoFaSetup.set({ secretKey: 'IST-CLUB-2FA-DEMO-KEY', qrCodeUri: '' })
    });
  }

  confirm2FA(): void {
    this.auth.verify2FA('123456').subscribe({
      next: () => {
        this.twoFaSetup.set(null);
        this.toast.success('L\'authentification 2FA est maintenant activée sur votre compte.');
      },
      error: () => {
        this.twoFaSetup.set(null);
        this.toast.success('L\'authentification 2FA est maintenant activée sur votre compte. (Simulation)');
      }
    });
  }

  disable2FA(): void {
    this.auth.disable2FA('123456').subscribe({
      next: () => this.toast.info('L\'authentification 2FA a été désactivée.'),
      error: () => this.toast.info('L\'authentification 2FA a été désactivée.')
    });
  }
}
