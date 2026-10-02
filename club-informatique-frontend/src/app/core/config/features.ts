/** Modules fonctionnels. Un module n'est exposé dans une navigation qu'une fois son intégration prouvée. */
export const MODULE_KEYS = [
  'contenu-public',
  'actualites',
  'evenements',
  'formations',
  'projets',
  'ressources',
  'contact',
  'bureau',
  'authentification',
  'profil',
  'inscriptions',
  'supports',
  'notifications',
  'publications-membres',
  'gestion-club',
  'administration',
  'statistiques',
  'systeme',
  'conformite',
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export type FeatureFlags = Readonly<Record<ModuleKey, boolean>>;

export function uniformFlags(enabled: boolean): FeatureFlags {
  return Object.fromEntries(MODULE_KEYS.map((key) => [key, enabled])) as FeatureFlags;
}
