import { uniformFlags } from '../app/core/config/features';
import { Environment } from './environment.model';

/** Production : chaque module est exposé une fois son intégration au backend réel prouvée (docs/recette/integration.md). */
export const environment: Environment = {
  production: true,
  apiBaseUrl: '/api/v1',
  siteUrl: '',
  features: uniformFlags(true),
  internalRoutes: [],
};
