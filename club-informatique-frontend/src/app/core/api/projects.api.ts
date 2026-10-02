import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient, Page, PageRequest } from './api-client';
import { Projet, ProjetPayload, StatutProjet, SuiviPayload } from './models';
import { toPage } from './public.api';

export interface CompteursProjets {
  readonly enAttente: number;
  readonly valides: number;
  readonly rejetes: number;
}

export interface MesProjetsQuery extends PageRequest {
  readonly statut?: StatutProjet | null;
  readonly categorieId?: number | null;
}

/** Cycle de vie d'un projet : proposition (UC-11), suivi par un formateur (UC-17), validation par le Responsable (UC-20). */
@Injectable({ providedIn: 'root' })
export class ProjectsApi {
  private readonly api = inject(ApiClient);

  proposer(payload: ProjetPayload): Observable<Projet> {
    return this.api.post<Projet>('/projets', payload);
  }

  /** Projets proposés par l'utilisateur, quel que soit leur statut. */
  mesProjets(query: MesProjetsQuery = {}): Observable<Page<Projet>> {
    return this.api.get<unknown>('/projets/mes-projets', { ...query }, { silent: true }).pipe(map(toPage<Projet>));
  }

  /** Projets validés ouverts au suivi (catalogue publié). */
  publies(query: PageRequest & { categorieId?: number | null } = {}): Observable<Page<Projet>> {
    return this.api.get<unknown>('/projets', { ...query }).pipe(map(toPage<Projet>));
  }

  projet(id: number): Observable<Projet> {
    return this.api.get<Projet>(`/projets/${id}`);
  }

  enregistrerSuivi(id: number, payload: SuiviPayload): Observable<Projet> {
    return this.api.put<Projet>(`/projets/${id}/suivi`, payload);
  }

  enAttente(): Observable<readonly Projet[]> {
    return this.api.get<readonly Projet[]>('/projets/en-attente');
  }

  /** Tous les projets, tous statuts confondus (gestion). */
  tous(query: PageRequest & { statut?: StatutProjet | null } = {}): Observable<Page<Projet>> {
    return this.api.get<unknown>('/gestion/projets', { ...query }).pipe(map(toPage<Projet>));
  }

  /** Décompte des projets par décision, calculé par le serveur. */
  compteurs(): Observable<CompteursProjets> {
    return this.api.get<CompteursProjets>('/gestion/projets/compteurs');
  }

  decider(id: number, statut: 'VALIDE' | 'REJETE', motif: string | null): Observable<Projet> {
    return this.api.put<Projet>(`/projets/${id}/validation`, { statut, motif });
  }
}
