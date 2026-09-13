import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-[85vh] flex items-center justify-center px-6 py-12">
      <div class="glass-card p-8 w-full max-w-lg">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold font-heading mb-2">Rejoindre le <span class="gradient-text">Club</span></h1>
          <p class="text-slate-400 text-xs">Créez votre compte membre et accédez à nos formations et événements</p>
        </div>

        @if (errorMessage) {
          <div class="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {{ errorMessage }}
          </div>
        }

        <form (ngSubmit)="register()" #regForm="ngForm" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1 uppercase">Prénom</label>
              <input type="text" [(ngModel)]="form.prenom" name="prenom" required class="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1 uppercase">Nom</label>
              <input type="text" [(ngModel)]="form.nom" name="nom" required class="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500">
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1 uppercase">Email institutionnel / personnel</label>
            <input type="email" [(ngModel)]="form.email" name="email" required class="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500">
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1 uppercase">Mot de passe</label>
            <input type="password" [(ngModel)]="form.password" name="password" minlength="8" required class="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500">
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1 uppercase">Filière</label>
              <input type="text" [(ngModel)]="form.filiere" name="filiere" placeholder="ex. Génie Informatique" class="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1 uppercase">Année d'étude</label>
              <input type="text" [(ngModel)]="form.anneeEtude" name="anneeEtude" placeholder="ex. L3 / M1" class="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500">
            </div>
          </div>

          <div class="flex items-center gap-3 py-2">
            <input type="checkbox" [(ngModel)]="form.consentementRgpd" name="consentement" required id="rgpd" class="w-4 h-4 accent-purple-500">
            <label for="rgpd" class="text-xs text-slate-400">J'accepte le traitement de mes données conformément au RGPD</label>
          </div>

          <button type="submit" [disabled]="!regForm.valid" class="gradient-btn w-full justify-center py-3.5 text-sm">
            <span>Créer mon compte</span>
          </button>
        </form>

        <div class="mt-6 text-center text-xs text-slate-400 border-t border-white/5 pt-4">
          Déjà membre ? <a routerLink="/login" class="text-purple-400 font-semibold hover:underline">Se connecter</a>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  form = {
    nom: '',
    prenom: '',
    email: '',
    password: '',
    filiere: '',
    anneeEtude: '',
    consentementRgpd: false
  };
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  register() {
    this.errorMessage = '';
    this.authService.register(this.form).subscribe({
      next: () => {
        alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors de l\'inscription.';
      }
    });
  }
}
