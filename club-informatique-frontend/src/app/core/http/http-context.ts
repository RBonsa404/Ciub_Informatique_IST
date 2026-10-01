import { HttpContextToken } from '@angular/common/http';

/** La requête ne porte pas de jeton d'accès et ne déclenche pas de rafraîchissement (connexion, rafraîchissement). */
export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);

/** La requête gère elle-même ses erreurs : aucune notification globale. */
export const SILENT_ERRORS = new HttpContextToken<boolean>(() => false);
