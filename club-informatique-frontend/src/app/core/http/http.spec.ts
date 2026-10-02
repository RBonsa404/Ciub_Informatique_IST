import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthStore } from '../auth/auth.store';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { authInterceptor } from './auth.interceptor';
import { errorInterceptor } from './error.interceptor';
import { ApiError, toApiError } from './problem';

describe('toApiError', () => {
  const error = (status: number, body: unknown = null) => new HttpErrorResponse({ status, error: body });

  it('classe les erreurs par nature', () => {
    expect(toApiError(error(0)).kind).toBe('network');
    expect(toApiError(error(401)).kind).toBe('unauthorized');
    expect(toApiError(error(403)).kind).toBe('forbidden');
    expect(toApiError(error(404)).kind).toBe('not-found');
    expect(toApiError(error(409)).kind).toBe('conflict');
    expect(toApiError(error(422)).kind).toBe('validation');
    expect(toApiError(error(429)).kind).toBe('rate-limit');
    expect(toApiError(error(503)).kind).toBe('server');
  });

  it('ne reprend jamais le détail technique d’une erreur serveur', () => {
    const apiError = toApiError(error(500, { status: 500, detail: 'NullPointerException at line 42' }));
    expect(apiError.userMessage).toBe('Un problème est survenu de notre côté. Réessayez dans quelques instants.');
  });

  it('reprend le détail métier et les erreurs de champ d’une validation', () => {
    const apiError = toApiError(
      error(422, { status: 422, detail: 'Cette adresse est déjà utilisée.', errors: [{ field: 'email', message: 'Adresse déjà utilisée.' }] }),
    );
    expect(apiError.userMessage).toBe('Cette adresse est déjà utilisée.');
    expect(apiError.fieldMessage('email')).toBe('Adresse déjà utilisée.');
    expect(apiError.fieldMessage('nom')).toBeNull();
  });
});

describe('intercepteurs HTTP', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let store: AuthStore;
  let toasts: ToastService;

  const session = { accessToken: 'jeton-1', expiresIn: 900, utilisateur: { id: 1, email: 'a@exemple.invalid', nom: 'Nom', prenom: 'Prénom', roles: ['MEMBRE' as const] } };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withInterceptors([errorInterceptor, authInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    store = TestBed.inject(AuthStore);
    toasts = TestBed.inject(ToastService);
  });

  afterEach(() => controller.verify());

  it('ajoute le jeton d’accès aux appels d’API uniquement', () => {
    store.setSession(session);
    http.get('/api/v1/formations').subscribe();
    http.get('/icons/sprite.svg').subscribe();

    expect(controller.expectOne('/api/v1/formations').request.headers.get('Authorization')).toBe('Bearer jeton-1');
    expect(controller.expectOne('/icons/sprite.svg').request.headers.has('Authorization')).toBe(false);
  });

  it('rafraîchit la session sur une réponse 401 puis rejoue la requête', () => {
    store.setSession(session);
    let result: unknown;
    http.get('/api/v1/inscriptions/me').subscribe((value) => (result = value));

    controller.expectOne('/api/v1/inscriptions/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    const refresh = controller.expectOne('/api/v1/auth/refresh');
    expect(refresh.request.withCredentials).toBe(true);
    expect(refresh.request.headers.has('Authorization')).toBe(false);
    refresh.flush({ ...session, accessToken: 'jeton-2' });

    const retried = controller.expectOne('/api/v1/inscriptions/me');
    expect(retried.request.headers.get('Authorization')).toBe('Bearer jeton-2');
    retried.flush({ ok: true });
    expect(result).toEqual({ ok: true });
  });

  it('ferme la session et renvoie à la connexion si le rafraîchissement échoue', () => {
    store.setSession(session);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    let failure: unknown;
    http.get('/api/v1/inscriptions/me').subscribe({ error: (error: unknown) => (failure = error) });

    controller.expectOne('/api/v1/inscriptions/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    controller.expectOne('/api/v1/auth/refresh').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(store.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/connexion'], expect.objectContaining({ queryParams: expect.objectContaining({ motif: 'session-expiree' }) }));
    expect(failure).toBeInstanceOf(ApiError);
  });

  it('ne tente aucun rafraîchissement pour un visiteur', () => {
    let failure: unknown;
    http.get('/api/v1/inscriptions/me').subscribe({ error: (error: unknown) => (failure = error) });
    controller.expectOne('/api/v1/inscriptions/me').flush(null, { status: 401, statusText: 'Unauthorized' });

    controller.expectNone('/api/v1/auth/refresh');
    expect((failure as ApiError).kind).toBe('unauthorized');
  });

  it('notifie une erreur serveur avec le message générique', () => {
    http.get('/api/v1/actualites').subscribe({ error: () => {} });
    controller.expectOne('/api/v1/actualites').flush({ status: 500, detail: 'trace interne' }, { status: 500, statusText: 'Server Error' });

    expect(toasts.toasts().map((toast) => toast.message)).toEqual(['Un problème est survenu de notre côté. Réessayez dans quelques instants.']);
  });
});
