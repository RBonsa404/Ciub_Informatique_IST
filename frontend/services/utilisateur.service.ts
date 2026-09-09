import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MesDonnees, UserProfile } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class UtilisateurService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:9000/api/v1/utilisateurs';

  getMyProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`);
  }

  updateMyProfile(data: any): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/me`, data);
  }

  changeMyPassword(ancienMotDePasse: string, nouveauMotDePasse: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/me/password`, { ancienMotDePasse, nouveauMotDePasse });
  }

  getMesDonnees(): Observable<MesDonnees> {
    return this.http.get<MesDonnees>(`${this.apiUrl}/me/donnees`);
  }

  demandeEffacement(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/me`);
  }

  // Admin
  getAllUsers(page = 0, size = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  updateUserStatus(id: number, statut: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/statut`, { statut });
  }

  assignRoles(id: number, roles: string[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/roles`, { roles });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}