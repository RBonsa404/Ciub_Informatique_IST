import { SITE } from '../../core/config/site';

/**
 * Textes légaux. Ils décrivent ce que fait réellement l'application. Références vérifiées sur le texte officiel
 * de la loi n° 001-2021/AN du 30 mars 2021 (voir docs/decisions.md). Les informations que seul le club peut
 * fournir sont marquées « pending » : elles s'affichent comme telles et ne sont jamais inventées.
 * Relecture par le club requise avant publication.
 */
export interface LegalParagraph {
  readonly text: string;
  /** Information en attente du club (docs/informations-a-fournir.md). */
  readonly pending?: boolean;
}

export interface LegalSection {
  readonly id: string;
  readonly title: string;
  readonly shortTitle?: string;
  readonly paragraphs: readonly LegalParagraph[];
  readonly items?: readonly string[];
}

export interface LegalDocumentContent {
  readonly badge: string;
  readonly titleStart: string;
  readonly titleAccent: string;
  /** Date ISO de dernière mise à jour du texte. */
  readonly updatedAt: string;
  readonly sections: readonly LegalSection[];
}

const UPDATED_AT = '2026-10-01';
const PENDING = 'Information en attente de validation par le club.';
const LOI = 'loi n° 001-2021/AN du 30 mars 2021 portant protection des personnes à l’égard du traitement des données à caractère personnel';

export const MENTIONS_LEGALES: LegalDocumentContent = {
  badge: 'Informations légales',
  titleStart: 'Mentions',
  titleAccent: 'légales',
  updatedAt: UPDATED_AT,
  sections: [
    {
      id: 'editeur',
      title: 'Éditeur du site',
      shortTitle: 'Éditeur',
      paragraphs: [
        { text: `Le présent site est édité par le ${SITE.name}, club étudiant de l’${SITE.institution}, ${SITE.city}, ${SITE.country}.` },
        { text: `Courriel : ${SITE.email}. Téléphone : ${SITE.phones.map((p) => p.label).join(' ou ')}.` },
        { text: `Statut juridique du club et rattachement à l’établissement : ${PENDING}`, pending: true },
      ],
    },
    {
      id: 'publication',
      title: 'Directeur de la publication',
      shortTitle: 'Publication',
      paragraphs: [{ text: `Nom et qualité du directeur de la publication : ${PENDING}`, pending: true }],
    },
    {
      id: 'hebergement',
      title: 'Hébergement',
      paragraphs: [{ text: `Dénomination, adresse et lieu d’hébergement du prestataire retenu : ${PENDING}`, pending: true }],
    },
    {
      id: 'propriete',
      title: 'Propriété intellectuelle',
      shortTitle: 'Propriété',
      paragraphs: [
        { text: 'Le nom et le logo du club, la structure du site et ses textes de présentation sont la propriété du club. Toute reproduction sans son accord est interdite.' },
        { text: 'Les contenus publiés par les membres (projets, supports, publications) restent la propriété de leurs auteurs, qui autorisent leur diffusion sur le site.' },
      ],
    },
    {
      id: 'contact',
      title: 'Contact',
      paragraphs: [{ text: `Toute question relative au site peut être adressée à ${SITE.email} ou par le formulaire de contact.` }],
    },
  ],
};

