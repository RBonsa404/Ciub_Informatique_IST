import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient, Page, PageRequest } from './api-client';
import { Evenement, EvenementPayload, Formation, Inscription, StatutInscription } from './models';
import { toPage } from './public.api';

export interface EvenementsQuery extends PageRequest {
  /** Bornes de date (AAAA-MM-JJ), à ajouter côté serveur. */
  readonly du?: string;
  readonly au?: string;
}

/** Gestion du club par le Responsable : événements, inscriptions et listes d'attente (UC-19 à UC-21). */
@Injectable({ providedIn: 'root' })
export class ManagementApi {
  private readonly api = inject(ApiClient);

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
