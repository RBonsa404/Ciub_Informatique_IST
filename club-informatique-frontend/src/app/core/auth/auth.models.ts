export const ROLES = ['MEMBRE', 'FORMATEUR', 'RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN', 'DSI'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  MEMBRE: 'Membre',
  FORMATEUR: 'Formateur',
  RESPONSABLE_CLUB: 'Responsable du Club',
  ADMIN: 'Administrateur',
  SUPER_ADMIN: 'Super Admin',
  DSI: 'DSI',
};

/** Du rôle le plus élevé au moins élevé : détermine l'accueil de l'espace et le libellé affiché. */
export const ROLE_PRIORITY: readonly Role[] = ['SUPER_ADMIN', 'ADMIN', 'DSI', 'RESPONSABLE_CLUB', 'FORMATEUR', 'MEMBRE'];

/** Hiérarchie des acteurs : Formateur et Responsable héritent de Membre ; Super Admin hérite d'Administrateur. */
const IMPLIED: Record<Role, readonly Role[]> = {
  MEMBRE: [],
  FORMATEUR: ['MEMBRE'],
  RESPONSABLE_CLUB: ['MEMBRE'],
  ADMIN: [],
  SUPER_ADMIN: ['ADMIN'],
  DSI: [],
};

export function effectiveRoles(roles: readonly Role[]): ReadonlySet<Role> {
  const result = new Set<Role>();
  for (const role of roles) {
    result.add(role);
    for (const implied of IMPLIED[role] ?? []) result.add(implied);
  }
  return result;
}

export function homeRouteFor(roles: readonly Role[]): string {
  const top = ROLE_PRIORITY.find((role) => roles.includes(role));
  switch (top) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return '/espace/admin';
    case 'DSI':
      return '/espace/dsi';
    case 'RESPONSABLE_CLUB':
      return '/espace/gestion';
    case 'FORMATEUR':
      return '/espace/formateur';
    default:
      return '/espace/membre';
  }
}

export interface CurrentUser {
  readonly id: number;
  readonly email: string;
  readonly nom: string;
  readonly prenom: string;
  readonly roles: readonly Role[];
  /** Vrai tant que le mot de passe initial n'a pas été remplacé (Super Admin amorcé). */
  readonly changementMotDePasseRequis?: boolean;
}

/** Réponse d'authentification : le jeton d'accès reste en mémoire ; le jeton de rafraîchissement voyage en cookie HttpOnly. */
export interface SessionResponse {
  readonly accessToken: string;
  readonly expiresIn: number;
  readonly utilisateur: CurrentUser;
}

export interface Credentials {
  readonly email: string;
  readonly motDePasse: string;
}
