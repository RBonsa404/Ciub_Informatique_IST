import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ROLES, Role } from '../auth/auth.models';
import { ApiClient, Page, PageRequest } from './api-client';
import { Categorie, PageInfo, StatutCompte } from './models';
import { toPage } from './public.api';

/** Compte utilisateur vu par l'administration. */
export interface CompteUtilisateur {
  readonly id: number;
  readonly nom: string;
  readonly prenom: string;
  readonly email: string;
  readonly filiere?: string | null;
  readonly statut: StatutCompte;
  readonly roles: readonly Role[];
  /** Compte verrouillé après des échecs de connexion répétés. */
  readonly verrouille?: boolean | null;
  readonly createdAt?: string | null;
}

export interface ComptePayload {
  readonly nom: string;
  readonly prenom: string;
  readonly filiere: string;
}

export interface InvitationPayload {
  readonly nom: string;
  readonly prenom: string;
  readonly email: string;
  readonly role: Role;
}

export interface ComptesQuery extends PageRequest {
  readonly search?: string;
  readonly role?: Role | null;
  readonly statut?: StatutCompte | null;
}

export interface RoleDefinition {
  readonly role: Role;
  readonly description: string;
  readonly permissions: readonly string[];
}

export interface PermissionDefinition {
  readonly nom: string;
  readonly description: string;
}

/** Totaux de l'administration. Le serveur en exclut les comptes de test. */
export interface StatistiquesAdmin {
  readonly totalMembres: number;
  readonly membresActifs: number;
  readonly totalEvenements: number;
  readonly totalFormations: number;
  readonly totalProjets: number;
  readonly totalRessources: number;
  readonly totalMessagesNonTraites: number;
  readonly repartitionMembresParRole: Readonly<Record<string, number>>;
  readonly repartitionProjetsParStatut: Readonly<Record<string, number>>;
}

export type GraviteAlerte = 'FAIBLE' | 'MOYENNE' | 'CRITIQUE';

export interface AlerteSecurite {
  readonly typeAlerte: string;
  readonly description: string;
  readonly utilisateurCible?: string | null;
  /** Identifiant du compte concerné, absent quand l’alerte vise une adresse inconnue. */
  readonly utilisateurId?: number | null;
  readonly gravite: GraviteAlerte;
}

export interface EntreeJournal {
  readonly id: number;
  readonly action: string;
  readonly description?: string | null;
  readonly utilisateurEmail?: string | null;
  readonly ipAddress?: string | null;
  readonly dateAction: string;
  readonly statut: string;
}

export interface JournalQuery extends PageRequest {
  readonly utilisateur?: string;
  readonly statut?: string | null;
}

export interface CategoriePayload {
  readonly nom: string;
  readonly description: string;
  readonly couleur: string;
}

/** Rôle connu de l'application, ou rien. */
export function toRole(value: string): Role | null {
  return (ROLES as readonly string[]).includes(value) ? (value as Role) : null;
}

const toRoles = (values: readonly string[] | null | undefined): Role[] => (values ?? []).map(toRole).filter((role): role is Role => role !== null);

/** Administration : comptes, rôles, catégories, statistiques, sécurité et journal (UC-23 à UC-27). */
@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly api = inject(ApiClient);

  comptes(query: ComptesQuery = {}): Observable<Page<CompteUtilisateur>> {
    return this.api.get<unknown>('/admin/users', { ...query }).pipe(
      map(toPage<RawCompte>),
      map((page) => ({ ...page, content: page.content.map((raw) => this.toCompte(raw)) })),
    );
  }

  compte(id: number): Observable<CompteUtilisateur> {
    return this.api.get<RawCompte>(`/admin/users/${id}`).pipe(map((raw) => this.toCompte(raw)));
  }

  modifierCompte(id: number, payload: ComptePayload): Observable<CompteUtilisateur> {
    return this.api.put<RawCompte>(`/admin/users/${id}`, payload).pipe(map((raw) => this.toCompte(raw)));
  }

  changerRoles(id: number, roles: readonly Role[]): Observable<CompteUtilisateur> {
    return this.api.put<RawCompte>(`/admin/users/${id}/roles`, { roles }).pipe(map((raw) => this.toCompte(raw)));
  }

  changerStatut(id: number, statut: StatutCompte): Observable<CompteUtilisateur> {
    return this.api.patch<RawCompte>(`/admin/users/${id}/status`, { statut }).pipe(map((raw) => this.toCompte(raw)));
  }

  /** Lève le verrouillage posé après des échecs de connexion. */
  deverrouiller(id: number): Observable<void> {
    return this.api.post<unknown>(`/admin/users/${id}/deverrouillage`).pipe(map(() => undefined));
  }

  /** Le destinataire choisit lui-même son mot de passe par un lien à usage unique. */
  inviter(payload: InvitationPayload): Observable<void> {
    return this.api.post<unknown>('/admin/users/invitations', payload).pipe(map(() => undefined));
  }

  roles(): Observable<readonly RoleDefinition[]> {
    return this.api.get<readonly { nom: string; description?: string | null; permissions?: readonly string[] | null }[]>('/admin/roles').pipe(
      map((list) =>
        list.flatMap((raw) => {
          const role = toRole(raw.nom);
          return role ? [{ role, description: raw.description ?? '', permissions: raw.permissions ?? [] }] : [];
        }),
      ),
    );
  }

  permissions(): Observable<readonly PermissionDefinition[]> {
    return this.api.get<readonly PermissionDefinition[]>('/admin/permissions');
  }

  statistiques(): Observable<StatistiquesAdmin> {
    return this.api.get<StatistiquesAdmin>('/admin/statistiques');
  }

  alertes(): Observable<readonly AlerteSecurite[]> {
    return this.api.get<readonly AlerteSecurite[]>('/admin/security/alerts');
  }

  journal(query: JournalQuery = {}): Observable<Page<EntreeJournal>> {
    return this.api.get<unknown>('/admin/security/audit-logs', { ...query }).pipe(map(toPage<EntreeJournal>));
  }

  creerCategorie(payload: CategoriePayload): Observable<Categorie> {
    return this.api.post<Categorie>('/categories', payload);
  }

  modifierCategorie(id: number, payload: CategoriePayload): Observable<Categorie> {
    return this.api.put<Categorie>(`/categories/${id}`, payload);
  }

  /** Rédaction d'une page d'information (accueil, présentation). */
  redigerPage(slug: string, payload: { readonly titre: string; readonly contenu: string }): Observable<PageInfo> {
    return this.api.put<PageInfo>(`/pages/${encodeURIComponent(slug)}`, payload);
  }

  supprimerCategorie(id: number): Observable<void> {
    return this.api.delete<unknown>(`/categories/${id}`).pipe(map(() => undefined));
  }

  private toCompte(raw: RawCompte): CompteUtilisateur {
    return { id: raw.id, nom: raw.nom, prenom: raw.prenom, email: raw.email, filiere: raw.filiere, statut: raw.statut, roles: toRoles(raw.roles), verrouille: raw.verrouille, createdAt: raw.createdAt };
  }
}

interface RawCompte extends Omit<CompteUtilisateur, 'roles'> {
  readonly roles?: readonly string[] | null;
}
