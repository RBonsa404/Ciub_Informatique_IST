import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { ApiError } from '../http/problem';
import { ApiClient, Page, PageRequest } from './api-client';
import { Actualite, Devoir, Inscription, NotificationItem, PreferencesCompte, Profil, ProfilUpdate, Ressource, SupportsFormation, TypeNotification } from './models';
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

  /** Dépose la photo de profil (image, 2 Mo au plus) ; elle remplace la précédente. */
  deposerPhoto(fichier: File): Observable<Profil> {
    const corps = new FormData();
    corps.append('fichier', fichier, fichier.name);
    return this.api.post<Profil>('/users/me/photo', corps);
  }

  retirerPhoto(): Observable<Profil> {
    return this.api.delete<Profil>('/users/me/photo');
  }

  changerMotDePasse(ancienMotDePasse: string, nouveauMotDePasse: string): Observable<void> {
    return this.api.put<unknown>('/users/me/password', { ancienMotDePasse, nouveauMotDePasse }).pipe(map(() => undefined));
  }

  preferences(): Observable<PreferencesCompte> {
    return this.api.get<PreferencesCompte>('/users/me/preferences', undefined, { silent: true });
  }

  enregistrerPreferences(preferences: PreferencesCompte): Observable<PreferencesCompte> {
    return this.api.put<PreferencesCompte>('/users/me/preferences', preferences);
  }

  /** Copie des données personnelles du compte (droit d'accès). */
  exporterDonnees(): Observable<Blob> {
    return this.api.download('/users/me/export');
  }

  /** Suppression du compte, confirmée par le mot de passe. */
  supprimerCompte(motDePasse: string): Observable<void> {
    return this.api.post<unknown>('/users/me/suppression', { motDePasse }).pipe(map(() => undefined));
  }

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
    return this.inscriptions({ size: 200, type: 'FORMATION', statut: 'CONFIRMEE' }).pipe(
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
    return this.api.get<readonly Devoir[]>(`/formations/${formationId}/devoirs`).pipe(
      map((devoirs) => {
        const devoir = devoirs.find((d) => d.id === devoirId);
        if (!devoir) throw new ApiError('not-found', 404, 'Ce devoir est introuvable.', null);
        return devoir;
      }),
    );
  }

  notifications(query: NotificationsQuery = {}): Observable<Page<NotificationItem>> {
    return this.api.get<unknown>('/notifications', { ...query }).pipe(map(toPage<NotificationItem>));
  }

  marquerLue(notificationId: number): Observable<void> {
    return this.api.put<unknown>(`/notifications/${notificationId}/lue`, null).pipe(map(() => undefined));
  }

  toutMarquerLu(): Observable<void> {
    return this.api.put<unknown>('/notifications/lire-toutes', null).pipe(map(() => undefined));
  }

  /** Annonces publiées réservées aux membres connectés. */
  publications(query: PageRequest = {}): Observable<Page<Actualite>> {
    return this.api.get<unknown>('/publications', { ...query }, { silent: true }).pipe(map(toPage<Actualite>));
  }

  publication(slug: string): Observable<Actualite> {
    return this.api.get<Actualite>(`/publications/slug/${encodeURIComponent(slug)}`, undefined, { silent: true });
  }

  notificationsNonLues(): Observable<number> {
    return this.api.get<{ nonLues: number }>('/notifications/non-lues/count', undefined, { silent: true }).pipe(map((r) => r.nonLues));
  }

  /** Formations distinctes des inscriptions confirmées. */
  private formationsInscrites(inscriptions: readonly Inscription[]): Observable<readonly { id: number; titre: string }[]> {
    const suivies = inscriptions
      .filter((i) => i.statut === 'CONFIRMEE' && i.formationId)
      .map((i) => ({ id: i.formationId as number, titre: i.formationTitre ?? '' }));
    return of([...new Map(suivies.map((f) => [f.id, f])).values()]);
  }
}
