export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  dtype: string;
  statut: 'ACTIF' | 'INACTIF' | 'SUSPENDU';
  photo?: string;
  consentementRgpd: boolean;
  totpEnabled: boolean;
  dateCreation: string;
  derniereConnexion?: string;
  numeroMembre?: string;
  biographie?: string;
  dateAdhesion?: string;
  filiere?: string;
  anneeEtude?: string;
  specialite?: string;
  biographieProfessionnelle?: string;
  fonction?: string;
  niveauAcces?: string;
  roles: string[];
}

export interface LoginResponse {
  token: string;
  type: string;
  id: number;
  nom: string;
  prenom: string;
  email: string;
  dtype: string;
  roles: string[];
  requiresTotp: boolean;
}

export interface Actualite {
  id: number;
  titre: string;
  contenu: string;
  imageUrl?: string;
  dateCreation: string;
  datePublication?: string;
  statut: 'BROUILLON' | 'PUBLIE' | 'ARCHIVE';
  auteurId: number;
  auteurNomComplet: string;
  categorieId?: number;
  categorieNom?: string;
}

export interface Evenement {
  id: number;
  titre: string;
  description?: string;
  dateDebut: string;
  dateFin?: string;
  lieu?: string;
  capaciteMax?: number;
  statut: 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'ANNULE';
  imageUrl?: string;
  organisateurId: number;
  organisateurNomComplet: string;
  categorieId?: number;
  categorieNom?: string;
  dateCreation: string;
  nombreInscrits: number;
}

export interface Formation {
  id: number;
  titre: string;
  description?: string;
  niveau?: string;
  duree?: number;
  statut: 'BROUILLON' | 'PUBLIE' | 'ARCHIVE';
  imageUrl?: string;
  formateurId: number;
  formateurNomComplet: string;
  categorieId?: number;
  categorieNom?: string;
  dateCreation: string;
}

export interface Projet {
  id: number;
  titre: string;
  description?: string;
  dateSoumission: string;
  statut: 'EN_ATTENTE' | 'VALIDE' | 'REJETE' | 'EN_COURS' | 'TERMINE';
  lienDepot?: string;
  soumetteurId?: number;
  soumetteurNomComplet?: string;
  encadrantId?: number;
  encadrantNomComplet?: string;
  imageUrl?: string;
  membreIds: number[];
}

export interface Ressource {
  id: number;
  titre: string;
  type: string;
  url: string;
  dateAjout: string;
  visibilite: 'PUBLIC' | 'MEMBRE';
  formationId?: number;
  formationTitre?: string;
  auteurId?: number;
  auteurNomComplet?: string;
  categorieId?: number;
  categorieNom?: string;
}

export interface Notification {
  id: number;
  destinataireId: number;
  titre: string;
  message: string;
  dateEnvoi: string;
  lu: boolean;
  type: string;
}

export interface MessageContact {
  id?: number;
  nom: string;
  email: string;
  sujet: string;
  message: string;
  dateEnvoi?: string;
  traite?: boolean;
  traiteParId?: number;
  traiteParNomComplet?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
