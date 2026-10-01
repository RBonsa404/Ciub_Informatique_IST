import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { ApiError } from '../http/problem';
import { ApiClient, Page, PageRequest } from './api-client';
import { Actualite, Devoir, Formation, Inscription, NotificationItem, PreferencesCompte, Profil, ProfilUpdate, Ressource, SupportsFormation, TypeNotification } from './models';
import { toPage } from './public.api';

export type TypeInscription = 'FORMATION' | 'EVENEMENT';

export interface NotificationsQuery extends PageRequest {
  readonly type?: TypeNotification | null;
  readonly lue?: boolean | null;
}

export interface InscriptionsQuery extends PageRequest {
  readonly type?: TypeInscription | null;
  readonly statut?: Inscription['statut'] | null;
}

/** Accès aux données personnelles de l'utilisateur connecté : profil, inscriptions, supports, notifications. */
@Injectable({ providedIn: 'root' })
export class MemberApi {
  private readonly api = inject(ApiClient);

  profil(): Observable<Profil> {
    return this.api.get<Profil>('/users/me');
  }

  modifierProfil(payload: ProfilUpdate): Observable<Profil> {
    return this.api.put<Profil>('/users/me', payload);
  }

  changerMotDePasse(ancienMotDePasse: string, nouveauMotDePasse: string): Observable<void> {
    return this.api.put<unknown>('/users/me/password', { ancienMotDePasse, nouveauMotDePasse }).pipe(map(() => undefined));
  }

  /** Point d'accès à créer. */
  preferences(): Observable<PreferencesCompte> {
    return this.api.get<PreferencesCompte>('/users/me/preferences', undefined, { silent: true });
  }

  /** Point d'accès à créer. */
  enregistrerPreferences(preferences: PreferencesCompte): Observable<PreferencesCompte> {
    return this.api.put<PreferencesCompte>('/users/me/preferences', preferences);
  }

  /** Point d'accès à créer : copie des données personnelles du compte (droit d'accès). */
  exporterDonnees(): Observable<Blob> {
    return this.api.download('/users/me/export');
  }

  /** Point d'accès à créer : suppression du compte, confirmée par le mot de passe. */
  supprimerCompte(motDePasse: string): Observable<void> {
    return this.api.post<unknown>('/users/me/suppression', { motDePasse }).pipe(map(() => undefined));
  }

  /** Les filtres type et statut sont à ajouter côté serveur. */
  inscriptions(query: InscriptionsQuery = {}): Observable<Page<Inscription>> {
    return this.api.get<unknown>('/inscriptions/me', { ...query }).pipe(map(toPage<Inscription>));
  }

  annulerInscription(inscriptionId: number): Observable<void> {
    return this.api.delete<unknown>(`/inscriptions/${inscriptionId}`).pipe(map(() => undefined));
  }

  /**
   * Supports et devoirs des formations auxquelles le membre est inscrit (inscription confirmée).
   * Le serveur reste seul juge de l'accès à chaque formation.
   */
  supports(): Observable<readonly SupportsFormation[]> {
    return this.inscriptions({ size: 200 }).pipe(
      switchMap((page) => this.formationsInscrites(page.content)),
      switchMap((formations) => (formations.length === 0 ? of([]) : forkJoin(formations.map((f) => this.supportsDe(f.id, f.titre))))),
    );
  }

  supportsDe(formationId: number, formationTitre: string): Observable<SupportsFormation> {
    return forkJoin({
      ressources: this.api.get<readonly Ressource[]>(`/ressources/formation/${formationId}`),
      devoirs: this.api.get<readonly Devoir[]>(`/formations/${formationId}/devoirs`),
    }).pipe(map(({ ressources, devoirs }) => ({ formationId, formationTitre, ressources, devoirs })));
  }

  ressource(id: number): Observable<Ressource> {
    return this.api.get<Ressource>(`/ressources/${id}`);
  }

  devoir(formationId: number, devoirId: number): Observable<Devoir> {
    return forkJoin({
      formation: this.api.get<Formation>(`/formations/${formationId}`),
      devoirs: this.api.get<readonly Devoir[]>(`/formations/${formationId}/devoirs`),
    }).pipe(
      map(({ formation, devoirs }) => {
        const devoir = devoirs.find((d) => d.id === devoirId);
        if (!devoir) throw new ApiError('not-found', 404, 'Ce devoir est introuvable.', null);
        return { ...devoir, formationTitre: formation.titre };
      }),
    );
  }

  /** Les filtres type et lue sont à ajouter côté serveur. */
  notifications(query: NotificationsQuery = {}): Observable<Page<NotificationItem>> {
    return this.api.get<unknown>('/notifications', { ...query }).pipe(map(toPage<NotificationItem>));
  }

  marquerLue(notificationId: number): Observable<void> {
    return this.api.put<unknown>(`/notifications/${notificationId}/lue`, null).pipe(map(() => undefined));
  }

  toutMarquerLu(): Observable<void> {
    return this.api.put<unknown>('/notifications/lire-toutes', null).pipe(map(() => undefined));
  }

  /** Point d'accès à créer : annonces publiées réservées aux membres connectés. */
  publications(query: PageRequest = {}): Observable<Page<Actualite>> {
    return this.api.get<unknown>('/publications', { ...query }, { silent: true }).pipe(map(toPage<Actualite>));
  }

  /** Point d'accès à créer. */
  publication(slug: string): Observable<Actualite> {
    return this.api.get<Actualite>(`/publications/slug/${encodeURIComponent(slug)}`, undefined, { silent: true });
  }

  notificationsNonLues(): Observable<number> {
    return this.api.get<{ nonLues: number }>('/notifications/non-lues/count', undefined, { silent: true }).pipe(map((r) => r.nonLues));
  }

  /**
   * Formations distinctes des inscriptions confirmées. L'inscription porte formationId dans le contrat ;
   * à défaut, la formation est retrouvée par sa session dans le catalogue publié.
   */
  private formationsInscrites(inscriptions: readonly Inscription[]): Observable<readonly { id: number; titre: string }[]> {
    const actives = inscriptions.filter((i) => i.statut === 'CONFIRMEE' && i.sessionFormationId);
    if (actives.length === 0) return of([]);
    const distinct = (list: readonly { id: number; titre: string }[]) => [...new Map(list.map((f) => [f.id, f])).values()];
    if (actives.every((i) => i.formationId)) {
      return of(distinct(actives.map((i) => ({ id: i.formationId as number, titre: i.formationTitre ?? '' }))));
    }
    const sessions = new Set(actives.map((i) => i.sessionFormationId));
    return this.api.get<unknown>('/formations', { search: '', size: 200 }).pipe(
      map((raw) =>
        distinct(
          toPage<Formation>(raw)
            .content.filter((f) => (f.sessions ?? []).some((s) => sessions.has(s.id)))
            .map((f) => ({ id: f.id, titre: f.titre })),
        ),
      ),
    );
  }
}
