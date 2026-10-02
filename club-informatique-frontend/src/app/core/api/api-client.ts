import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SILENT_ERRORS } from '../http/http-context';

export type QueryValue = string | number | boolean | null | undefined;
export type Query = Record<string, QueryValue | readonly (string | number)[]>;

/** Page de résultats renvoyée par le serveur (pagination uniforme). */
export interface Page<T> {
  readonly content: readonly T[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
}

export interface PageRequest {
  readonly page?: number;
  readonly size?: number;
  readonly sort?: string;
}

/** Point d'accès unique à l'API : chemins relatifs au préfixe configuré, paramètres nuls ignorés. */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);

  /** silent : la requête n'émet aucune notification globale en cas d'échec (donnée d'appoint). */
  get<T>(path: string, query?: Query, options: { silent?: boolean } = {}): Observable<T> {
    return this.http.get<T>(this.url(path), {
      params: toParams(query),
      context: options.silent ? new HttpContext().set(SILENT_ERRORS, true) : undefined,
    });
  }

  post<T>(path: string, body?: unknown): Observable<T> {
    return this.http.post<T>(this.url(path), body ?? null);
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(this.url(path), body);
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http.patch<T>(this.url(path), body);
  }

  delete<T = void>(path: string): Observable<T> {
    return this.http.delete<T>(this.url(path));
  }

  /** Fichier renvoyé par l'API (export, pièce jointe). */
  download(path: string): Observable<Blob> {
    return this.http.get(this.url(path), { responseType: 'blob' });
  }

  private url(path: string): string {
    return `${environment.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }
}

export function toParams(query?: Query): HttpParams {
  let params = new HttpParams();
  if (!query) return params;
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === '') continue;
    if (Array.isArray(value)) {
      for (const item of value) params = params.append(key, String(item));
    } else {
      params = params.set(key, String(value));
    }
  }
  return params;
}
