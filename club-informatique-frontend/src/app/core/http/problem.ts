import { HttpErrorResponse } from '@angular/common/http';

/** Erreur au format RFC 9457 (« problem details »), étendue par un code stable et des erreurs de champ. */
export interface ProblemDetails {
  readonly type?: string;
  readonly title?: string;
  readonly status: number;
  readonly detail?: string;
  readonly instance?: string;
  readonly code?: string;
  readonly errors?: readonly FieldProblem[];
}

export interface FieldProblem {
  readonly field: string;
  readonly message: string;
}

export type ApiErrorKind = 'network' | 'unauthorized' | 'forbidden' | 'not-found' | 'conflict' | 'validation' | 'rate-limit' | 'server' | 'unknown';

export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    readonly status: number,
    readonly userMessage: string,
    readonly problem: ProblemDetails | null,
  ) {
    super(userMessage);
    this.name = 'ApiError';
  }

  fieldMessage(field: string): string | null {
    return this.problem?.errors?.find((e) => e.field === field)?.message ?? null;
  }
}

/** Messages de l'annexe C. Le détail renvoyé par le serveur n'est repris que pour les erreurs métier. */
const MESSAGES: Record<ApiErrorKind, string> = {
  network: 'Les données n’ont pas pu être chargées. Vérifiez votre connexion, puis réessayez.',
  unauthorized: 'Votre session a expiré. Veuillez vous reconnecter.',
  forbidden: 'Vous n’avez pas accès à cette page.',
  'not-found': 'Cette page est introuvable.',
  conflict: 'Cette opération entre en conflit avec des données existantes.',
  validation: 'Certains champs sont invalides. Vérifiez votre saisie.',
  'rate-limit': 'Trop de tentatives. Réessayez dans quelques minutes.',
  server: 'Un problème est survenu de notre côté. Réessayez dans quelques instants.',
  unknown: 'Un problème est survenu de notre côté. Réessayez dans quelques instants.',
};

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (!(error instanceof HttpErrorResponse)) return new ApiError('unknown', 0, MESSAGES.unknown, null);

  const kind = kindOf(error.status);
  const problem = isProblem(error.error) ? error.error : null;
  const businessDetail = (kind === 'conflict' || kind === 'validation') && problem?.detail ? problem.detail : null;
  return new ApiError(kind, error.status, businessDetail ?? MESSAGES[kind], problem);
}

function kindOf(status: number): ApiErrorKind {
  if (status === 0) return 'network';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  if (status === 409) return 'conflict';
  if (status === 400 || status === 422) return 'validation';
  if (status === 429) return 'rate-limit';
  if (status >= 500) return 'server';
  return 'unknown';
}

function isProblem(body: unknown): body is ProblemDetails {
  return typeof body === 'object' && body !== null && 'status' in body;
}
