import { Routes } from '@angular/router';
import { FeatureFlags } from '../app/core/config/features';

export interface Environment {
  readonly production: boolean;
  /** Préfixe des appels d'API, servi sur la même origine que l'application. */
  readonly apiBaseUrl: string;
  /** Origine publique du site, utilisée pour les URL canoniques. Vide tant que le domaine n'est pas arrêté. */
  readonly siteUrl: string;
  readonly features: FeatureFlags;
  /** Routes internes de recette (page /__design). Tableau vide en production. */
  readonly internalRoutes: Routes;
}
