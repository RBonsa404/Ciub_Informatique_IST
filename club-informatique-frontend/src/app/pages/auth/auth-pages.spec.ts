import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { toSession } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
import { normalizeSpaces, passwordCriteria, passwordScore } from '../../core/auth/password-policy';
import { LoginPage } from './login-page';
import { ResetPasswordPage } from './password-pages';
import { RegisterPage } from './register-page';
import { safeReturnUrl } from './return-url';

function setup(query: Record<string, string> = {}) {
  localStorage.clear();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
    ],
  });
  return { http: TestBed.inject(HttpTestingController), router: TestBed.inject(Router) };
}

function type(root: HTMLElement, selector: string, value: string): void {
  const input = root.querySelector<HTMLInputElement>(selector)!;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  input.dispatchEvent(new Event('blur'));
}

describe('politique de mot de passe', () => {
  it('exige longueur, minuscule, majuscule, chiffre et symbole', () => {
    expect(passwordScore('')).toBe(0);
    expect(passwordScore('abc')).toBe(1);
    expect(passwordScore('Abcdefgh')).toBe(3);
    expect(passwordScore('Abcdefg1')).toBe(4);
    expect(passwordScore('Abcdef1#')).toBe(5);
  });

  it('accepte tout symbole et les lettres accentuées', () => {
    expect(passwordCriteria('Éléphant-2026').symbole).toBe(true);
    expect(passwordScore('Éléphant-2026')).toBe(5);
  });

  it('normalise une saisie libre', () => {
    expect(normalizeSpaces('  Réseaux   et  télécommunications ')).toBe('Réseaux et télécommunications');
  });
});

describe('safeReturnUrl', () => {
  it('n’accepte que des chemins internes', () => {
    expect(safeReturnUrl('/espace/profil')).toBe('/espace/profil');
    expect(safeReturnUrl(null)).toBe('/espace');
    expect(safeReturnUrl('https://exemple.invalid/')).toBe('/espace');
    expect(safeReturnUrl('//exemple.invalid')).toBe('/espace');
    expect(safeReturnUrl('/\\exemple.invalid')).toBe('/espace');
    expect(safeReturnUrl('/connexion')).toBe('/espace');
  });
});

describe('toSession', () => {
  it('accepte le contrat cible', () => {
    const session = toSession({ accessToken: 'a', expiresIn: 900, utilisateur: { id: 7, email: 'e', nom: 'N', prenom: 'P', roles: ['FORMATEUR'] } });
    expect(session.utilisateur).toEqual({ id: 7, email: 'e', nom: 'N', prenom: 'P', roles: ['FORMATEUR'], changementMotDePasseRequis: false });
  });

  it('adapte la réponse du backend existant (champs à plat, rôles préfixés) et écarte les rôles inconnus', () => {
    const session = toSession({ accessToken: 'a', refreshToken: 'r', expiresIn: 900, userId: 3, email: 'e', nom: 'N', prenom: 'P', roles: ['ROLE_MEMBRE', 'ROLE_INCONNU'] });
    expect(session.utilisateur.id).toBe(3);
    expect(session.utilisateur.roles).toEqual(['MEMBRE']);
    expect(JSON.stringify(session)).not.toContain('refreshToken');
  });

  it('rejette une réponse sans jeton', () => {
    expect(() => toSession({ require2fa: true })).toThrow();
  });
});

describe('LoginPage', () => {
  it('affiche le même message pour un compte inconnu et un mot de passe erroné', () => {
    const { http } = setup();
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const messages: string[] = [];
    for (const status of [401, 400]) {
      type(root, 'input[type=email]', 'personne@exemple.invalid');
      type(root, 'input[type=password]', 'Secret@123');
      root.querySelector('form')!.dispatchEvent(new Event('submit'));
      http.expectOne('/api/auth/login').flush({ status }, { status, statusText: 'x' });
      fixture.detectChanges();
      messages.push(root.querySelector('[role=alert] span')!.textContent!.trim());
    }
    expect(messages[0]).toBe('Adresse électronique ou mot de passe incorrect. Veuillez réessayer.');
    expect(messages[1]).toBe(messages[0]);
  });

  it('n’envoie rien si un champ obligatoire manque', () => {
    const { http } = setup();
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    http.expectNone('/api/auth/login');
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('[aria-invalid=true]').length).toBe(2);
  });

  it('ouvre la session en mémoire et suit la destination interne demandée', () => {
    const { http, router } = setup({ retour: '/espace/profil' });
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    type(root, 'input[type=email]', ' Aminata.Sawadogo@Exemple.invalid ');
    type(root, 'input[type=password]', 'Secret@123');
    root.querySelector('form')!.dispatchEvent(new Event('submit'));

    const request = http.expectOne('/api/auth/login');
    expect(request.request.body.email).toBe('aminata.sawadogo@exemple.invalid');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ accessToken: 'jeton', expiresIn: 900, utilisateur: { id: 1, email: 'e', nom: 'Sawadogo', prenom: 'Aminata', roles: ['MEMBRE'] } });

    expect(TestBed.inject(AuthStore).isAuthenticated()).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/espace/profil');
    expect(JSON.stringify({ ...localStorage })).not.toContain('jeton');
  });

  it('annonce l’expiration de session', () => {
    setup({ motif: 'session-expiree' });
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role=status]')!.textContent).toContain('Votre session a expiré');
  });
});

