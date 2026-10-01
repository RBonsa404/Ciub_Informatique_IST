import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient, Page, PageRequest } from './api-client';
import { Actualite, ActualitePayload, Evenement, EvenementPayload, Formation, Inscription, NotificationGlobalePayload, StatutInscription } from './models';
import { toPage } from './public.api';

export interface ActualitesQuery extends PageRequest {
  /** Filtre de publication, à ajouter côté serveur. */
  readonly publie?: boolean | null;
}

export interface EvenementsQuery extends PageRequest {
  /** Bornes de date (AAAA-MM-JJ), à ajouter côté serveur. */
  readonly du?: string;
  readonly au?: string;
}

/** Gestion du club par le Responsable : événements, inscriptions et listes d'attente (UC-19 à UC-21). */
@Injectable({ providedIn: 'root' })
export class ManagementApi {
  private readonly api = inject(ApiClient);

  /** Toutes les actualités, publiées ou non. */
  actualites(query: ActualitesQuery = {}): Observable<Page<Actualite>> {
    return this.api.get<unknown>('/actualites/admin/all', { ...query }).pipe(map(toPage<Actualite>));
  }

  actualite(id: number): Observable<Actualite> {
    return this.api.get<Actualite>(`/actualites/${id}`);
  }

  creerActualite(payload: ActualitePayload): Observable<Actualite> {
    return this.api.post<Actualite>('/actualites', payload);
  }

  modifierActualite(id: number, payload: ActualitePayload): Observable<Actualite> {
    return this.api.put<Actualite>(`/actualites/${id}`, payload);
  }

  /** Publie un brouillon ou retire une actualité publiée. */
  basculerPublication(id: number): Observable<Actualite> {
    return this.api.patch<Actualite>(`/actualites/${id}/publication`, null);
  }

  supprimerActualite(id: number): Observable<void> {
    return this.api.delete<unknown>(`/actualites/${id}`).pipe(map(() => undefined));
  }

  /** Diffuse une notification à tous les membres actifs (UC-22). */
  diffuserNotification(payload: NotificationGlobalePayload): Observable<void> {
    return this.api.post<unknown>('/notifications/globales', payload).pipe(map(() => undefined));
  }

  /** Tous les événements, publiés ou non. */
  evenements(query: EvenementsQuery = {}): Observable<Page<Evenement>> {
    return this.api.get<unknown>('/evenements/admin/all', { ...query }).pipe(map(toPage<Evenement>));
  }

  creerEvenement(payload: EvenementPayload): Observable<Evenement> {
    return this.api.post<Evenement>('/evenements', payload);
  }

  modifierEvenement(id: number, payload: EvenementPayload): Observable<Evenement> {
    return this.api.put<Evenement>(`/evenements/${id}`, payload);
  }

  supprimerEvenement(id: number): Observable<void> {
    return this.api.delete<unknown>(`/evenements/${id}`).pipe(map(() => undefined));
  }

  /** Toutes les formations, pour le choix d'une séance. */
  formations(query: PageRequest = {}): Observable<Page<Formation>> {
    return this.api.get<unknown>('/formations/admin/all', { ...query }).pipe(map(toPage<Formation>));
  }

  inscritsEvenement(evenementId: number): Observable<readonly Inscription[]> {
    return this.api.get<readonly Inscription[]>(`/inscriptions/evenements/${evenementId}`);
  }

  inscritsSession(sessionId: number): Observable<readonly Inscription[]> {
    return this.api.get<readonly Inscription[]>(`/inscriptions/formations/${sessionId}`);
  }

  changerStatutInscription(inscriptionId: number, statut: StatutInscription, motif?: string): Observable<Inscription> {
    return this.api.put<Inscription>(`/inscriptions/${inscriptionId}/statut`, { statut, motif: motif ?? null });
  }
}
