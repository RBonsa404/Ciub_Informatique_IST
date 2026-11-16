import { uniformFlags } from '../app/core/config/features';
import { Environment } from './environment.model';

/**
 * Production sur o2switch : le site (fichiers statiques) est servi par Apache sur informatique.ist-club.bf,
 * l'API tourne ailleurs et répond sur api.ist-club.bf (même site : le cookie de session reste accepté).
 * Construction : npm run build:o2switch (voir docs/deploiement-o2switch.md).
 */
export const environment: Environment = {
  production: true,
  apiBaseUrl: 'https://api.ist-club.bf/api/v1',
  siteUrl: 'https://informatique.ist-club.bf',
  features: uniformFlags(true),
  internalRoutes: [],
};
