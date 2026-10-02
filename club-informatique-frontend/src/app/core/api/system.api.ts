import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { EntreeJournal } from './admin.api';
import { ApiClient, Page, PageRequest } from './api-client';
import { toPage } from './public.api';

/** Réglages de la plateforme, modifiables par le Super Admin. */
export interface ConfigurationSysteme {
  readonly nomPlateforme: string;
  readonly version?: string | null;
  readonly maintenanceMode: boolean;
  readonly maxLoginAttempts: number;
  readonly lockoutDurationMinutes: number;
  /** Ouverture des inscriptions (champ à ajouter côté serveur). */
  readonly inscriptionsOuvertes?: boolean | null;
}

export type ConfigurationPayload = Omit<ConfigurationSysteme, 'version'>;

/** Sauvegarde enregistrée par la tâche planifiée (point d'accès à créer, décision D-09). */
export interface Sauvegarde {
  readonly id: number;
  readonly date: string;
  readonly tailleOctets?: number | null;
  readonly statut: 'REUSSIE' | 'ECHOUEE';
}

export interface Verification {
  readonly code: string;
  readonly libelle: string;
  readonly conforme: boolean;
}

export interface Conformite {
  readonly statut: string;
  readonly versionBackend?: string | null;
  readonly versionJava?: string | null;
  readonly comptesActifs?: number | null;
  readonly tentativesEchouees?: number | null;
  readonly verifications: readonly Verification[];
}

/** Libellés des contrôles connus du backend existant, qui ne renvoie que des codes. */
const LEGACY_LABELS: Record<string, string> = {
  CHIFFREMENT_MDP_BCRYPT_12: 'Mots de passe chiffrés (BCrypt)',
  AUTHENTIFICATION_JWT_STATELESS: 'Authentification par jeton, sans session serveur',
  JOURNAL_AUDIT_IMMUTABLE: 'Journal d’audit non modifiable',
  CONFORMITE_RGPD_SOFT_DELETE: 'Suppression logique des données personnelles',
  SEPARATION_ROLES_DSI_SUPERADMIN: 'Séparation des rôles DSI et Super Admin',
  POLITIQUE_RATE_LIMITING_ACTIVE: 'Limitation du débit des requêtes',
};

/**
 * Lit le format cible (liste de contrôles libellés) et celui du backend existant (dictionnaire de codes).
 * Un contrôle sans libellé connu, dont celui de la double authentification (hors périmètre, règle 6.6), n'est pas repris.
 */
export function toConformite(raw: Record<string, unknown>): Conformite {
  const list = raw['verifications'];
  const legacy = raw['verificationsConformite'];
  let verifications: Verification[] = [];
  if (Array.isArray(list)) {
    verifications = list as Verification[];
  } else if (legacy && typeof legacy === 'object') {
    verifications = Object.entries(legacy as Record<string, unknown>)
      .filter(([code]) => LEGACY_LABELS[code] !== undefined)
      .map(([code, value]) => ({ code, libelle: LEGACY_LABELS[code], conforme: value === true }));
  }
  const number = (value: unknown) => (typeof value === 'number' ? value : null);
  return {
    statut: String(raw['statut'] ?? raw['statutSecurite'] ?? ''),
    versionBackend: (raw['versionBackend'] as string | undefined) ?? null,
    versionJava: (raw['versionJava'] as string | undefined) ?? null,
    comptesActifs: number(raw['comptesActifs'] ?? raw['totalComptesActifs']),
    tentativesEchouees: number(raw['tentativesEchouees'] ?? raw['totalTentativesEchouees']),
    verifications,
  };
}

/** Configuration du système (Super Admin, UC-28) et supervision de conformité (DSI, UC-29). */
@Injectable({ providedIn: 'root' })
export class SystemApi {
  private readonly api = inject(ApiClient);

  configuration(): Observable<ConfigurationSysteme> {
    return this.api.get<ConfigurationSysteme>('/admin/system/config');
  }

  enregistrerConfiguration(payload: ConfigurationPayload): Observable<ConfigurationSysteme> {
    return this.api.put<ConfigurationSysteme>('/admin/system/config', payload);
  }

  /** Point d'accès à créer : dernières sauvegardes enregistrées par la tâche planifiée. */
  sauvegardes(): Observable<readonly Sauvegarde[]> {
    return this.api.get<readonly Sauvegarde[]>('/admin/system/sauvegardes', undefined, { silent: true });
  }

  conformite(): Observable<Conformite> {
    return this.api.get<Record<string, unknown>>('/dsi/conformite').pipe(map(toConformite));
  }

  journalConformite(query: PageRequest = {}): Observable<Page<EntreeJournal>> {
    return this.api.get<unknown>('/dsi/conformite/logs', { ...query }).pipe(map(toPage<EntreeJournal>));
  }
}
