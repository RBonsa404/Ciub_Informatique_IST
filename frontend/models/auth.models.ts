export interface UserSummary {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  photo?: string;
  roles: string[];
}

export interface LoginResponse {
  accessToken?: string;
  tokenType?: string;
  expiresIn?: number;
  requires2FA: boolean;
  tempToken?: string;
  user?: UserSummary;
}

export interface UserProfile {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  statut: string;
  photo?: string;
  dateCreation: string;
  roles: string[];
  numeroMembre?: string;
  dateNaissance?: string;
  filiere?: string;
  anneeEtude?: string;
  dateAdhesion?: string;
  biographie?: string;
}

export interface MesDonnees {
  notice: string;
  id: number;
  nom: string;
  prenom: string;
  email: string;
  statut: string;
  dateCreation: string;
  roles: string[];
  numeroMembre?: string;
  dateNaissance?: string;
  filiere?: string;
  anneeEtude?: string;
  dateAdhesion?: string;
  biographie?: string;
}

export interface Role {
  id: number;
  nom: string;
  description: string;
  permissions: Permission[];
}

export interface Permission {
  id: number;
  code: string;
  libelle: string;
}