describe('RegisterPage', () => {
  function fill(root: HTMLElement, overrides: Record<string, string> = {}): void {
    const values: Record<string, string> = {
      nom: ' Kaboré ',
      prenom: 'Issouf',
      email: 'Issouf.Kabore@Exemple.invalid',
      filiere: '  Génie   logiciel, 3e année ',
      motDePasse: 'Secret@123',
      confirmation: 'Secret@123',
      ...overrides,
    };
    for (const [name, value] of Object.entries(values)) type(root, `[formcontrolname=${name}]`, value);
  }

  it('propose la filière en saisie libre, jamais en liste', () => {
    setup();
    const fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[formcontrolname=filiere]')!.tagName).toBe('INPUT');
    expect(root.querySelector('select')).toBeNull();
  });

  it('exige le consentement, décoché par défaut', () => {
    const { http } = setup();
    const fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector<HTMLInputElement>('input[type=checkbox]')!.checked).toBe(false);
    fill(root);
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    http.expectNone('/api/auth/register');
    expect(root.textContent).toContain('Votre accord est nécessaire');
  });

  it('refuse une confirmation différente', () => {
    const { http } = setup();
    const fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    fill(root, { confirmation: 'Autre@1234' });
    root.querySelector<HTMLInputElement>('input[type=checkbox]')!.click();
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    http.expectNone('/api/auth/register');
    expect(root.textContent).toContain('Les deux mots de passe ne sont pas identiques.');
  });

  it('envoie des valeurs normalisées et affiche l’écran de vérification quand le backend l’exige', () => {
    const { http } = setup();
    const fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    fill(root);
    root.querySelector<HTMLInputElement>('input[type=checkbox]')!.click();
    root.querySelector('form')!.dispatchEvent(new Event('submit'));

    const request = http.expectOne('/api/auth/register');
    expect(request.request.body).toEqual({
      nom: 'Kaboré',
      prenom: 'Issouf',
      email: 'issouf.kabore@exemple.invalid',
      filiere: 'Génie logiciel, 3e année',
      motDePasse: 'Secret@123',
      consentement: true,
    });
    request.flush(null, { status: 201, statusText: 'Created' });
    fixture.detectChanges();
    expect(root.querySelector('h1')!.textContent).toContain('Vérifiez votre');
    expect(TestBed.inject(AuthStore).isAuthenticated()).toBe(false);
  });

  it('ne confirme pas l’existence d’un compte en cas de conflit', () => {
    const { http } = setup();
    const fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    fill(root);
    root.querySelector<HTMLInputElement>('input[type=checkbox]')!.click();
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    http.expectOne('/api/auth/register').flush({ status: 409, detail: 'Un compte existe déjà avec cette adresse' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    const alert = root.querySelector('[role=alert]')!.textContent!;
    expect(alert).toContain('existe peut-être déjà');
  });
});

describe('ResetPasswordPage', () => {
  it('affiche un écran dédié quand le lien ne porte pas de jeton', () => {
    setup();
    const fixture = TestBed.createComponent(ResetPasswordPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('h1')!.textContent).toContain('Lien invalide');
    expect(root.querySelector('form')).toBeNull();
  });

  it('calcule la robustesse sur la saisie et signale un jeton refusé', () => {
    const { http } = setup({ jeton: 'abc' });
    const fixture = TestBed.createComponent(ResetPasswordPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('.strength-bars .on').length).toBe(0);

    type(root, '[formcontrolname=motDePasse]', 'Secret@123');
    type(root, '[formcontrolname=confirmation]', 'Secret@123');
    fixture.detectChanges();
    expect(root.querySelectorAll('.strength-bars .on').length).toBe(5);

    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    const request = http.expectOne('/api/auth/reset-password');
    expect(request.request.body).toEqual({ token: 'abc', nouveauMotDePasse: 'Secret@123' });
    request.flush({ status: 400 }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();
    expect(root.querySelector('[role=alert]')!.textContent).toContain('invalide ou a expiré');
  });
});

// Référence conservée pour documenter le type d'erreur manipulé par les pages.
void HttpErrorResponse;
