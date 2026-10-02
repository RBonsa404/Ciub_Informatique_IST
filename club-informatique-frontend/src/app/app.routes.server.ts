import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Pages publiques à adresse fixe : leur structure (en-tête, titre, texte d'introduction, pied de page) est pré-rendue
 * à la construction, pour s'afficher sans attendre le JavaScript. Aucune donnée n'y est inscrite : les zones alimentées
 * par l'API sont rendues à l'état de chargement, puis remplies par le navigateur.
 * Les pages dont l'objet est un formulaire (contact, connexion, inscription, mot de passe oublié) ne sont pas pré-rendues :
 * un formulaire affiché avant que l'application ne le prenne en main serait envoyé par le navigateur lui-même.
 */
const PRE_RENDUES = [
  '',
  'presentation',
  'bureau',
  'actualites',
  'evenements',
  'projets',
  'formations',
  'ressources',
  'mentions-legales',
  'confidentialite',
  'conditions-utilisation',
];

export const serverRoutes: ServerRoute[] = [
  ...PRE_RENDUES.map((path): ServerRoute => ({ path, renderMode: RenderMode.Prerender })),
  // Pages de détail, espace connecté et pages contextuelles : rendues par le navigateur.
  { path: '**', renderMode: RenderMode.Client },
];
