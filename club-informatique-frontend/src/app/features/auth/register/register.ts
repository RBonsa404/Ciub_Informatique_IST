import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card glass-card">
        <div class="auth-header">
          <div class="auth-logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          </div>
          <h1 class="auth-title">Rejoindre le Club</h1>
          <p class="auth-subtitle">Créez votre compte membre et accédez à toutes nos activités</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="prenom">Prénom *</label>
              <input id="prenom" type="text" formControlName="prenom" class="form-control" placeholder="Moussa" />
              @if (registerForm.get('prenom')?.touched && registerForm.get('prenom')?.invalid) {
                <span class="form-error">Le prénom est requis</span>
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="nom">Nom *</label>
              <input id="nom" type="text" formControlName="nom" class="form-control" placeholder="Ouédraogo" />
              @if (registerForm.get('nom')?.touched && registerForm.get('nom')?.invalid) {
                <span class="form-error">Le nom est requis</span>
              }
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Adresse E-mail institutionnelle ou personnelle *</label>
            <input id="email" type="email" formControlName="email" class="form-control" placeholder="moussa.ouedraogo@ist.bf" />
            @if (registerForm.get('email')?.touched && registerForm.get('email')?.invalid) {
              <span class="form-error">Veuillez renseigner un email valide</span>
            }
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="filiere">Filière / Spécialité</label>
              <input id="filiere" type="text" formControlName="filiere" class="form-control" placeholder="Ex: Génie Logiciel, Réseaux & Télécoms..." />
            </div>

            <div class="form-group">
              <label class="form-label" for="anneeEtude">Niveau d'étude</label>
              <select id="anneeEtude" formControlName="anneeEtude" class="form-control">
                <option [value]="null">Sélectionnez le niveau</option>
                <option [value]="1">Licence 1</option>
                <option [value]="2">Licence 2</option>
                <option [value]="3">Licence 3</option>
                <option [value]="4">Master 1</option>
                <option [value]="5">Master 2</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="telephone">Téléphone (WhatsApp)</label>
              <input id="telephone" type="tel" formControlName="telephone" class="form-control" placeholder="+226 70 00 00 00" />
            </div>

            <div class="form-group">
              <label class="form-label" for="ville">Ville de résidence</label>
              <input id="ville" type="text" formControlName="ville" class="form-control" placeholder="Ouagadougou" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="password">Mot de passe *</label>
              <input id="password" type="password" formControlName="password" class="form-control" placeholder="••••••••" />
              @if (registerForm.get('password')?.touched && registerForm.get('password')?.invalid) {
                <span class="form-error">Minimum 8 caractères avec majuscule, chiffre et symbole</span>
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="confirmPassword">Confirmer mot de passe *</label>
              <input id="confirmPassword" type="password" formControlName="confirmPassword" class="form-control" placeholder="••••••••" />
              @if (registerForm.errors?.['mismatch'] && registerForm.get('confirmPassword')?.touched) {
                <span class="form-error">Les mots de passe ne correspondent pas</span>
              }
            </div>
          </div>

          <div class="cgu-check">
            <input type="checkbox" id="acceptCgu" formControlName="acceptCgu" />
            <label for="acceptCgu">
              J'accepte les <a routerLink="/cgu" target="_blank">Conditions Générales d'Utilisation</a> et la <a routerLink="/politique-confidentialite" target="_blank">Politique de Confidentialité</a>.
            </label>
          </div>
          @if (registerForm.get('acceptCgu')?.touched && registerForm.get('acceptCgu')?.invalid) {
            <span class="form-error">Vous devez accepter les CGU pour continuer</span>
          }

          <button type="submit" class="btn btn-secondary w-full btn-lg mt-2" [disabled]="registerForm.invalid || loading()">
            @if (loading()) {
              Création du compte...
            } @else {
              Valider mon Inscription
            }
          </button>
        </form>

        <div class="auth-footer">
          <p>
            Vous avez déjà un compte ?
            <a routerLink="/auth/login" class="login-link">Se connecter</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: calc(100vh - 140px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      background: radial-gradient(circle at 50% 30%, rgba(27, 58, 140, 0.12) 0%, transparent 60%);
    }
    .auth-card {
      width: 100%;
      max-width: 620px;
      padding: 2.5rem;
      border-radius: 24px;
    }
    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .auth-logo {
      width: 54px;
      height: 54px;
      border-radius: 14px;
      background: var(--amber-gradient);
      color: #0F172A;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      box-shadow: 0 4px 14px rgba(245, 166, 35, 0.4);
    }
    .auth-title { font-size: 1.8rem; font-weight: 800; margin-bottom: 0.35rem; }
    .auth-subtitle { font-size: 0.85rem; color: var(--text-secondary); }
    .auth-form { display: flex; flex-direction: column; gap: 1.1rem; }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .form-group { display: flex; flex-direction: column; }
    .cgu-check {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      font-size: 0.82rem;
      color: var(--text-secondary);
      margin-top: 0.5rem;
    }
    .cgu-check input { margin-top: 0.2rem; }
    .cgu-check a { color: var(--color-bleu-royal); font-weight: 600; }
    [data-theme="dark"] .cgu-check a { color: var(--color-amber-tech); }
    .w-full { width: 100%; }
    .mt-2 { margin-top: 0.5rem; }
    .auth-footer {
      margin-top: 1.75rem;
      text-align: center;
      font-size: 0.88rem;
      color: var(--text-secondary);
      border-top: 1px solid var(--border-color);
      padding-top: 1.25rem;
    }
    .login-link { font-weight: 600; color: var(--color-bleu-royal); }
    [data-theme="dark"] .login-link { color: var(--color-amber-tech); }
    @media (max-width: 600px) {
      .form-row { grid-template-columns: 1fr; }
      .auth-card { padding: 1.5rem; }
    }
  `]
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly loading = signal(false);

  readonly registerForm: FormGroup = this.fb.group({
    prenom: ['', Validators.required],
    nom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    filiere: [''],
    anneeEtude: [null],
    telephone: [''],
    ville: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    acceptCgu: [false, Validators.requiredTrue]
  }, {
    validators: (form) => {
      const p = form.get('password')?.value;
      const cp = form.get('confirmPassword')?.value;
      return p === cp ? null : { mismatch: true };
    }
  });

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.loading.set(true);
    const { prenom, nom, email, filiere, anneeEtude, telephone, ville, password } = this.registerForm.value;

    this.auth.register({ prenom, nom, email, filiere, anneeEtude, telephone, ville, password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toast.success(`Félicitations ${res.data.prenom} ! Votre compte a été créé avec succès.`);
        this.router.navigate(['/membre/dashboard']);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Erreur lors de la création du compte. Vérifiez vos informations.');
      }
    });
  }
}
