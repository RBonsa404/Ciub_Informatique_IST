import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  readonly currentYear = new Date().getFullYear();

  readonly quickLinks = [
    { path: '/actualites', label: 'Actualités' },
    { path: '/evenements', label: 'Événements' },
    { path: '/formations', label: 'Formations' },
    { path: '/projets', label: 'Projets' },
    { path: '/ressources', label: 'Ressources' },
  ];

  readonly clubLinks = [
    { path: '/presentation', label: 'Présentation' },
    { path: '/bureau', label: 'Notre Bureau' },
    { path: '/contact', label: 'Nous contacter' },
    { path: '/auth/register', label: "Rejoins-nous" },
  ];

  readonly legalLinks = [
    { path: '/cgu', label: 'CGU' },
    { path: '/privacy', label: 'Confidentialité' },
  ];
}
