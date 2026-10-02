import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient, Page, PageRequest } from './api-client';
import { Actualite, Categorie, ContactPayload, Evenement, Formation, Inscription, MembreBureau, PageInfo, Projet, Ressource, TypeRessource } from './models';

export interface ListQuery extends PageRequest {
  readonly search?: string;
  readonly categorieId?: number | null;
}

/** Accès aux contenus publics et aux actions d'inscription d'un membre. */
@Injectable({ providedIn: 'root' })
export class PublicApi {
  private readonly api = inject(ApiClient);

  pageInfo(slug: string): Observable<PageInfo> {
    return this.api.get<PageInfo>(`/pages/${encodeURIComponent(slug)}`);
  }

  /** Composition du bureau, triée par ordre d'affichage. */
  bureau(): Observable<readonly MembreBureau[]> {
    return this.api.get<readonly MembreBureau[]>('/bureau');
  }

  categories(): Observable<readonly Categorie[]> {
    return this.api.get<readonly Categorie[]>('/categories');
  }

  actualites(query: ListQuery = {}): Observable<Page<Actualite>> {
    return this.api.get<unknown>('/actualites', { ...query }).pipe(map(toPage<Actualite>));
  }

  actualite(slug: string): Observable<Actualite> {
    return this.api.get<Actualite>(`/actualites/slug/${encodeURIComponent(slug)}`);
  }

  evenements(query: ListQuery & { aVenir?: boolean } = {}): Observable<Page<Evenement>> {
    return this.api.get<unknown>('/evenements', { ...query }).pipe(map(toPage<Evenement>));
  }

  evenement(slug: string): Observable<Evenement> {
    return this.api.get<Evenement>(`/evenements/slug/${encodeURIComponent(slug)}`);
  }

  formations(query: ListQuery & { niveau?: string } = {}): Observable<Page<Formation>> {
    return this.api.get<unknown>('/formations', { ...query }).pipe(map(toPage<Formation>));
  }

  formation(slug: string): Observable<Formation> {
    return this.api.get<Formation>(`/formations/slug/${encodeURIComponent(slug)}`);
  }

  projets(query: ListQuery = {}): Observable<Page<Projet>> {
    return this.api.get<unknown>('/projets', { ...query }).pipe(map(toPage<Projet>));
  }

  projet(slug: string): Observable<Projet> {
    return this.api.get<Projet>(`/projets/slug/${encodeURIComponent(slug)}`);
  }

  ressourcesPubliques(query: ListQuery & { type?: TypeRessource } = {}): Observable<Page<Ressource>> {
    return this.api.get<unknown>('/ressources/publiques', { ...query }).pipe(map(toPage<Ressource>));
  }

  envoyerContact(payload: ContactPayload): Observable<void> {
    return this.api.post<unknown>('/contact', payload).pipe(map(() => undefined));
  }

  // --- Actions d'un membre connecté (UC-09) ---

  mesInscriptions(query: PageRequest = {}): Observable<Page<Inscription>> {
    return this.api.get<unknown>('/inscriptions/me', { ...query }).pipe(map(toPage<Inscription>));
  }

  inscrireEvenement(evenementId: number): Observable<Inscription> {
    return this.api.post<Inscription>(`/inscriptions/evenements/${evenementId}`);
  }

  inscrireSession(sessionId: number): Observable<Inscription> {
    return this.api.post<Inscription>(`/inscriptions/formations/${sessionId}`);
  }

  annulerInscription(inscriptionId: number): Observable<void> {
    return this.api.delete<unknown>(`/inscriptions/${inscriptionId}`).pipe(map(() => undefined));
  }
}

/** Lit l'enveloppe de pagination du contrat ; une réponse sans contenu donne une page vide. */
export function toPage<T>(raw: unknown): Page<T> {
  const r = (raw ?? {}) as Record<string, unknown>;
  const content = Array.isArray(r['content']) ? (r['content'] as T[]) : [];
  return {
    content,
    page: Number(r['page'] ?? 0),
    size: Number(r['size'] ?? content.length),
    totalElements: Number(r['totalElements'] ?? content.length),
    totalPages: Number(r['totalPages'] ?? (content.length ? 1 : 0)),
  };
}
