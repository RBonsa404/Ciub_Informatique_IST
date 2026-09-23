import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Formation, StatistiquesPubliques } from '../../../core/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly apiService = inject(ApiService);

  protected readonly statsList = signal([
    { key: 'membres', target: 0, label: 'Membres Inscrits', icon: 'users' },
    { key: 'formations', target: 0, label: 'Formations Planifiées', icon: 'book' },
    { key: 'projets', target: 0, label: 'Projets en Cours', icon: 'code' },
    { key: 'evenements', target: 0, label: 'Événements Organisés', icon: 'calendar' },
  ]);

  protected readonly counters = signal<number[]>([0, 0, 0, 0]);
  protected readonly formations = signal<Formation[]>([]);
  protected readonly loadingFormations = signal<boolean>(true);

  protected readonly reasons = [
    {
      num: '01',
      title: 'Apprendre',
      desc: 'Développe tes compétences grâce aux formations et ateliers techniques dispensés par nos formateurs.',
      iconKey: 'graduation',
    },
    {
      num: '02',
      title: 'Collaborer',
      desc: "Travaille avec d'autres étudiants sur des projets technologiques concrets et innovants.",
      iconKey: 'users',
    },
    {
      num: '03',
      title: 'Participer',
      desc: 'Prends part aux événements, hackathons et activités du club tout au long de l\'année.',
      iconKey: 'rocket',
    },
    {
      num: '04',
      title: 'Valoriser',
      desc: 'Mets en avant tes projets, tes compétences et ton parcours auprès des entreprises et partenaires.',
      iconKey: 'star',
    },
  ];

  protected readonly parcours = [
    { num: '01', title: 'Découvrir', desc: "Découvrir l'univers informatique et les différentes possibilités offertes par le club." },
    { num: '02', title: 'Apprendre', desc: 'Développer progressivement ses connaissances et ses compétences techniques.' },
    { num: '03', title: 'Expérimenter', desc: 'Mettre ses connaissances en pratique et apprendre en réalisant des projets.' },
    { num: '04', title: 'Évoluer', desc: 'Construire son expérience, développer son réseau et préparer ses futurs projets.' },
  ];

  ngOnInit(): void {
    this.loadRealStats();
    this.loadFormations();
  }

  private loadRealStats(): void {
    this.apiService.getStatistiquesPubliques().subscribe({
      next: (data: StatistiquesPubliques) => {
        const stats = [
          { key: 'membres', target: data.totalMembres || 0, label: 'Membres Inscrits', icon: 'users' },
          { key: 'formations', target: data.totalFormations || 0, label: 'Formations Planifiées', icon: 'book' },
          { key: 'projets', target: data.totalProjets || 0, label: 'Projets en Cours', icon: 'code' },
          { key: 'evenements', target: data.totalEvenements || 0, label: 'Événements Organisés', icon: 'calendar' },
        ];
        this.statsList.set(stats);
        this.animateCounters(stats.map(s => s.target));
      },
      error: () => {
        // En cas d'indisponibilité, affichage zéro honnête
        this.counters.set([0, 0, 0, 0]);
      }
    });
  }

  private loadFormations(): void {
    this.loadingFormations.set(true);
    this.apiService.getFormations(0, 4).subscribe({
      next: (page) => {
        this.formations.set(page.content || []);
        this.loadingFormations.set(false);
      },
      error: () => {
        this.formations.set([]);
        this.loadingFormations.set(false);
      }
    });
  }

  private animateCounters(targets: number[]): void {
    const hasNonZero = targets.some(t => t > 0);
    if (!hasNonZero) {
      this.counters.set(targets);
      return;
    }

    const duration = 1200;
    const steps = 30;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);

      this.counters.set(
        targets.map(val => Math.round(val * eased))
      );

      if (step >= steps) {
        clearInterval(timer);
        this.counters.set(targets);
      }
    }, interval);
  }
}
