import { uniformFlags } from '../app/core/config/features';
import { Environment } from './environment.model';

/** Production : aucun module n'est exposé tant que son intégration n'est pas validée (Phase 4). */
export const environment: Environment = {
  production: true,
  apiBaseUrl: '/api',
  siteUrl: '',
  features: uniformFlags(false),
  internalRoutes: [],
};
