/** Modèles des réponses d'API. Les dates sont des chaînes ISO 8601 en UTC. */

export interface Categorie {
  readonly id: number;
  readonly nom: string;
  readonly slug: string;
  readonly description?: string | null;
  readonly couleur?: string | null;
}

export interface Actualite {
  readonly id: number;
  readonly titre: string;
  readonly slug: string;
  readonly contenu: string;
  readonly resume?: string | null;
  readonly image?: string | null;
  readonly publie?: boolean;
  readonly datePublication?: string | null;
  readonly auteurNom?: string | null;
  readonly categorieId?: number | null;
  readonly categorieNom?: string | null;
  /** Diffusion : site public ou membres connectés seulement (champ à créer côté serveur). */
  readonly visibilite?: VisibiliteActualite | null;
  readonly createdAt?: string;
}

export type VisibiliteActualite = 'PUBLIC' | 'MEMBRES';

export interface ActualitePayload {
  readonly titre: string;
  readonly contenu: string;
  readonly resume: string;
  readonly image: string | null;
  readonly categorieId: number | null;
  readonly publie: boolean;
  readonly visibilite: VisibiliteActualite;
}

export interface NotificationGlobalePayload {
  readonly titre: string;
  readonly message: string;
  readonly lien: string | null;
}

export interface Evenement {
  readonly id: number;
  readonly titre: string;
  readonly slug: string;
  readonly description: string;
  readonly dateDebut: string;
  readonly dateFin: string;
  readonly lieu: string;
  readonly capaciteMax?: number | null;
  readonly nombreInscrits?: number | null;
  readonly placesRestantes?: number | null;
  readonly image?: string | null;
  readonly publie?: boolean;
  readonly categorieId?: number | null;
  readonly categorieNom?: string | null;
  readonly organisateurNom?: string | null;
}

export type NiveauFormation = 'DEBUTANT' | 'INTERMEDIAIRE' | 'AVANCE';
export type StatutSession = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

export interface SessionFormation {
  readonly id: number;
  readonly formationId: number;
  readonly formationTitre?: string;
  readonly dateDebut: string;
  readonly dateFin: string;
  readonly lieu?: string | null;
  readonly lienVisio?: string | null;
  readonly capaciteMax?: number | null;
  readonly nombreInscrits?: number | null;
  readonly placesRestantes?: number | null;
  readonly statut: StatutSession;
}

export interface Formation {
  readonly id: number;
  readonly titre: string;
  readonly slug: string;
  readonly description: string;
  readonly niveau: NiveauFormation;
  readonly prerequis?: string | null;
  readonly objectifs?: string | null;
  readonly publie?: boolean;
  readonly image?: string | null;
  readonly formateurId?: number | null;
  readonly formateurNom?: string | null;
  readonly categorieId?: number | null;
  readonly categorieNom?: string | null;
  readonly sessions?: readonly SessionFormation[] | null;
}

export type StatutProjet = 'PROPOSE' | 'VALIDE' | 'REJETE' | 'EN_COURS' | 'TERMINE';

export interface ProjetMembre {
  readonly id: number;
  readonly utilisateurNom: string;
  readonly role: 'PORTEUR' | 'CONTRIBUTEUR' | string;
}

export interface Projet {
  readonly id: number;
  readonly titre: string;
  readonly slug: string;
  readonly description: string;
  readonly objectifs?: string | null;
  readonly technologies?: string | null;
  readonly depotGit?: string | null;
  readonly documentationUrl?: string | null;
  readonly statut: StatutProjet;
  readonly porteurNom?: string | null;
  readonly avancementPourcentage?: number | null;
  readonly categorieId?: number | null;
  readonly categorieNom?: string | null;
  readonly membres?: readonly ProjetMembre[] | null;
  readonly createdAt?: string;
}

export type TypeRessource = 'DOCUMENT_PDF' | 'SUPPORT_COURS' | 'LIEN_EXTERNE' | 'VIDEO' | 'CODE_SOURCE';

export interface Ressource {
  readonly id: number;
  readonly titre: string;
  readonly description?: string | null;
  readonly type: TypeRessource;
  readonly urlFichier: string;
  readonly estPublique?: boolean;
  readonly formationId?: number | null;
  readonly formationTitre?: string | null;
  readonly categorieNom?: string | null;
  readonly auteurNom?: string | null;
  readonly createdAt?: string;
}

export interface PageInfo {
  readonly slug: string;
  readonly titre: string;
  readonly contenu: string;
  readonly updatedAt?: string | null;
}

/** Membre du bureau (point d'accès à créer). Aucune photo : avatar neutre. */
export interface MembreBureau {
  readonly id: number;
  readonly nom: string;
  readonly prenom: string;
  readonly fonction: string;
  readonly filiere?: string | null;
  readonly ordre: number;
}

export interface ContactPayload {
  readonly nom: string;
  readonly email: string;
  readonly sujet: string;
  readonly message: string;
  /** Champ piège : toujours vide pour un humain. */
  readonly siteWeb: string;
  /** Durée de remplissage du formulaire en millisecondes. */
  readonly dureeSaisieMs: number;
}

export type StatutInscription = 'CONFIRMEE' | 'LISTE_ATTENTE' | 'ANNULEE';

export interface Inscription {
  readonly id: number;
  /** Renseignés dans les listes de gestion (inscrits d'une session ou d'un événement). */
  readonly utilisateurId?: number | null;
  readonly utilisateurNom?: string | null;
  readonly utilisateurEmail?: string | null;
  readonly utilisateurFiliere?: string | null;
  readonly evenementId?: number | null;
  readonly evenementTitre?: string | null;
  readonly evenementSlug?: string | null;
  readonly sessionFormationId?: number | null;
  readonly formationId?: number | null;
  readonly formationSlug?: string | null;
  readonly formationTitre?: string | null;
  readonly lieu?: string | null;
  readonly dateDebut?: string | null;
  readonly dateFin?: string | null;
  readonly dateInscription: string;
  readonly statut: StatutInscription;
  readonly motifAnnulation?: string | null;
}

