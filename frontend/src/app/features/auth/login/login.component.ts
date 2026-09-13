import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center px-6 py-12">
      <div class="glass-card p-8 w-full max-w-md">
        <div class="text-center mb-8">
          <div class="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center text-xl mx-auto mb-4 border border-purple-500/30">
            <i class="fa-solid fa-lock"></i>
          </div>
          <h1 class="text-2xl font-bold font-heading mb-2">Espace <span class="gradient-text">Connexion</span></h1>
          <p class="text-slate-400 text-xs">Accédez à vos formations, événements et tableau de bord</p>
        </div>

        @if (errorMessage) {
          <div class="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <i class="fa-solid fa-circle-exclamation"></i>
            <span>{{ errorMessage }}</span>
          </div>
        }

        <form (ngSubmit)="login()" #loginForm="ngForm" class="space-y-5">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-2 uppercase">Email</label>
            <input type="email" [(ngModel)]="email" name="email" required placeholder="nom@exemple.com" class="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500">
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-2 uppercase">Mot de passe</label>
            <input type="password" [(ngModel)]="password" name="password" required placeholder="••••••••" class="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500">
          </div>

          @if (requiresTotp) {
            <div>
              <label class="block text-xs font-semibold text-purple-400 mb-2 uppercase">Code 2FA (Authenticator)</label>
              <input type="text" [(ngModel)]="totpCode" name="totpCode" required placeholder="123456" class="w-full bg-slate-900/80 border border-purple-500/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 text-center tracking-widest font-mono">
            </div>
          }

          <button type="submit" [disabled]="!loginForm.valid" class="gradient-btn w-full justify-center py-3.5 text-sm">
            <span>Se Connecter</span>
            <i class="fa-solid fa-arrow-right"></i>
          </button>
        </form>

        <div class="mt-8 text-center text-xs text-slate-400 border-t border-white/5 pt-6">
          Pas encore inscrit ? <a routerLink="/register" class="text-purple-400 hover:underline font-semibold">Créer un compte</a>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  totpCode = '';
  requiresTotp = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    this.errorMessage = '';
    this.authService.login({ email: this.email, password: this.password, totpCode: this.totpCode }).subscribe({
      next: (res) => {
        if (res.requiresTotp) {
          this.requiresTotp = true;
          this.errorMessage = 'Veuillez saisir votre code d\'authentification 2FA.';
        } else {
          const role = this.authService.getUserRole();
          if (['ADMINISTRATEUR', 'SUPERADMIN', 'DSI'].includes(role)) {
            this.router.navigate(['/dashboard/admin']);
          } else {
            this.router.navigate(['/dashboard/membre']);
          }
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Identifiants invalides';
      }
    });
  }
}
