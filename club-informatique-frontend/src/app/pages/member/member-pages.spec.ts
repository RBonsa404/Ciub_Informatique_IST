import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MemberApi } from '../../core/api/member.api';
import { Inscription, SupportsFormation } from '../../core/api/models';
import { AuthStore } from '../../core/auth/auth.store';
import { FeatureService } from '../../core/config/feature.service';
import { NotificationsStore } from '../../core/notifications/notifications.store';
import { MemberDashboardPage, upcomingOf } from './dashboard-page';
import { InscriptionsPage, matchesFilter } from './inscriptions-page';
import { ProfileEditPage, ProfilePage } from './profile-pages';
import { SettingsPage } from './settings-page';
import { SupportsListPage, safeUrl, toSupportItems } from './supports-pages';

const page = <T>(content: T[]) => ({ content, number: 0, size: 10, totalElements: content.length, totalPages: content.length ? 1 : 0 });
const text = (fixture: ComponentFixture<unknown>) => (fixture.nativeElement as HTMLElement).textContent ?? '';
const DAY = 86_400_000;
const iso = (offset: number) => new Date(Date.now() + offset).toISOString().slice(0, 19);

const inscription = (id: number, extra: Partial<Inscription> = {}): Inscription => ({
  id,
  evenementId: id,
  evenementTitre: `Événement ${id}`,
  dateDebut: iso(DAY * id),
  dateFin: iso(DAY * id + 3_600_000),
  dateInscription: iso(-DAY),
  statut: 'CONFIRMEE',
  ...extra,
});

const PROFIL = { id: 9, nom: 'Sawadogo', prenom: 'Aminata', email: 'aminata.sawadogo@recette.invalid', filiere: 'Informatique de gestion', statut: 'ACTIF' };

function setup() {
  localStorage.clear();
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: FeatureService, useValue: { isEnabled: () => true } }],
  });
  TestBed.inject(AuthStore).setSession(
    { accessToken: 'jeton', expiresIn: 900, utilisateur: { id: 9, email: PROFIL.email, nom: 'Sawadogo', prenom: 'Aminata', roles: ['MEMBRE'] } },
    false,
  );
  return TestBed.inject(HttpTestingController);
}

describe('upcomingOf', () => {
  it('ne garde que les inscriptions actives à venir, de la plus proche à la plus lointaine', () => {
    const result = upcomingOf([inscription(3), inscription(1), inscription(2, { statut: 'ANNULEE' }), inscription(4, { dateDebut: iso(-DAY * 2), dateFin: iso(-DAY) })]);
    expect(result.map((i) => i.id)).toEqual([1, 3]);
  });

  it('se limite à cinq activités', () => {
    expect(upcomingOf([1, 2, 3, 4, 5, 6, 7].map((id) => inscription(id))).length).toBe(5);
  });
});

describe('MemberDashboardPage', () => {
  it('affiche des squelettes puis les activités et notifications réelles, sans valeur provisoire', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(MemberDashboardPage);
    await fixture.whenStable();
    expect(text(fixture)).toContain('Bienvenue, Aminata');
    expect(fixture.nativeElement.querySelectorAll('[aria-busy="true"]').length).toBe(2);

    http.expectOne((r) => r.url.endsWith('/inscriptions/me')).flush(page([inscription(1, { statut: 'LISTE_ATTENTE' })]));
    http.expectOne((r) => r.url.endsWith('/notifications')).flush(page([{ id: 1, titre: 'Annonce', message: 'Texte', type: 'MESSAGE_GLOBAL', lue: false, createdAt: iso(-DAY) }]));
    await fixture.whenStable();
    expect(text(fixture)).toContain('Événement 1');
    expect(text(fixture)).toContain('Liste d’attente');
    expect(text(fixture)).toContain('Annonce');
  });

  it('affiche un état vide honnête quand aucune activité n’est à venir', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(MemberDashboardPage);
    http.expectOne((r) => r.url.endsWith('/inscriptions/me')).flush(page([]));
    http.expectOne((r) => r.url.endsWith('/notifications')).flush(page([]));
    await fixture.whenStable();
    expect(text(fixture)).toContain('Vous n’avez aucune activité à venir.');
    expect(text(fixture)).toContain('Vous n’avez aucune notification.');
  });
});

