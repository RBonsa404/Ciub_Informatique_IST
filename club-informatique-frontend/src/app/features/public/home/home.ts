import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  protected readonly stats = [
    { value: 150, suffix: '+', label: 'Membres Actifs', icon: 'users' },
    { value: 25, suffix: '+', label: 'Formations', icon: 'book' },
    { value: 40, suffix: '+', label: 'Projets Réalisés', icon: 'code' },
    { value: 12, suffix: '', label: 'Événements/An', icon: 'calendar' },
  ];

  protected readonly reasons = [
    {
      num: '01',
      title: 'Apprendre',
      desc: 'Développe tes compétences grâce aux formations et ateliers techniques dispensés par nos formateurs.',
      icon: '🎓',
    },
    {
      num: '02',
      title: 'Collaborer',
      desc: "Travaille avec d'autres étudiants sur des projets technologiques concrets et innovants.",
      icon: '🤝',
    },
    {
      num: '03',
      title: 'Participer',
      desc: 'Prends part aux événements, hackathons et activités du club tout au long de l\'année.',
      icon: '🚀',
    },
    {
      num: '04',
      title: 'Valoriser',
      desc: 'Mets en avant tes projets, tes compétences et ton parcours auprès des entreprises et partenaires.',
      icon: '⭐',
    },
  ];

  protected readonly parcours = [
    { num: '01', title: 'Découvrir', desc: "Découvrir l'univers informatique et les différentes possibilités offertes par le club." },
    { num: '02', title: 'Apprendre', desc: 'Développer progressivement ses connaissances et ses compétences techniques.' },
    { num: '03', title: 'Expérimenter', desc: 'Mettre ses connaissances en pratique et apprendre en réalisant des projets.' },
    { num: '04', title: 'Évoluer', desc: 'Construire son expérience, développer son réseau et préparer ses futurs projets.' },
  ];

  protected readonly formations = [
    { titre: 'Développement Web & GitHub', niveau: 'DEBUTANT', image: '🌐', duree: '40h' },
    { titre: 'Programmation & Base de données', niveau: 'INTERMEDIAIRE', image: '💾', duree: '35h' },
    { titre: 'Cybersécurité', niveau: 'AVANCE', image: '🔒', duree: '30h' },
    { titre: 'Réseaux & Télécommunications', niveau: 'INTERMEDIAIRE', image: '📡', duree: '25h' },
  ];

  protected readonly counters = signal<number[]>([0, 0, 0, 0]);

  ngOnInit(): void {
    this.animateCounters();
  }

  private animateCounters(): void {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);

      this.counters.set(
        this.stats.map(s => Math.round(s.value * eased))
      );

      if (step >= steps) {
        clearInterval(timer);
        this.counters.set(this.stats.map(s => s.value));
      }
    }, interval);
  }
}