export const POLITIQUE_CONFIDENTIALITE: LegalDocumentContent = {
  badge: 'Vie privée',
  titleStart: 'Politique de',
  titleAccent: 'confidentialité',
  updatedAt: UPDATED_AT,
  sections: [
    {
      id: 'responsable',
      title: 'Responsable du traitement',
      shortTitle: 'Responsable',
      paragraphs: [
        { text: `Le ${SITE.name} est responsable des traitements de données à caractère personnel réalisés sur ce site, conformément à la ${LOI}.` },
        { text: `Contact pour toute question relative à vos données : ${SITE.email}.` },
        { text: `Personne chargée de l’exercice des droits au sein du club : ${PENDING}`, pending: true },
      ],
    },
    {
      id: 'donnees',
      title: 'Données collectées',
      shortTitle: 'Données',
      paragraphs: [{ text: 'Le site ne collecte que les données nécessaires à son fonctionnement :' }],
      items: [
        'compte : nom, prénom, adresse électronique, filière d’études, mot de passe conservé sous forme d’empreinte non réversible ;',
        'activité au sein du club : inscriptions aux formations et aux événements, présences, propositions de projets et participation à un projet ;',
        'formulaire de contact : nom, adresse électronique, objet et message ;',
        'sécurité : date des connexions, tentatives de connexion échouées et adresse IP associée, actions d’administration sensibles.',
      ],
    },
    {
      id: 'finalites',
      title: 'Finalités et fondement',
      shortTitle: 'Finalités',
      paragraphs: [
        { text: 'Ces données servent à gérer les comptes des membres, les inscriptions et les présences, le suivi des projets, l’envoi des notifications liées à ces activités, le traitement des demandes reçues par le formulaire de contact et la sécurité du site.' },
        { text: 'Le traitement repose sur votre consentement, recueilli lors de la création du compte ou de l’envoi d’un message (article 13 de la loi). Aucune donnée n’est utilisée à des fins de prospection.' },
      ],
    },
    {
      id: 'destinataires',
      title: 'Destinataires',
      paragraphs: [
        { text: 'Vos données sont accessibles, dans la limite de leurs fonctions, aux membres habilités du bureau du club, aux formateurs pour les personnes inscrites à leurs formations et aux administrateurs du site. Votre adresse électronique n’est jamais affichée publiquement.' },
        { text: 'Elles ne sont ni vendues, ni cédées à des tiers.' },
      ],
    },
    {
      id: 'conservation',
      title: 'Durée de conservation',
      shortTitle: 'Conservation',
      paragraphs: [
        { text: 'Les données ne sont pas conservées au-delà de la durée nécessaire aux finalités pour lesquelles elles sont collectées (article 25 de la loi).' },
        { text: `Durées retenues pour les comptes inactifs, les messages de contact et les journaux de sécurité : ${PENDING}`, pending: true },
      ],
    },
    {
      id: 'hebergement',
      title: 'Hébergement et transfert des données',
      shortTitle: 'Hébergement',
      paragraphs: [
        { text: `Prestataire d’hébergement et pays dans lequel les données sont stockées : ${PENDING}`, pending: true },
        { text: 'Un hébergement hors du Burkina Faso constitue un transfert de données vers un pays étranger, soumis aux conditions de l’article 42 de la loi.' },
      ],
    },
    {
      id: 'securite',
      title: 'Sécurité',
      paragraphs: [
        { text: 'Les échanges avec le site sont chiffrés. Les mots de passe ne sont jamais conservés en clair. L’accès aux données est limité selon le rôle de chaque utilisateur et les actions sensibles sont journalisées (article 24 de la loi).' },
      ],
    },
    {
      id: 'cookies',
      title: 'Cookies et stockage local',
      shortTitle: 'Cookies',
      paragraphs: [
        { text: 'Le site n’utilise aucun cookie publicitaire, aucun outil de mesure d’audience et aucun service tiers de suivi.' },
        { text: 'Seuls sont utilisés un cookie strictement nécessaire au maintien de votre session après connexion et, dans votre navigateur, la mémorisation de votre préférence de thème clair ou sombre. Ces éléments ne nécessitent pas de consentement.' },
      ],
    },
    {
      id: 'droits',
      title: 'Vos droits',
      shortTitle: 'Droits',
      paragraphs: [{ text: 'Conformément à la loi, vous disposez des droits suivants :' }],
      items: [
        'droit d’être informé de l’usage fait de vos données (article 16) ;',
        'droit d’accès à vos données (article 17) ;',
        'droit d’opposition pour des motifs légitimes (article 20) ;',
        'droit de faire rectifier, compléter, mettre à jour ou supprimer vos données (article 21) ;',
        'droit à l’oubli pour les données rendues publiques (article 22).',
      ],
    },
    {
      id: 'exercice',
      title: 'Exercer vos droits',
      shortTitle: 'Exercice des droits',
      paragraphs: [
        { text: `Vous pouvez modifier vos informations depuis votre profil et demander la suppression de votre compte depuis vos paramètres. Pour toute autre demande, écrivez à ${SITE.email}.` },
        { text: 'Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la Commission de l’informatique et des libertés (CIL), autorité de contrôle du Burkina Faso.' },
        { text: `Formalités préalables accomplies par le club auprès de la CIL (article 27 de la loi) : ${PENDING}`, pending: true },
      ],
    },
  ],
};

