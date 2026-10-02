import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Fichier déposé sur la plateforme. « url » est l'adresse de téléchargement contrôlé. */
export interface Fichier {
  readonly id: string;
  readonly url: string;
  readonly nom: string;
  readonly type: string;
  readonly tailleOctets: number;
}

export interface FichierTelecharge {
  readonly contenu: Blob;
  readonly nom: string;
}

/** Limites appliquées par le serveur, rappelées à l'utilisateur avant l'envoi. */
export const TAILLE_MAXIMALE_OCTETS = 10 * 1024 * 1024;
export const EXTENSIONS_ACCEPTEES = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.zip', '.docx', '.pptx', '.xlsx'] as const;
export const EXTENSIONS_IMAGES = ['.png', '.jpg', '.jpeg', '.webp'] as const;
export const TAILLE_MAXIMALE_PHOTO_OCTETS = 2 * 1024 * 1024;

const FICHIER_DEPOSE = /^(?:\/[\w-]+)*\/fichiers\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;

/** Vrai si l'adresse désigne un fichier déposé sur la plateforme (et non un lien externe). */
export function estFichierDepose(adresse: string | null | undefined): boolean {
  return !!adresse && FICHIER_DEPOSE.test(adresse.trim());
}

/** Dépôt et téléchargement des fichiers. Un fichier réservé ne se télécharge qu'avec la session de l'utilisateur. */
@Injectable({ providedIn: 'root' })
export class FilesApi {
  private readonly http = inject(HttpClient);

  deposer(fichier: File): Observable<Fichier> {
    const corps = new FormData();
    corps.append('fichier', fichier, fichier.name);
    return this.http.post<Fichier>(`${environment.apiBaseUrl}/fichiers`, corps);
  }

  /** Télécharge un fichier déposé avec le jeton de la session ; le nom vient de l'en-tête de la réponse. */
  telecharger(adresse: string): Observable<FichierTelecharge> {
    return this.http.get(adresse.trim(), { responseType: 'blob', observe: 'response' }).pipe(
      map((reponse) => ({ contenu: reponse.body ?? new Blob(), nom: nomDuFichier(reponse.headers.get('Content-Disposition')) })),
    );
  }
}

/** Nom porté par l'en-tête « Content-Disposition » (forme étendue UTF-8 d'abord, puis forme simple). */
export function nomDuFichier(entete: string | null): string {
  if (!entete) return 'fichier';
  const etendu = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(entete);
  if (etendu) {
    try {
      return decodeURIComponent(etendu[1].trim().replace(/^"|"$/g, ''));
    } catch {
      // Nom mal encodé : on se rabat sur la forme simple.
    }
  }
  const simple = /filename="?([^";]+)"?/i.exec(entete);
  return simple ? simple[1].trim() : 'fichier';
}
