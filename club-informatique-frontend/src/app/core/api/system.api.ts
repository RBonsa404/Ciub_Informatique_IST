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
  readonly inscriptionsOuvertes: boolean;
}

export type ConfigurationPayload = Omit<ConfigurationSysteme, 'version'>;

/** Sauvegarde enregistrée par la tâche planifiée (décision D-09). */
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

/** Lit le rapport de conformité ; une liste de contrôles absente donne une liste vide. */
export function toConformite(raw: Record<string, unknown>): Conformite {
  const number = (value: unknown) => (typeof value === 'number' ? value : null);
  return {
    statut: String(raw['statut'] ?? ''),
    versionBackend: (raw['versionBackend'] as string | undefined) ?? null,
    versionJava: (raw['versionJava'] as string | undefined) ?? null,
    comptesActifs: number(raw['comptesActifs']),
    tentativesEchouees: number(raw['tentativesEchouees']),
    verifications: Array.isArray(raw['verifications']) ? (raw['verifications'] as Verification[]) : [],
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

  /** Dernières sauvegardes enregistrées par la tâche planifiée. */
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
