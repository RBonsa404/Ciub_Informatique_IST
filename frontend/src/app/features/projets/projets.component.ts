import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { Projet } from '../../core/models/models';

@Component({
  selector: 'app-projets',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto py-16 px-6">
      <div class="mb-12">
        <h1 class="text-4xl font-extrabold font-heading mb-3">Projets <span class="gradient-text">Collaboratifs</span></h1>
        <p class="text-slate-400">Découvrez les réalisations open-source portées par nos membres.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        @for (p of projets(); track p.id) {
          <div class="glass-card p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-2xl font-bold">{{ p.titre }}</h3>
              <span class="badge badge-green">{{ p.statut }}</span>
            </div>
            <p class="text-slate-400 text-sm mb-6 leading-relaxed">{{ p.description }}</p>
            @if (p.lienDepot) {
              <a [href]="p.lienDepot" target="_blank" class="text-xs text-purple-400 hover:underline flex items-center gap-2">
                <i class="fa-brands fa-github"></i>
                <span>Voir le dépôt GitHub</span>
              </a>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class ProjetsComponent implements OnInit {
  projets = signal<Projet[]>([]);

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getProjets().subscribe({
      next: (res) => this.projets.set(res.content),
      error: (err) => console.error(err)
    });
  }
}
