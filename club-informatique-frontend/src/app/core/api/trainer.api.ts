import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient, Page, PageRequest } from './api-client';
import { Devoir, DevoirPayload, Formation, FormationPayload, Inscription, PointagePayload, Presence, Ressource, RessourcePayload, SessionFormation, SessionPayload } from './models';
import { toPage } from './public.api';

export interface CoursQuery extends PageRequest {
  readonly publie?: boolean | null;
}

/** Gestion des cours par le formateur : formations, séances, supports, devoirs et présences (UC-14 à UC-16). */
@Injectable({ providedIn: 'root' })
export class TrainerApi {
  private readonly api = inject(ApiClient);

  /** Formations gérées par l'utilisateur. Le serveur restreint la liste aux cours du formateur connecté. */
  cours(query: CoursQuery = {}): Observable<Page<Formation>> {
    return this.api.get<unknown>('/gestion/formations', { ...query }).pipe(map(toPage<Formation>));
  }

  formation(id: number): Observable<Formation> {
    return this.api.get<Formation>(`/formations/${id}`);
  }

  creerFormation(payload: FormationPayload): Observable<Formation> {
    return this.api.post<Formation>('/formations', payload);
  }

  modifierFormation(id: number, payload: FormationPayload): Observable<Formation> {
    return this.api.put<Formation>(`/formations/${id}`, payload);
  }

  ajouterSession(formationId: number, payload: SessionPayload): Observable<SessionFormation> {
    return this.api.post<SessionFormation>(`/formations/${formationId}/sessions`, { ...payload, statut: 'PLANIFIEE' });
  }

  supprimerSession(formationId: number, sessionId: number): Observable<void> {
    return this.api.delete<unknown>(`/formations/${formationId}/sessions/${sessionId}`).pipe(map(() => undefined));
  }

  ressources(formationId: number): Observable<readonly Ressource[]> {
    return this.api.get<readonly Ressource[]>(`/ressources/formation/${formationId}`);
  }

  devoirs(formationId: number): Observable<readonly Devoir[]> {
    return this.api.get<readonly Devoir[]>(`/formations/${formationId}/devoirs`);
  }

  creerDevoir(formationId: number, payload: DevoirPayload): Observable<Devoir> {
    return this.api.post<Devoir>(`/formations/${formationId}/devoirs`, payload);
  }

  supprimerDevoir(formationId: number, devoirId: number): Observable<void> {
    return this.api.delete<unknown>(`/formations/${formationId}/devoirs/${devoirId}`).pipe(map(() => undefined));
  }

  creerRessource(payload: RessourcePayload): Observable<Ressource> {
    return this.api.post<Ressource>('/ressources', payload);
  }

  supprimerRessource(id: number): Observable<void> {
    return this.api.delete<unknown>(`/ressources/${id}`).pipe(map(() => undefined));
  }

  inscrits(sessionId: number): Observable<readonly Inscription[]> {
    return this.api.get<readonly Inscription[]>(`/inscriptions/formations/${sessionId}`);
  }

  presences(sessionId: number): Observable<readonly Presence[]> {
    return this.api.get<readonly Presence[]>(`/presences/sessions/${sessionId}`);
  }

  enregistrerPresences(sessionId: number, presences: readonly PointagePayload[]): Observable<readonly Presence[]> {
    return this.api.post<readonly Presence[]>(`/presences/sessions/${sessionId}`, { presences });
  }
}
