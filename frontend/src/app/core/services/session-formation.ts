import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SessionFormation {
  id?: number;
  formationId: number;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  capaciteMax: number;
  inscrits?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SessionFormationService {
  private apiUrl = '/api/v1/sessions';

  constructor(private http: HttpClient) {}

  getSessions(): Observable<SessionFormation[]> {
    return this.http.get<SessionFormation[]>(this.apiUrl);
  }

  getSessionsByFormation(formationId: number): Observable<SessionFormation[]> {
    return this.http.get<SessionFormation[]>(`${this.apiUrl}/formation/${formationId}`);
  }

  getSession(id: number): Observable<SessionFormation> {
    return this.http.get<SessionFormation>(`${this.apiUrl}/${id}`);
  }

  createSession(session: SessionFormation): Observable<SessionFormation> {
    return this.http.post<SessionFormation>(this.apiUrl, session);
  }
}
