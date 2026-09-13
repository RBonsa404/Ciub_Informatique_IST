import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { Formation } from '../../core/models/models';

@Component({
  selector: 'app-formations',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto py-16 px-6">
      <div class="mb-12">
        <h1 class="text-4xl font-extrabold font-heading mb-3">Formations & <span class="gradient-text">Parcours</span></h1>
        <p class="text-slate-400">Montez en compétences avec nos modules créés par des experts et formateurs du club.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        @for (f of formations(); track f.id) {
          <div class="glass-card p-6 flex flex-col justify-between">
            <div>
              <span class="badge badge-purple mb-4">{{ f.niveau || 'Tous niveaux' }}</span>
              <h3 class="text-2xl font-bold mb-3">{{ f.titre }}</h3>
              <p class="text-slate-400 text-sm mb-6 leading-relaxed">{{ f.description }}</p>
            </div>
            <div class="border-t border-white/10 pt-4 flex items-center justify-between text-xs text-slate-400">
              <span><i class="fa-regular fa-clock mr-1"></i> {{ f.duree || 10 }}h</span>
              <span>Par {{ f.formateurNomComplet }}</span>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class FormationsComponent implements OnInit {
  formations = signal<Formation[]>([]);

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getFormations().subscribe({
      next: (res) => this.formations.set(res.content),
      error: (err) => console.error(err)
    });
  }
}
