import { Pipe, PipeTransform } from '@angular/core';

/** Interprète une date d'API. Une valeur sans fuseau est lue en UTC (fuseau d'Ouagadougou). */
export function parseApiDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const normalized = /[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : value.length <= 10 ? `${value}T00:00:00Z` : `${value}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

const TZ = 'UTC';
const FORMATS = {
  /** 5 octobre 2025 */
  long: new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ }),
  /** 5 oct. 2025 */
  court: new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ }),
  /** 05/10/2025 */
  numerique: new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TZ }),
  /** 09:00 */
  heure: new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: TZ }),
  jour: new Intl.DateTimeFormat('fr-FR', { day: '2-digit', timeZone: TZ }),
  mois: new Intl.DateTimeFormat('fr-FR', { month: 'short', timeZone: TZ }),
  /** octobre 2025 */
  moisAnnee: new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: TZ }),
} as const;

export type DateStyle = keyof typeof FORMATS;

export function formatDate(value: string | Date | null | undefined, style: DateStyle = 'long'): string {
  const date = value instanceof Date ? value : parseApiDate(value);
  return date ? FORMATS[style].format(date) : '';
}

/** Plage d'un événement : « 18 octobre 2025 » ou « du 18 au 19 octobre 2025 ». */
export function formatDateRange(start: string, end: string): string {
  const a = parseApiDate(start);
  const b = parseApiDate(end);
  if (!a) return '';
  if (!b || FORMATS.numerique.format(a) === FORMATS.numerique.format(b)) return FORMATS.long.format(a);
  const sameMonth = FORMATS.moisAnnee.format(a) === FORMATS.moisAnnee.format(b);
  const first = sameMonth ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', timeZone: TZ }).format(a) : FORMATS.long.format(a);
  return `du ${first} au ${FORMATS.long.format(b)}`;
}

export function formatTimeRange(start: string, end: string): string {
  const a = formatDate(start, 'heure');
  const b = formatDate(end, 'heure');
  return b && b !== a ? `${a} – ${b}` : a;
}

/** Date au format français, fuseau d'Ouagadougou. */
@Pipe({ name: 'frDate' })
export class FrDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, style: DateStyle = 'long'): string {
    return formatDate(value, style);
  }
}

/** Nombre selon la locale française (séparateur de milliers insécable). */
@Pipe({ name: 'frNumber' })
export class FrNumberPipe implements PipeTransform {
  private readonly format = new Intl.NumberFormat('fr-FR');
  transform(value: number | null | undefined): string {
    return value === null || value === undefined ? '' : this.format.format(value);
  }
}

/** Initiales d'un nom complet pour un avatar neutre. */
export function initialsOf(name: string | null | undefined): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '')).toUpperCase();
}

/** Découpe un texte libre en paragraphes ; les lignes commençant par « > » forment une citation. */
export interface TextBlock {
  readonly kind: 'paragraph' | 'quote' | 'heading';
  readonly text: string;
}

export function toBlocks(text: string | null | undefined): TextBlock[] {
  if (!text) return [];
  return text
    .replace(/\\n/g, '\n')
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk): TextBlock => {
      if (/^#{1,6}\s/.test(chunk)) return { kind: 'heading', text: chunk.replace(/^#{1,6}\s+/, '') };
      if (chunk.startsWith('>')) return { kind: 'quote', text: chunk.replace(/^>\s?/gm, '') };
      return { kind: 'paragraph', text: chunk };
    });
}

/** Seules les adresses web (http ou https) sont proposées à l'ouverture. */
export function safeUrl(value: string | null | undefined): string | null {
  return value && /^https?:\/\//i.test(value.trim()) ? value.trim() : null;
}
