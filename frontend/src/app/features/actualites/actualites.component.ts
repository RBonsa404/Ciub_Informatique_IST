import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { Actualite } from '../../core/models/models';

@Component({
  selector: 'app-actualites',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto py-16 px-6">
      <div class="mb-12">
        <h1 class="text-4xl font-extrabold font-heading mb-3">Actualités & <span class="gradient-text">Publications</span></h1>
        <p class="text-slate-400">Toutes les annonces officielles, projets et articles tech du club.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        @for (act of actualites(); track act.id) {
          <div class="glass-card overflow-hidden">
            <div class="h-48 bg-slate-800 relative">
              <img [src]="act.imageUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97'" class="w-full h-full object-cover" alt="Image">
              <span class="absolute top-4 left-4 badge badge-purple">{{ act.categorieNom || 'News' }}</span>
            </div>
            <div class="p-6">
              <div class="text-xs text-slate-500 mb-2">{{ act.datePublication | date:'longDate' }}</div>
              <h3 class="text-xl font-bold mb-3">{{ act.titre }}</h3>
              <p class="text-slate-400 text-sm leading-relaxed">{{ act.contenu }}</p>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class ActualitesComponent implements OnInit {
  actualites = signal<Actualite[]>([]);

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getActualites().subscribe({
      next: (res) => this.actualites.set(res.content),
      error: (err) => console.error(err)
    });
  }
}
