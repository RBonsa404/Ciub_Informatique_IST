import { Formation, SessionFormation } from '../../core/api/models';
import { parseApiDate } from '../../shared/format/format';

const time = (value: string | null | undefined): number => parseApiDate(value)?.getTime() ?? 0;

/** Le serveur restreint la liste aux cours du formateur ; le filtre est revérifié ici. */
export function ownedBy(userId: number | undefined): (formation: Formation) => boolean {
  return (formation) => formation.formateurId === null || formation.formateurId === undefined || formation.formateurId === userId;
}

/** Séances d'un cours, de la plus ancienne à la plus récente. */
export function sessionsOf(formation: Formation): readonly SessionFormation[] {
  return [...(formation.sessions ?? [])].sort((a, b) => time(a.dateDebut) - time(b.dateDebut));
}

/** Inscriptions actives cumulées sur les séances non annulées (valeurs renvoyées par le serveur). */
export function enrolledOf(formation: Formation): number {
  return (formation.sessions ?? []).filter((s) => s.statut !== 'ANNULEE').reduce((sum, s) => sum + (s.nombreInscrits ?? 0), 0);
}

export interface SessionProgress {
  readonly done: number;
  readonly total: number;
}

/** Séances tenues sur séances prévues : une séance est tenue si elle est terminée ou si sa date est passée. */
export function progressOf(formation: Formation, now = Date.now()): SessionProgress {
  const sessions = (formation.sessions ?? []).filter((s) => s.statut !== 'ANNULEE');
  return { done: sessions.filter((s) => s.statut === 'TERMINEE' || time(s.dateFin) < now).length, total: sessions.length };
}

export interface UpcomingSession {
  readonly session: SessionFormation;
  readonly formation: Formation;
  /** Rang de la séance dans son cours (à partir de 1) et nombre de séances du cours. */
  readonly rank: number;
  readonly total: number;
}

export function upcomingSessions(formations: readonly Formation[], limit: number, now = Date.now()): readonly UpcomingSession[] {
  return formations
    .flatMap((formation) => {
      const sessions = sessionsOf(formation).filter((s) => s.statut !== 'ANNULEE');
      return sessions.map((session, index): UpcomingSession => ({ session, formation, rank: index + 1, total: sessions.length }));
    })
    .filter((item) => item.session.statut !== 'TERMINEE' && time(item.session.dateFin) >= now)
    .sort((a, b) => time(a.session.dateDebut) - time(b.session.dateDebut))
    .slice(0, limit);
}

/** Valeur d'un champ « datetime-local » (heure d'Ouagadougou, UTC) au format attendu par l'API. */
export function toApiDateTime(local: string): string {
  return local.length === 16 ? `${local}:00` : local;
}

/** Libellé d'un nombre réel d'inscrits ; vide si le serveur ne le fournit pas. */
export function enrolledLabel(count: number | null | undefined): string {
  if (count === null || count === undefined) return '';
  return count > 1 ? `${new Intl.NumberFormat('fr-FR').format(count)} inscrits` : count === 1 ? '1 inscrit' : 'Aucun inscrit';
}
