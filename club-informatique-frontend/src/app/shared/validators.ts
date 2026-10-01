import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Adresse web complète (http ou https). Une valeur vide est acceptée : l'obligation relève d'une autre règle. */
export function webUrlValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  return value === '' || /^https?:\/\/\S+$/i.test(value) ? null : { adresse: true };
}

/** Chemin interne du site (« /evenements/atelier-git »). Une valeur vide est acceptée. */
export function internalPathValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  return value === '' || /^\/(?!\/)\S*$/.test(value) ? null : { chemin: true };
}