export const CONDITIONS_UTILISATION: LegalDocumentContent = {
  badge: 'Informations légales',
  titleStart: 'Conditions',
  titleAccent: 'd’utilisation',
  updatedAt: UPDATED_AT,
  sections: [
    {
      id: 'objet',
      title: 'Objet',
      paragraphs: [
        { text: `Les présentes conditions régissent l’utilisation du site du ${SITE.name}. La création d’un compte vaut acceptation de ces conditions.` },
      ],
    },
    {
      id: 'compte',
      title: 'Compte et accès',
      shortTitle: 'Compte',
      paragraphs: [
        { text: 'Les pages de présentation, les actualités, les événements, les formations, les projets et les ressources publiques sont consultables sans compte. L’inscription à une activité, l’accès aux supports réservés et la proposition d’un projet nécessitent un compte.' },
        { text: 'Vous vous engagez à fournir des informations exactes et à garder votre mot de passe confidentiel. Vous êtes responsable de l’usage fait de votre compte.' },
        { text: `Conditions d’adhésion au club et règle de validation des inscriptions : ${PENDING}`, pending: true },
      ],
    },
    {
      id: 'usage',
      title: 'Règles d’usage',
      shortTitle: 'Usage',
      paragraphs: [{ text: 'En utilisant le site, vous vous engagez à :' }],
      items: [
        'ne pas l’utiliser à des fins illicites ni porter atteinte à son fonctionnement ou à sa sécurité ;',
        'ne publier que des contenus dont vous êtes l’auteur ou que vous êtes autorisé à diffuser ;',
        'respecter les autres membres et ne diffuser aucun propos injurieux, discriminatoire ou trompeur ;',
        'ne pas chercher à accéder à des données ou à des espaces qui ne vous sont pas destinés.',
      ],
    },
    {
      id: 'contenus',
      title: 'Contenus et modération',
      shortTitle: 'Contenus',
      paragraphs: [
        { text: 'Les propositions de projets sont examinées par le Responsable du Club avant publication. Le club peut refuser, retirer ou archiver un contenu contraire aux présentes conditions.' },
        { text: 'En cas de manquement, le compte concerné peut être suspendu.' },
      ],
    },
    {
      id: 'responsabilite',
      title: 'Disponibilité et responsabilité',
      shortTitle: 'Responsabilité',
      paragraphs: [
        { text: 'Le site est animé par des étudiants. Le club s’efforce d’en assurer le bon fonctionnement, sans garantie de disponibilité permanente. Il ne saurait être tenu responsable d’une interruption du service ni de l’usage fait des contenus publiés.' },
      ],
    },
    {
      id: 'donnees',
      title: 'Données personnelles',
      shortTitle: 'Données',
      paragraphs: [{ text: 'Le traitement de vos données est décrit dans la politique de confidentialité, accessible depuis le pied de chaque page.' }],
    },
    {
      id: 'evolution',
      title: 'Évolution et droit applicable',
      shortTitle: 'Droit applicable',
      paragraphs: [
        { text: 'Ces conditions peuvent être mises à jour ; la date de dernière mise à jour figure en tête de page. Elles sont soumises au droit burkinabè.' },
        { text: `Contact : ${SITE.email}.` },
      ],
    },
  ],
};