export type StatutPresence = 'PRESENT' | 'ABSENT' | 'EXCUSE';

export interface Presence {
  readonly id: number;
  readonly inscriptionId: number;
  readonly utilisateurNom?: string | null;
  readonly sessionId: number;
  readonly statut: StatutPresence;
  readonly datePointage?: string | null;
  readonly remarque?: string | null;
}

export interface PointagePayload {
  readonly inscriptionId: number;
  readonly statut: StatutPresence;
}

export interface FormationPayload {
  readonly titre: string;
  readonly description: string;
  readonly niveau: NiveauFormation;
  readonly prerequis: string;
  readonly objectifs: string;
  readonly categorieId: number | null;
  readonly publie: boolean;
}

export interface EvenementPayload {
  readonly titre: string;
  readonly description: string;
  readonly dateDebut: string;
  readonly dateFin: string;
  readonly lieu: string;
  readonly capaciteMax: number | null;
  readonly categorieId: number | null;
  readonly publie: boolean;
}

export interface SessionPayload {
  readonly dateDebut: string;
  readonly dateFin: string;
  readonly lieu: string;
  readonly lienVisio: string | null;
  readonly capaciteMax: number | null;
}

export interface DevoirPayload {
  readonly titre: string;
  readonly description: string;
  readonly dateLimite: string;
  readonly fichierConsigne: string | null;
}

export interface RessourcePayload {
  readonly titre: string;
  readonly description: string;
  readonly type: TypeRessource;
  readonly urlFichier: string;
  readonly estPublique: boolean;
  readonly formationId: number;
}

export const STATUT_SESSION_LABELS: Record<StatutSession, string> = { PLANIFIEE: 'Planifiée', EN_COURS: 'En cours', TERMINEE: 'Terminée', ANNULEE: 'Annulée' };
export const STATUT_PRESENCE_LABELS: Record<StatutPresence, string> = { PRESENT: 'Présent', ABSENT: 'Absent', EXCUSE: 'Excusé' };

export type StatutCompte = 'ACTIF' | 'INACTIF' | 'SUSPENDU' | 'EN_ATTENTE_ACTIVATION';

/** Profil de l'utilisateur connecté. */
export interface Profil {
  readonly id: number;
  readonly nom: string;
  readonly prenom: string;
  readonly email: string;
  readonly filiere?: string | null;
  readonly biographie?: string | null;
  readonly numeroMembre?: string | null;
  readonly dateAdhesion?: string | null;
  readonly statut: StatutCompte;
}

export interface ProfilUpdate {
  readonly nom: string;
  readonly prenom: string;
  readonly filiere: string;
  readonly biographie: string;
}

export interface Devoir {
  readonly id: number;
  readonly formationId: number;
  readonly formationTitre?: string | null;
  readonly titre: string;
  readonly description?: string | null;
  readonly dateLimite?: string | null;
  readonly fichierConsigne?: string | null;
  readonly createdAt?: string;
}

/** Supports et devoirs d'une formation à laquelle le membre est inscrit. */
export interface SupportsFormation {
  readonly formationId: number;
  readonly formationTitre: string;
  readonly ressources: readonly Ressource[];
  readonly devoirs: readonly Devoir[];
}

export type TypeNotification = 'INSCRIPTION' | 'VALIDATION_PROJET' | 'RAPPEL_SESSION' | 'MESSAGE_GLOBAL' | 'SYSTEME';

export interface NotificationItem {
  readonly id: number;
  readonly titre: string;
  readonly message: string;
  readonly type: TypeNotification;
  readonly lien?: string | null;
  readonly lue: boolean;
  readonly createdAt: string;
}

/** Préférences du compte (point d'accès à créer). */
export interface PreferencesCompte {
  readonly notificationsCourriel: boolean;
}

export const TYPE_NOTIFICATION_LABELS: Record<TypeNotification, string> = {
  MESSAGE_GLOBAL: 'Annonces',
  INSCRIPTION: 'Inscriptions',
  VALIDATION_PROJET: 'Projets',
  RAPPEL_SESSION: 'Rappels',
  SYSTEME: 'Système',
};

export const STATUT_COMPTE_LABELS: Record<StatutCompte, string> = {
  ACTIF: 'Compte actif',
  INACTIF: 'Compte inactif',
  SUSPENDU: 'Compte suspendu',
  EN_ATTENTE_ACTIVATION: 'En attente d’activation',
};

export const NIVEAU_LABELS: Record<NiveauFormation, string> = { DEBUTANT: 'Débutant', INTERMEDIAIRE: 'Intermédiaire', AVANCE: 'Avancé' };

export const STATUT_PROJET_LABELS: Record<StatutProjet, string> = {
  PROPOSE: 'En attente de validation',
  VALIDE: 'Validé',
  REJETE: 'Rejeté',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
};

export const TYPE_RESSOURCE_LABELS: Record<TypeRessource, string> = {
  DOCUMENT_PDF: 'Document',
  SUPPORT_COURS: 'Support de cours',
  LIEN_EXTERNE: 'Lien externe',
  VIDEO: 'Vidéo',
  CODE_SOURCE: 'Code source',
};

export const STATUT_INSCRIPTION_LABELS: Record<StatutInscription, string> = {
  CONFIRMEE: 'Inscription confirmée',
  LISTE_ATTENTE: 'Liste d’attente',
  ANNULEE: 'Annulée',
};
