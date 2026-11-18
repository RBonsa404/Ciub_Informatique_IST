import { SITE } from '../../core/config/site';

/**
 * Textes légaux. Ils décrivent ce que fait réellement l'application et l'organisation réelle de son hébergement.
 * Références vérifiées sur le texte officiel de la loi n° 001-2021/AN du 30 mars 2021 (voir docs/decisions.md, T-17).
 * Les durées de conservation annoncées sont appliquées par le backend (purges nocturnes).
 */
export interface LegalParagraph {
  readonly text: string;
  /** Information en attente du club : affichée comme telle, jamais inventée. Aucune en production. */
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

const UPDATED_AT = '2026-11-16';
const LOI = 'loi n° 001-2021/AN du 30 mars 2021 portant protection des personnes à l’égard du traitement des données à caractère personnel';
const PRESIDENT = 'Abdoul Rachid BONSA, président du club';
const O2SWITCH = 'o2switch, SAS au capital de 100 000 €, immatriculée au RCS de Clermont-Ferrand (SIRET 510 909 807 00032), Chemin des Pardiaux, 63000 Clermont-Ferrand, France, téléphone +33 4 44 44 60 40';

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
        { text: `Le présent site est édité par le ${SITE.name}, club étudiant de l’${SITE.institution} (IST), ${SITE.city}, ${SITE.country}.` },
        { text: `Le club n’a pas de personnalité juridique propre : il exerce ses activités au sein de l’${SITE.institution} et sous son couvert. Le site est un outil au service de la vie du club : présentation de ses activités, inscriptions aux formations et aux événements, suivi des projets et partage de ressources.` },
        { text: `Courriel : ${SITE.email}. Téléphone : ${SITE.phones.map((p) => p.label).join(' ou ')}.` },
      ],
    },
    {
      id: 'publication',
      title: 'Directeur de la publication',
      shortTitle: 'Publication',
      paragraphs: [
        { text: `Le directeur de la publication est ${PRESIDENT}. Il veille au respect des présentes mentions et des règles de publication du site.` },
      ],
    },
    {
      id: 'hebergement',
      title: 'Hébergement',
      paragraphs: [
        { text: `Le site, les fichiers déposés par les membres et la messagerie du club sont hébergés par ${O2SWITCH}. Les serveurs sont situés en France.` },
        { text: 'Le service applicatif est exécuté par Render (Render Inc., render.com) dans sa région de Francfort, en Allemagne. La base de données est hébergée par Supabase (supabase.com) dans sa région d’Irlande. Les courriels automatiques du site sont acheminés par Brevo (brevo.com), en France.' },
      ],
    },
    {
      id: 'propriete',
      title: 'Propriété intellectuelle',
      shortTitle: 'Propriété',
      paragraphs: [
        { text: 'Le nom et le logo du club, la structure du site, sa charte graphique et ses textes de présentation sont la propriété du club. Toute reproduction ou réutilisation, totale ou partielle, sans son accord écrit est interdite.' },
        { text: 'Les contenus publiés par les membres (projets, supports de formation, publications) restent la propriété de leurs auteurs. En les publiant, ceux-ci autorisent le club à les diffuser sur le site, dans le cadre de ses activités et pour la durée de leur publication.' },
      ],
    },
    {
      id: 'liens',
      title: 'Liens vers d’autres sites',
      shortTitle: 'Liens',
      paragraphs: [
        { text: 'Le site peut contenir des liens vers des sites tiers (réseaux sociaux du club, ressources en ligne, partenaires). Le club n’exerce aucun contrôle sur ces sites et n’est pas responsable de leur contenu.' },
      ],
    },
    {
      id: 'contact',
      title: 'Contact',
      paragraphs: [{ text: `Toute question relative au site peut être adressée à ${SITE.email} ou par le formulaire de contact. Le club s’efforce de répondre dans les meilleurs délais.` }],
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
      id: 'engagement',
      title: 'Notre engagement',
      shortTitle: 'Engagement',
      paragraphs: [
        { text: `Le ${SITE.name} attache une grande importance à la protection de vos données personnelles. Cette politique vous explique, en termes simples, quelles données le site recueille, pourquoi, qui peut y accéder, combien de temps elles sont conservées et comment exercer vos droits.` },
        { text: `Elle s’inscrit dans le respect de la ${LOI}.` },
      ],
    },
    {
      id: 'responsable',
      title: 'Responsable du traitement',
      shortTitle: 'Responsable',
      paragraphs: [
        { text: `Le ${SITE.name}, club étudiant de l’${SITE.institution} à ${SITE.city}, est responsable des traitements de données réalisés sur ce site.` },
        { text: `La personne chargée des questions relatives à vos données et de l’exercice de vos droits est ${PRESIDENT}, joignable à l’adresse ${SITE.email}.` },
      ],
    },
    {
      id: 'donnees',
      title: 'Données collectées',
      shortTitle: 'Données',
      paragraphs: [{ text: 'Le site ne recueille que les données strictement nécessaires à son fonctionnement :' }],
      items: [
        'compte : nom, prénom, adresse électronique, filière d’études et mot de passe, conservé uniquement sous forme d’empreinte non réversible (personne, pas même un administrateur, ne peut le lire) ; présentation et photo de profil, seulement si vous choisissez d’en ajouter ;',
        'activité au sein du club : inscriptions aux formations et aux événements, présences, propositions de projets et participation à un projet ;',
        'fichiers que vous déposez : photo de profil, supports et documents liés aux activités ;',
        'formulaire de contact : nom, adresse électronique, objet et message ;',
        'sécurité : date des connexions, tentatives de connexion échouées et adresse IP associée, actions d’administration sensibles.',
      ],
    },
    {
      id: 'finalites',
      title: 'Pourquoi ces données sont utilisées',
      shortTitle: 'Finalités',
      paragraphs: [
        { text: 'Vos données servent uniquement à :' },
      ],
      items: [
        'créer et gérer votre compte, et vérifier votre adresse électronique ;',
        'gérer vos inscriptions aux formations et aux événements, et les présences ;',
        'suivre les projets du club et la participation de chacun ;',
        'vous envoyer les messages liés à ces activités (confirmation, rappel, réinitialisation du mot de passe) ;',
        'répondre aux messages reçus par le formulaire de contact ;',
        'protéger le site et ses utilisateurs contre les accès frauduleux.',
      ],
    },
    {
      id: 'fondement',
      title: 'Fondement du traitement',
      shortTitle: 'Fondement',
      paragraphs: [
        { text: 'Le traitement repose sur votre consentement, recueilli lors de la création de votre compte ou de l’envoi d’un message (article 13 de la loi). Vous pouvez le retirer à tout moment en supprimant votre compte.' },
        { text: 'Aucune donnée n’est utilisée à des fins commerciales ou de prospection, ni pour établir un profil publicitaire.' },
      ],
    },
    {
      id: 'destinataires',
      title: 'Qui peut accéder à vos données',
      shortTitle: 'Destinataires',
      paragraphs: [
        { text: 'Vos données sont accessibles, chacun dans la limite de ses fonctions, aux membres habilités du bureau du club, aux formateurs pour les personnes inscrites à leurs formations, aux administrateurs du site et à la direction des systèmes d’information du club, chargée de la sécurité et du bon fonctionnement de la plateforme.' },
        { text: 'Votre adresse électronique n’est jamais affichée publiquement. Vos données ne sont ni vendues, ni louées, ni cédées à des tiers.' },
        { text: 'Les prestataires techniques qui hébergent le site (voir la section « Hébergement ») traitent les données uniquement pour assurer ce service, sans pouvoir les utiliser pour leur propre compte.' },
      ],
    },
    {
      id: 'conservation',
      title: 'Durée de conservation',
      shortTitle: 'Conservation',
      paragraphs: [
        { text: 'Les données ne sont pas conservées au-delà de la durée nécessaire aux finalités pour lesquelles elles sont recueillies (article 25 de la loi) :' },
      ],
      items: [
        'compte et données d’activité : tant que votre compte existe ; ils sont supprimés dès que vous supprimez votre compte depuis vos paramètres ou sur simple demande. Un compte resté sans connexion pendant trois ans peut être supprimé par le club, après un message d’information ;',
        'messages reçus par le formulaire de contact : douze mois, puis suppression automatique ;',
        'journal de sécurité (connexions, actions sensibles) : douze mois, puis suppression automatique ;',
        'liens de vérification et de réinitialisation, sessions expirées : sept jours après leur expiration, puis suppression automatique ;',
        'fichiers déposés : tant que le contenu auquel ils sont rattachés est publié ou que votre compte existe.',
      ],
    },
    {
      id: 'hebergement',
      title: 'Hébergement et localisation des données',
      shortTitle: 'Hébergement',
      paragraphs: [
        { text: 'Les données sont stockées par des prestataires reconnus, dans des centres de données situés dans l’Union européenne :' },
      ],
      items: [
        `site, fichiers déposés et messagerie : ${O2SWITCH} ; serveurs en France ;`,
        'service applicatif : Render (render.com), région de Francfort, Allemagne ;',
        'base de données : Supabase (supabase.com), région d’Irlande ;',
        'acheminement des courriels automatiques : Brevo (brevo.com), France.',
      ],
    },
    {
      id: 'transfert',
      title: 'Transfert hors du Burkina Faso',
      shortTitle: 'Transfert',
      paragraphs: [
        { text: 'L’hébergement de vos données dans l’Union européenne constitue un transfert vers l’étranger au sens de l’article 42 de la loi. Il est encadré : les pays concernés appliquent le Règlement général sur la protection des données (RGPD), qui garantit un niveau élevé de protection, et les prestataires retenus s’engagent, dans leurs conditions de service, à assurer la confidentialité et la sécurité des données qu’ils traitent.' },
        { text: 'Les données ne sont transférées à aucun autre destinataire, ni dans aucun autre pays, que ceux indiqués ci-dessus.' },
      ],
    },
    {
      id: 'securite',
      title: 'Sécurité',
      paragraphs: [
        { text: 'Le club met en œuvre des mesures techniques et organisationnelles pour protéger vos données (article 24 de la loi) :' },
      ],
      items: [
        'tous les échanges avec le site sont chiffrés (HTTPS) ;',
        'les mots de passe ne sont jamais conservés en clair ;',
        'chaque utilisateur n’accède qu’aux données utiles à son rôle ;',
        'les tentatives de connexion répétées sont bloquées et les actions sensibles sont journalisées ;',
        'les fichiers déposés sont conservés hors de tout accès public direct et ne sont servis qu’après contrôle des droits.',
      ],
    },
    {
      id: 'cookies',
      title: 'Cookies et stockage local',
      shortTitle: 'Cookies',
      paragraphs: [
        { text: 'Le site n’utilise aucun cookie publicitaire, aucun outil de mesure d’audience et aucun service tiers de suivi.' },
        { text: 'Seuls sont utilisés un cookie strictement nécessaire au maintien de votre session après connexion et, dans votre navigateur, la mémorisation de votre préférence de thème clair ou sombre. Ces éléments sont indispensables au fonctionnement du site et ne nécessitent pas de consentement.' },
      ],
    },
    {
      id: 'droits',
      title: 'Vos droits',
      shortTitle: 'Droits',
      paragraphs: [{ text: 'Conformément à la loi, vous disposez à tout moment des droits suivants sur vos données :' }],
      items: [
        'droit d’être informé de l’usage qui en est fait (article 16) ;',
        'droit d’accès : obtenir la communication des données vous concernant (article 17) ;',
        'droit d’opposition, pour des motifs légitimes (article 20) ;',
        'droit de faire rectifier, compléter, mettre à jour ou supprimer vos données (article 21) ;',
        'droit à l’oubli pour les données rendues publiques (article 22) ;',
        'droit de retirer votre consentement, en supprimant votre compte.',
      ],
    },
    {
      id: 'exercice',
      title: 'Exercer vos droits',
      shortTitle: 'Exercice des droits',
      paragraphs: [
        { text: 'Vous pouvez à tout moment modifier vos informations depuis votre profil et supprimer votre compte depuis vos paramètres : la suppression est immédiate et définitive.' },
        { text: `Pour toute autre demande, écrivez à ${SITE.email} en précisant l’objet de votre demande et l’adresse électronique de votre compte. Le club vous répond dans un délai d’un mois au plus. Une preuve d’identité peut vous être demandée en cas de doute raisonnable, afin de protéger vos données.` },
        { text: 'Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous pouvez saisir la Commission de l’informatique et des libertés (CIL), autorité de protection des données personnelles du Burkina Faso.' },
      ],
    },
    {
      id: 'modifications',
      title: 'Modifications de cette politique',
      shortTitle: 'Modifications',
      paragraphs: [
        { text: 'Cette politique peut être mise à jour pour tenir compte de l’évolution du site ou de la réglementation. La date de dernière mise à jour figure en tête de page. En cas de changement important, les membres en sont informés.' },
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
        { text: `Les présentes conditions régissent l’utilisation du site du ${SITE.name}. Elles précisent les droits et les devoirs de chacun. La création d’un compte vaut acceptation de ces conditions.` },
      ],
    },
    {
      id: 'compte',
      title: 'Compte et accès',
      shortTitle: 'Compte',
      paragraphs: [
        { text: 'Les pages de présentation, les actualités, les événements, les formations, les projets et les ressources publiques sont consultables librement, sans compte. L’inscription à une activité, l’accès aux supports réservés et la proposition d’un projet nécessitent un compte.' },
        { text: 'La création d’un compte est gratuite et ouverte à toute personne intéressée par les activités du club, en priorité aux étudiants de l’Institut Supérieur de Technologies. Elle est confirmée par un lien envoyé à l’adresse électronique indiquée. Le bureau peut vérifier les informations fournies et réserver certaines activités aux membres du club.' },
        { text: 'Vous vous engagez à fournir des informations exactes et à garder votre mot de passe confidentiel. Vous êtes responsable de l’usage fait de votre compte. En cas de doute sur la sécurité de votre compte, changez votre mot de passe et prévenez le club.' },
        { text: 'Les comptes créés par le club pour les membres du bureau et l’équipe technique reçoivent un mot de passe provisoire, à remplacer obligatoirement lors de la première connexion.' },
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
        'respecter les autres membres et ne diffuser aucun propos injurieux, discriminatoire, diffamatoire ou trompeur ;',
        'ne pas chercher à accéder à des données ou à des espaces qui ne vous sont pas destinés ;',
        'signaler au club toute faille de sécurité constatée, sans l’exploiter.',
      ],
    },
    {
      id: 'contenus',
      title: 'Contenus et modération',
      shortTitle: 'Contenus',
      paragraphs: [
        { text: 'Les propositions de projets et les contenus publiés sont examinés par les responsables du club avant leur mise en ligne. Le club peut refuser, retirer ou archiver un contenu contraire aux présentes conditions ou aux valeurs du club.' },
        { text: 'En cas de manquement, le compte concerné peut être suspendu, après un échange avec la personne concernée lorsque la situation le permet.' },
      ],
    },
    {
      id: 'responsabilite',
      title: 'Disponibilité et responsabilité',
      shortTitle: 'Responsabilité',
      paragraphs: [
        { text: 'Le site est conçu et animé par des étudiants bénévoles. Le club s’efforce d’en assurer le bon fonctionnement et la sécurité, sans pouvoir garantir une disponibilité permanente. Il ne saurait être tenu responsable d’une interruption momentanée du service, ni de l’usage fait par des tiers des contenus publiés.' },
      ],
    },
    {
      id: 'donnees',
      title: 'Données personnelles',
      shortTitle: 'Données',
      paragraphs: [{ text: 'Le traitement de vos données, vos droits et la manière de les exercer sont décrits dans la politique de confidentialité, accessible depuis le pied de chaque page.' }],
    },
    {
      id: 'evolution',
      title: 'Évolution et droit applicable',
      shortTitle: 'Droit applicable',
      paragraphs: [
        { text: 'Ces conditions peuvent être mises à jour ; la date de dernière mise à jour figure en tête de page. Elles sont soumises au droit burkinabè.' },
        { text: `Pour toute question : ${SITE.email}.` },
      ],
    },
  ],
};
