export const environment = {
  production: true,
  // Servi par Nginx : le frontend et l'API sont exposés sous le même domaine,
  // donc apiUrl reste relatif (voir deploy/nginx.conf).
  apiUrl: '/api',
};