describe('NotificationsStore', () => {
  it('reste inconnu tant que le serveur n’a pas répondu, puis porte le nombre réel', () => {
    const http = setup();
    const store = TestBed.inject(NotificationsStore);
    expect(store.unread()).toBeNull();
    store.refresh();
    expect(store.unread()).toBeNull();
    http.expectOne((r) => r.url.endsWith('/notifications/non-lues/count')).flush({ nonLues: 3 });
    expect(store.unread()).toBe(3);
  });
});

describe('ProfilePage et ProfileEditPage', () => {
  it('affiche les informations réelles du compte et signale une présentation vide', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(ProfilePage);
    http.expectOne((r) => r.url.endsWith('/users/me')).flush({ ...PROFIL, numeroMembre: 'IST-2026-0001' });
    await fixture.whenStable();
    expect(text(fixture)).toContain('Aminata Sawadogo');
    expect(text(fixture)).toContain('IST-2026-0001');
    expect(text(fixture)).toContain('Vous n’avez pas encore renseigné de présentation.');
  });

  it('préremplit le formulaire, enregistre et répercute le nom sur la session', async () => {
    const http = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ProfileEditPage);
    http.expectOne((r) => r.url.endsWith('/users/me') && r.method === 'GET').flush(PROFIL);
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const prenom = root.querySelector<HTMLInputElement>('input[formcontrolname="prenom"]')!;
    expect(prenom.value).toBe('Aminata');
    prenom.value = '  Awa  ';
    prenom.dispatchEvent(new Event('input'));
    root.querySelector('form')!.dispatchEvent(new Event('submit'));

    const request = http.expectOne((r) => r.url.endsWith('/users/me') && r.method === 'PUT');
    expect(request.request.body).toEqual({ prenom: 'Awa', nom: 'Sawadogo', filiere: 'Informatique de gestion', biographie: '' });
    request.flush({ ...PROFIL, prenom: 'Awa' });
    expect(TestBed.inject(AuthStore).user()?.prenom).toBe('Awa');
    expect(navigate).toHaveBeenCalledWith('/espace/profil');
  });

  it('n’envoie rien si un champ obligatoire est vide', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(ProfileEditPage);
    http.expectOne((r) => r.url.endsWith('/users/me')).flush({ ...PROFIL, filiere: null });
    await fixture.whenStable();
    (fixture.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    http.expectNone((r) => r.method === 'PUT');
    expect(text(fixture)).toContain('Ce champ est obligatoire.');
  });
});

describe('InscriptionsPage', () => {
  it('revérifie le filtre côté client', () => {
    expect(matchesFilter(inscription(1), 'evenements')).toBe(true);
    expect(matchesFilter(inscription(1), 'formations')).toBe(false);
    expect(matchesFilter(inscription(1, { statut: 'LISTE_ATTENTE' }), 'attente')).toBe(true);
    expect(matchesFilter(inscription(1), 'attente')).toBe(false);
  });

  it('transmet le filtre au serveur et ne propose l’annulation que pour une inscription à venir', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(InscriptionsPage);
    http
      .expectOne((r) => r.url.endsWith('/inscriptions/me'))
      .flush(page([inscription(1), inscription(2, { statut: 'ANNULEE' }), inscription(3, { dateDebut: iso(-DAY * 2) })]));
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('li').length).toBe(3);
    expect(root.querySelectorAll('li button').length).toBe(1);

    const filters = root.querySelectorAll<HTMLButtonElement>('[role="group"] button');
    filters[1].click();
    const request = http.expectOne((r) => r.url.endsWith('/inscriptions/me'));
    expect(request.request.params.get('type')).toBe('FORMATION');
    expect(request.request.params.get('page')).toBe('0');
    request.flush(page([inscription(1)]));
    await fixture.whenStable();
    expect(text(fixture)).toContain('Vous n’êtes inscrit à aucune formation.');
  });
});

