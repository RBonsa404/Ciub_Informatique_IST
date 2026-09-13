import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { Ressource } from '../../core/models/models';

@Component({
  selector: 'app-ressources',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto py-16 px-6">
      <div class="mb-12">
        <h1 class="text-4xl font-extrabold font-heading mb-3">Bibliothèque Tech & <span class="gradient-text">Ressources</span></h1>
        <p class="text-slate-400">PDFs, documentations, dépôts et tutoriels sélectionnés par le club.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        @for (r of ressources(); track r.id) {
          <div class="glass-card p-6 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="badge badge-cyan">{{ r.type || 'DOCUMENT' }}</span>
                <span class="text-xs text-slate-500">{{ r.visibilite }}</span>
              </div>
              <h3 class="text-xl font-bold mb-2">{{ r.titre }}</h3>
              <p class="text-slate-400 text-xs mb-4">Catégorie: {{ r.categorieNom || 'Général' }}</p>
            </div>
            <a [href]="r.url" target="_blank" class="gradient-btn text-xs text-center justify-center">
              <span>Consulter / Télécharger</span>
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
          </div>
        }
      </div>
    </div>
  `
})
export class RessourcesComponent implements OnInit {
  ressources = signal<Ressource[]>([]);

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getPublicRessources().subscribe({
      next: (res) => this.ressources.set(res.content),
      error: (err) => console.error(err)
    });
  }
}
