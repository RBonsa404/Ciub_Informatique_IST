import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Politique de mot de passe, identique à celle du backend : 8 caractères, minuscule, majuscule, chiffre, symbole. */
export const PASSWORD_MIN_LENGTH = 8;

export interface PasswordCriteria {
  readonly longueur: boolean;
  readonly minuscule: boolean;
  readonly majuscule: boolean;
  readonly chiffre: boolean;
  readonly symbole: boolean;
}

export function passwordCriteria(value: string): PasswordCriteria {
  return {
    longueur: value.length >= PASSWORD_MIN_LENGTH,
    minuscule: /\p{Ll}/u.test(value),
    majuscule: /\p{Lu}/u.test(value),
    chiffre: /\d/.test(value),
    symbole: /[^\p{L}\d\s]/u.test(value),
  };
}

/** Nombre de critères satisfaits, de zéro à cinq : alimente l'indicateur de robustesse. */
export function passwordScore(value: string): number {
  return Object.values(passwordCriteria(value)).filter(Boolean).length;
}

export const PASSWORD_STRENGTH_LABELS = ['Vide', 'Très faible', 'Faible', 'Moyenne', 'Bonne', 'Forte'] as const;

export const passwordPolicyValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '');
  if (!value) return null;
  return passwordScore(value) === 5 ? null : { politique: true };
};

/** Validateur de groupe : la confirmation doit être identique au mot de passe. */
export function matchValidator(field: string, confirmation: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const a = group.get(field)?.value;
    const b = group.get(confirmation)?.value;
    return !b || a === b ? null : { confirmation: true };
  };
}

export const PASSWORD_POLICY_MESSAGE = 'Utilisez au moins huit caractères avec une minuscule, une majuscule, un chiffre et un symbole.';

/** Normalisation d'une saisie libre : espaces de début, de fin et répétés supprimés. */
export function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}
