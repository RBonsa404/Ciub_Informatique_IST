import { Component } from '@angular/core';

/**
 * Page d'accueil provisoire -- squelette OUARE. À remplacer par la vraie
 * vitrine institutionnelle (section 1.1 du cahier des charges) par le membre
 * en charge du module accueil/vitrine.
 */
@Component({
  selector: 'app-accueil',
  standalone: true,
  template: `
    <section style="padding: 2rem; text-align: center;">
      <h1>Club Informatique</h1>
      <p>Plateforme en cours de construction.</p>
    </section>
  `,
})
export class AccueilComponent {}
