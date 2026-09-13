import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Actualite, Evenement, Formation, Projet, Ressource, MessageContact, PageResponse, User } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = '/api';

  constructor(private http: HttpClient) {}

  // Actualités
  getActualites(page = 0, size = 10): Observable<PageResponse<Actualite>> {
    return this.http.get<PageResponse<Actualite>>(`${this.baseUrl}/actualites?page=${page}&size=${size}`);
  }

  getTopActualites(): Observable<Actualite[]> {
    return this.http.get<Actualite[]>(`${this.baseUrl}/actualites/top`);
  }

  getActualiteById(id: number): Observable<Actualite> {
    return this.http.get<Actualite>(`${this.baseUrl}/actualites/${id}`);
  }

  // Événements
  getEvenements(page = 0, size = 10): Observable<PageResponse<Evenement>> {
    return this.http.get<PageResponse<Evenement>>(`${this.baseUrl}/evenements?page=${page}&size=${size}`);
  }

  getUpcomingEvenements(): Observable<Evenement[]> {
    return this.http.get<Evenement[]>(`${this.baseUrl}/evenements/a-venir`);
  }

  inscrireEvenement(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/evenements/${id}/inscription`, {});
  }

  // Formations
  getFormations(page = 0, size = 10): Observable<PageResponse<Formation>> {
    return this.http.get<PageResponse<Formation>>(`${this.baseUrl}/formations?page=${page}&size=${size}`);
  }

  // Projets
  getProjets(page = 0, size = 10): Observable<PageResponse<Projet>> {
    return this.http.get<PageResponse<Projet>>(`${this.baseUrl}/projets?page=${page}&size=${size}`);
  }

  soumettreProjet(projet: Partial<Projet>): Observable<Projet> {
    return this.http.post<Projet>(`${this.baseUrl}/projets/soumettre`, projet);
  }

  // Ressources
  getPublicRessources(page = 0, size = 10): Observable<PageResponse<Ressource>> {
    return this.http.get<PageResponse<Ressource>>(`${this.baseUrl}/ressources/publiques?page=${page}&size=${size}`);
  }

  // Contact
  envoyerContact(msg: MessageContact): Observable<MessageContact> {
    return this.http.post<MessageContact>(`${this.baseUrl}/contact`, msg);
  }

  // Admin
  getAllUsers(page = 0, size = 10): Observable<PageResponse<User>> {
    return this.http.get<PageResponse<User>>(`${this.baseUrl}/admin/users?page=${page}&size=${size}`);
  }

  getAuditLogs(page = 0, size = 20): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/admin/audit-logs?page=${page}&size=${size}`);
  }
}
