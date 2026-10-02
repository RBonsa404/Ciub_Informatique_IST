import { DOCUMENT, isPlatformServer } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';
import { PLATFORM_ID, inject } from '@angular/core';
import { EMPTY } from 'rxjs';

/**
 * Pendant le pré-rendu (construction), aucune donnée n'est demandée : la requête se termine sans réponse et la zone
 * qui l'a émise reste à l'état de chargement. Chaque lecture ainsi différée est inscrite dans la page comme
 * préchargement : le navigateur la demandera dès l'arrivée de la page, sans attendre le démarrage de l'application,
 * qui retrouvera la réponse déjà reçue.
 */
export const prerenderInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isPlatformServer(inject(PLATFORM_ID))) return next(req);
  if (req.method === 'GET') {
    const document = inject(DOCUMENT);
    const lien = document.createElement('link');
    lien.setAttribute('rel', 'preload');
    lien.setAttribute('as', 'fetch');
    lien.setAttribute('crossorigin', 'anonymous');
    lien.setAttribute('href', req.urlWithParams);
    document.head.appendChild(lien);
  }
  return EMPTY;
};
