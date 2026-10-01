import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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

  get<T>(path: string, query?: Query): Observable<T> {
    return this.http.get<T>(this.url(path), { params: toParams(query) });
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
