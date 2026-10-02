import { toRole } from '../../core/api/admin.api';
import { StatutCompte } from '../../core/api/models';
import { ROLE_LABELS, ROLE_PRIORITY, Role } from '../../core/auth/auth.models';
import { BadgeVariant } from '../../shared/ui/card/card';

export const ROLE_BADGES: Record<Role, BadgeVariant> = {
  MEMBRE: 'neutral',
  FORMATEUR: 'primary',
  RESPONSABLE_CLUB: 'success',
  ADMIN: 'amber',
  SUPER_ADMIN: 'danger',
  DSI: 'primary',
};

export const STATUT_LABELS: Record<StatutCompte, string> = { ACTIF: 'Actif', INACTIF: 'Inactif', SUSPENDU: 'Suspendu', EN_ATTENTE_ACTIVATION: 'En attente' };
export const STATUT_BADGES: Record<StatutCompte, BadgeVariant> = { ACTIF: 'success', INACTIF: 'neutral', SUSPENDU: 'danger', EN_ATTENTE_ACTIVATION: 'amber' };

/** Rôles d'un compte, du plus élevé au moins élevé. */
export function sortRoles(roles: readonly Role[]): readonly Role[] {
  return ROLE_PRIORITY.filter((role) => roles.includes(role));
}

/**
 * Rôles qu'un administrateur peut attribuer. Super Admin et DSI ne sont attribuables que par un Super Admin :
 * un Administrateur ne peut pas élever un compte au-dessus du sien.
 */
export function assignableRoles(actor: readonly Role[]): readonly Role[] {
  const base: Role[] = ['MEMBRE', 'FORMATEUR', 'RESPONSABLE_CLUB', 'ADMIN'];
  return actor.includes('SUPER_ADMIN') ? [...base, 'SUPER_ADMIN', 'DSI'] : base;
}

export interface Share {
  readonly label: string;
  readonly value: number;
  /** Part du total, en pourcentage arrondi. */
  readonly percent: number;
}

/** Répartition triée par valeur décroissante, avec la part de chaque entrée dans le total. */
export function toShares(counts: Readonly<Record<string, number>> | null | undefined, labelOf: (key: string) => string): readonly Share[] {
  const entries = Object.entries(counts ?? {});
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  return entries
    .map(([key, value]) => ({ label: labelOf(key), value, percent: total > 0 ? Math.round((value / total) * 100) : 0 }))
    .sort((a, b) => b.value - a.value);
}

export function roleLabel(key: string): string {
  const role = toRole(key);
  return role ? ROLE_LABELS[role] : key;
}
