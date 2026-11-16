import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';

/** État de la carte du connecté : membre actif après {@link EtatCarte.seuil} séances de formation pointées. */
export interface EtatCarte {
  readonly numeroMembre: string;
  readonly seancesSuivies: number;
  readonly seuil: number;
  readonly actif: boolean;
  readonly joursDesSeances: string;
}

/** Ce que montre le scan d'une carte à n'importe qui : prénom, initiale du nom et statut. */
export interface CarteVerifiee {
  readonly prenom: string;
  readonly initialeNom: string;
  readonly seancesSuivies: number;
  readonly seuil: number;
  readonly actif: boolean;
}

export interface SeanceAPointer {
  readonly id: number;
  readonly formation: string;
  readonly dateDebut: string;
  readonly dateFin: string;
  readonly lieu: string | null;
}

export interface ResultatPointageCarte {
  readonly prenom: string;
  readonly nom: string;
  readonly numeroMembre: string;
  readonly seancesSuivies: number;
  readonly seuil: number;
  readonly actif: boolean;
  readonly dejaPointe: boolean;
}

/** Carte de membre : consultation par le titulaire, vérification d'une carte scannée et pointage par l'équipe. */
@Injectable({ providedIn: 'root' })
export class CarteApi {
  private readonly api = inject(ApiClient);

  maCarte(): Observable<EtatCarte> {
    return this.api.get<EtatCarte>('/users/me/carte');
  }

  imageDeMaCarte(): Observable<Blob> {
    return this.api.download('/users/me/carte.png');
  }

  verifier(jeton: string): Observable<CarteVerifiee> {
    return this.api.get<CarteVerifiee>(`/cartes/${encodeURIComponent(jeton)}`, undefined, { silent: true });
  }

  seancesDuJour(): Observable<readonly SeanceAPointer[]> {
    return this.api.get<readonly SeanceAPointer[]>('/presences/seances-du-jour');
  }

  pointer(seanceId: number, jeton: string): Observable<ResultatPointageCarte> {
    return this.api.post<ResultatPointageCarte>(`/presences/sessions/${seanceId}/carte`, { jeton });
  }
}
