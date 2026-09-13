import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Actualite, Evenement } from '../../core/models/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Hero Section -->
    <section class="relative py-24 px-6 overflow-hidden">
      <div class="max-w-7xl mx-auto text-center relative z-10">
        <span class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-8 backdrop-blur-md">
          <i class="fa-solid fa-sparkles"></i>
          Saison 2026 — Les Inscriptions Sont Ouvertes
        </span>
        <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight font-heading mb-6 max-w-4xl mx-auto leading-tight">
          Façonnez l'Avenir du <span class="gradient-text">Développement & Cyber</span>
        </h1>
        <p class="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          Rejoignez la plus grande communauté d'étudiants passionnés par le code, l'IA, la cybersécurité et l'architecture logicielle.
        </p>
        <div class="flex flex-wrap justify-center gap-4">
          <a routerLink="/register" class="gradient-btn text-base px-8 py-4 rounded-xl shadow-lg shadow-purple-600/30">
            <span>Devenir Membre</span>
            <i class="fa-solid fa-arrow-right"></i>
          </a>
          <a routerLink="/evenements" class="glass-card px-8 py-4 text-base font-semibold text-slate-200 hover:text-white rounded-xl">
            <span>Explorer les Événements</span>
          </a>
        </div>
      </div>
    </section>

    <!-- Stats Bar -->
    <section class="py-12 border-y border-white/5 bg-[#0b101d]/50 backdrop-blur-md px-6">
      <div class="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        <div>
          <div class="text-4xl font-extrabold text-white font-heading mb-1">500+</div>
          <div class="text-slate-400 text-sm">Membres Actifs</div>
        </div>
        <div>
          <div class="text-4xl font-extrabold text-cyan-400 font-heading mb-1">45+</div>
          <div class="text-slate-400 text-sm">Ateliers & Formations</div>
        </div>
        <div>
          <div class="text-4xl font-extrabold text-purple-400 font-heading mb-1">12</div>
          <div class="text-slate-400 text-sm">Projets Innovants</div>
        </div>
        <div>
          <div class="text-4xl font-extrabold text-pink-400 font-heading mb-1">98%</div>
          <div class="text-slate-400 text-sm">Satisfaction</div>
        </div>
      </div>
    </section>

    <!-- Top Actualités -->
    <section class="py-20 px-6 max-w-7xl mx-auto">
      <div class="flex items-center justify-between mb-12">
        <div>
          <h2 class="text-3xl font-bold font-heading">Dernières <span class="gradient-text">Actualités</span></h2>
          <p class="text-slate-400 text-sm mt-1">Restez informé des activités du club</p>
        </div>
        <a routerLink="/actualites" class="text-purple-400 font-semibold text-sm hover:underline flex items-center gap-2">
          <span>Voir tout</span>
          <i class="fa-solid fa-chevron-right text-xs"></i>
        </a>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        @for (act of actualites(); track act.id) {
          <div class="glass-card overflow-hidden group">
            <div class="h-48 bg-slate-800 relative overflow-hidden">
              <img [src]="act.imageUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="News Image">
              <span class="absolute top-4 left-4 badge badge-purple">{{ act.categorieNom || 'Actualité' }}</span>
            </div>
            <div class="p-6">
              <div class="text-xs text-slate-500 mb-2">{{ act.datePublication | date:'mediumDate' }}</div>
              <h3 class="text-xl font-bold mb-3 group-hover:text-purple-400 transition-colors">{{ act.titre }}</h3>
              <p class="text-slate-400 text-sm line-clamp-3 leading-relaxed mb-4">{{ act.contenu }}</p>
              <div class="text-xs text-slate-500 flex items-center gap-2">
                <i class="fa-regular fa-user"></i>
                <span>{{ act.auteurNomComplet }}</span>
              </div>
            </div>
          </div>
        }
      </div>
    </section>
  `
})
export class HomeComponent implements OnInit {
  actualites = signal<Actualite[]>([]);

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getTopActualites().subscribe({
      next: (res) => this.actualites.set(res),
      error: (err) => console.error(err)
    });
  }
}
