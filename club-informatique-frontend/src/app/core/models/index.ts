/* ── User & Auth Models ── */

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  dateNaissance?: string;
  filiere?: string;
  anneeEtude?: number;
  biographie?: string;
  photoUrl?: string;
  ville?: string;
  statut: 'ACTIF' | 'SUSPENDU' | 'INACTIF';
  roles: Role[];
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Role {
  id: number;
  nom: string;
  description?: string;
  permissions: Permission[];
}

export interface Permission {
  id: number;
  nom: string;
  description?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  totpCode?: string;
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  dateNaissance?: string;
  filiere?: string;
  anneeEtude?: number;
  telephone?: string;
  ville?: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface TwoFactorSetupResponse {
  secretKey: string;
  qrCodeUri: string;
}

/* ── API Response Models ── */

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface ErrorResponse {
  status: number;
  error: string;
  message: string;
  timestamp: string;
  path?: string;
}

/* ── Domain Models ── */

export interface Categorie {
  id: number;
  nom: string;
  slug: string;
  description?: string;
  type: 'ACTUALITE' | 'EVENEMENT' | 'FORMATION' | 'PROJET';
  createdAt: string;
}

export interface Actualite {
  id: number;
  titre: string;
  slug: string;
  contenu: string;
  resume?: string;
  imageUrl?: string;
  publie: boolean;
  categorie?: Categorie;
  auteur: { id: number; nom: string; prenom: string; photoUrl?: string };
  createdAt: string;
  updatedAt?: string;
}

export interface Evenement {
  id: number;
  titre: string;
  slug: string;
  description: string;
  lieu: string;
  dateDebut: string;
  dateFin: string;
  capaciteMax: number;
  nbInscrits: number;
  imageUrl?: string;
  publie: boolean;
  categorie?: Categorie;
  organisateur: { id: number; nom: string; prenom: string };
  createdAt: string;
}

export interface Formation {
  id: number;
  titre: string;
  slug: string;
  description: string;
  objectifs?: string;
  prerequis?: string;
  niveau: 'DEBUTANT' | 'INTERMEDIAIRE' | 'AVANCE';
  dureeHeures: number;
  imageUrl?: string;
  publie: boolean;
  categorie?: Categorie;
  formateur: { id: number; nom: string; prenom: string; photoUrl?: string };
  sessions: SessionFormation[];
  createdAt: string;
}

export interface SessionFormation {
  id: number;
  titre: string;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  capaciteMax: number;
  nbInscrits: number;
  formationId: number;
}

export interface Devoir {
  id: number;
  titre: string;
  description: string;
  dateLimite?: string;
  fichierUrl?: string;
  formationId: number;
  createdAt: string;
}

export interface Projet {
  id: number;
  titre: string;
  slug: string;
  description: string;
  objectifs?: string;
  technologies?: string;
  statut: 'PROPOSE' | 'EN_COURS' | 'TERMINE' | 'REJETE';
  avancement: number;
  imageUrl?: string;
  repositoryUrl?: string;
  commentaireSuivi?: string;
  porteur: { id: number; nom: string; prenom: string };
  membres: ProjetMembre[];
  categorie?: Categorie;
  createdAt: string;
}

export interface ProjetMembre {
  id: number;
  utilisateur: { id: number; nom: string; prenom: string; photoUrl?: string };
  role: string;
  dateAdhesion: string;
}

export interface Ressource {
  id: number;
  titre: string;
  description?: string;
  type: 'PDF' | 'VIDEO' | 'LIEN' | 'COURS' | 'AUTRE';
  url: string;
  taille?: number;
  publique: boolean;
  formation?: { id: number; titre: string };
  auteur: { id: number; nom: string; prenom: string };
  createdAt: string;
}

export interface Inscription {
  id: number;
  statut: 'CONFIRMEE' | 'EN_ATTENTE' | 'ANNULEE' | 'REFUSEE';
  dateInscription: string;
  utilisateur: { id: number; nom: string; prenom: string; email: string };
  evenement?: { id: number; titre: string; dateDebut: string };
  sessionFormation?: { id: number; titre: string; dateDebut: string; formation: { id: number; titre: string } };
}

export interface Presence {
  id: number;
  statut: 'PRESENT' | 'ABSENT' | 'EXCUSE';
  inscription: { id: number; utilisateur: { id: number; nom: string; prenom: string } };
  sessionFormation: { id: number; titre: string; dateDebut: string };
}

export interface Notification {
  id: number;
  titre: string;
  message: string;
  type: 'INFO' | 'INSCRIPTION' | 'RAPPEL' | 'ALERTE' | 'GLOBALE';
  lue: boolean;
  lien?: string;
  createdAt: string;
}

export interface MessageContact {
  id: number;
  nom: string;
  email: string;
  sujet: string;
  message: string;
  traite: boolean;
  createdAt: string;
}

export interface PageInfo {
  id: number;
  slug: string;
  titre: string;
  contenu: string;
  updatedAt: string;
}

export interface Statistiques {
  totalMembres: number;
  totalFormations: number;
  totalEvenements: number;
  totalProjets: number;
  totalInscriptions: number;
  membresActifs: number;
  formationsEnCours: number;
  evenementsAVenir: number;
  projetsEnCours: number;
}

export interface AuditLog {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  utilisateur: string;
  details?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface AlerteSecurite {
  id: number;
  type: string;
  description: string;
  severite: 'INFO' | 'WARNING' | 'CRITICAL';
  resolue: boolean;
  timestamp: string;
}
