import { uniformFlags } from '../app/core/config/features';
import { Environment } from './environment.model';

/** Développement : tous les modules sont visibles pour la recette visuelle ; la page /__design est disponible. */
export const environment: Environment = {
  production: false,
  apiBaseUrl: '/api/v1',
  siteUrl: '',
  features: uniformFlags(true),
  internalRoutes: [
    {
      path: '__design',
      loadChildren: () => import('../app/pages/design/design.routes').then((m) => m.DESIGN_ROUTES),
    },
  ],
};