describe('supports', () => {
  const formations: SupportsFormation[] = [
    {
      formationId: 1,
      formationTitre: 'Python',
      ressources: [{ id: 5, titre: 'Diapositives', type: 'SUPPORT_COURS', urlFichier: 'https://exemple.invalid/a.pdf' }],
      devoirs: [
        { id: 2, formationId: 1, titre: 'Tard', dateLimite: '2030-02-01T10:00:00' },
        { id: 3, formationId: 1, titre: 'Tôt', dateLimite: '2030-01-01T10:00:00' },
      ],
    },
  ];

  it('place les devoirs par échéance avant les supports', () => {
    const items = toSupportItems(formations);
    expect(items.map((i) => i.titre)).toEqual(['Tôt', 'Tard', 'Diapositives']);
    expect(items[0].link).toEqual(['/espace/supports/devoirs', 1, 3]);
    expect(items[2].label).toBe('Support de cours');
  });

  it('n’ouvre que des adresses web', () => {
    expect(safeUrl('https://exemple.invalid/a.pdf')).toBe('https://exemple.invalid/a.pdf');
    expect(safeUrl('javascript:alert(1)')).toBeNull();
    expect(safeUrl(null)).toBeNull();
  });

  it('ne charge que les formations des inscriptions confirmées', () => {
    const http = setup();
    let result: readonly SupportsFormation[] | undefined;
    TestBed.inject(MemberApi)
      .supports()
      .subscribe((value) => (result = value));
    http
      .expectOne((r) => r.url.endsWith('/inscriptions/me'))
      .flush(
        page([
          inscription(1, { evenementId: null, sessionFormationId: 10, formationId: 1, formationTitre: 'Python' }),
          inscription(2, { evenementId: null, sessionFormationId: 20, formationId: 2, formationTitre: 'Réseau', statut: 'LISTE_ATTENTE' }),
        ]),
      );
    http.expectOne((r) => r.url.endsWith('/ressources/formation/1')).flush([]);
    http.expectOne((r) => r.url.endsWith('/formations/1/devoirs')).flush([]);
    http.expectNone((r) => r.url.includes('/formation/2'));
    expect(result).toEqual([{ formationId: 1, formationTitre: 'Python', ressources: [], devoirs: [] }]);
  });

  it('affiche un état vide quand le membre n’est inscrit à aucune formation', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(SupportsListPage);
    http.expectOne((r) => r.url.endsWith('/inscriptions/me')).flush(page([]));
    await fixture.whenStable();
    expect(text(fixture)).toContain('Aucun support ni devoir n’est disponible pour vos formations.');
  });
});

describe('SettingsPage', () => {
  it('signale un mot de passe actuel erroné sous le champ', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(SettingsPage);
    http.expectOne((r) => r.url.endsWith('/users/me/preferences')).flush({ notificationsCourriel: false });
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLButtonElement>('section button')!.click();
    await fixture.whenStable();

    const fill = (name: string, value: string) => {
      const input = root.querySelector<HTMLInputElement>(`input[formcontrolname="${name}"]`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    fill('ancien', 'Ancien@2026');
    fill('nouveau', 'Nouveau@2026x');
    fill('confirmation', 'Nouveau@2026x');
    root.querySelector('form')!.dispatchEvent(new Event('submit'));

    const request = http.expectOne((r) => r.url.endsWith('/users/me/password'));
    expect(request.request.body).toEqual({ ancienMotDePasse: 'Ancien@2026', nouveauMotDePasse: 'Nouveau@2026x' });
    request.flush({ status: 400, message: 'incorrect' }, { status: 400, statusText: 'Bad Request' });
    await fixture.whenStable();
    expect(text(fixture)).toContain('Le mot de passe actuel est incorrect.');
  });

  it('n’affiche pas la case des alertes tant que les préférences sont inconnues', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(SettingsPage);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('input[type="checkbox"]')).toBeNull();
    http.expectOne((r) => r.url.endsWith('/users/me/preferences')).flush(null, { status: 500, statusText: 'Erreur' });
    await fixture.whenStable();
    expect(text(fixture)).toContain('Vos préférences de notification n’ont pas pu être chargées.');
  });
});
