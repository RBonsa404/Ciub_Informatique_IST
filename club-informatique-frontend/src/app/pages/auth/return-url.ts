/** Destination après connexion : uniquement un chemin interne ; toute autre valeur renvoie à l'espace. */
export function safeReturnUrl(candidate: string | null | undefined): string {
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) return '/espace';
  if (/^\/(connexion|inscription|mot-de-passe-oublie|reinitialisation|verification-adresse)\b/.test(candidate)) return '/espace';
  return candidate;
}
