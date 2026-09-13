import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto py-16 px-6">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-extrabold font-heading mb-3">Contactez le <span class="gradient-text">Bureau</span></h1>
        <p class="text-slate-400">Une question sur les adhésions, un partenariat ou un projet ? Envoyez-nous un message.</p>
      </div>

      <div class="glass-card p-8">
        <form (ngSubmit)="envoyer()" #contactForm="ngForm" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-2 uppercase">Nom complet</label>
              <input type="text" [(ngModel)]="form.nom" name="nom" required class="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-2 uppercase">Email</label>
              <input type="email" [(ngModel)]="form.email" name="email" required class="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500">
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-2 uppercase">Sujet</label>
            <input type="text" [(ngModel)]="form.sujet" name="sujet" required class="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-2 uppercase">Message</label>
            <textarea [(ngModel)]="form.message" name="message" rows="5" required class="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500"></textarea>
          </div>
          <button type="submit" [disabled]="!contactForm.valid" class="gradient-btn w-full justify-center py-4 text-base">Envoyer le message</button>
        </form>
      </div>
    </div>
  `
})
export class ContactComponent {
  form = { nom: '', email: '', sujet: '', message: '' };

  constructor(private apiService: ApiService) {}

  envoyer() {
    this.apiService.envoyerContact(this.form).subscribe({
      next: () => {
        alert('Votre message a bien été envoyé !');
        this.form = { nom: '', email: '', sujet: '', message: '' };
      },
      error: (err) => alert(err.error?.message || 'Erreur lors de l\'envoi.')
    });
  }
}
