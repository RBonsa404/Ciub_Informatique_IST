import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Evenement } from '../../core/models/models';

@Component({
  selector: 'app-evenements',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto py-16 px-6">
      <div class="mb-12">
        <h1 class="text-4xl font-extrabold font-heading mb-3">Événements & <span class="gradient-text">Hackathons</span></h1>
        <p class="text-slate-400">Conférences, ateliers pratiques et sessions de networking à venir.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        @for (ev of evenements(); track ev.id) {
          <div class="glass-card p-6 flex flex-col md:flex-row gap-6">
            <img [src]="ev.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87'" class="w-full md:w-48 h-48 rounded-xl object-cover" alt="Event">
            <div class="flex-grow flex flex-col justify-between">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="badge badge-cyan">{{ ev.statut }}</span>
                  <span class="text-xs text-slate-400"><i class="fa-regular fa-calendar mr-1"></i>{{ ev.dateDebut | date:'short' }}</span>
                </div>
                <h3 class="text-2xl font-bold mb-2">{{ ev.titre }}</h3>
                <p class="text-slate-400 text-sm mb-4 line-clamp-2">{{ ev.description }}</p>
                <div class="text-xs text-slate-400 mb-4">
                  <i class="fa-solid fa-location-dot text-purple-400 mr-1"></i> {{ ev.lieu || 'En ligne / Amphi' }}
                </div>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-400">{{ ev.nombreInscrits }} / {{ ev.capaciteMax || '∞' }} inscrits</span>
                <button (click)="inscrire(ev.id)" class="gradient-btn text-xs px-4 py-2">S'inscrire</button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class EvenementsComponent implements OnInit {
  evenements = signal<Evenement[]>([]);

  constructor(private apiService: ApiService, public authService: AuthService) {}

  ngOnInit(): void {
    this.apiService.getEvenements().subscribe({
      next: (res) => this.evenements.set(res.content),
      error: (err) => console.error(err)
    });
  }

  inscrire(id: number) {
    if (!this.authService.isLoggedIn()) {
      alert('Veuillez vous connecter pour vous inscrire à un événement.');
      return;
    }
    this.apiService.inscrireEvenement(id).subscribe({
      next: () => alert('Inscription validée avec succès !'),
      error: (err) => alert(err.error?.message || 'Erreur lors de l\'inscription.')
    });
  }
}
