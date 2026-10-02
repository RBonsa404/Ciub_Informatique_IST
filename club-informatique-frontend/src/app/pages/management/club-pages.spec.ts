import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { MembreBureau, MessageContact } from '../../core/api/models';
import { AuthStore } from '../../core/auth/auth.store';
import { FeatureService } from '../../core/config/feature.service';
import { DialogService } from '../../shared/ui/dialog/confirm-dialog';
import { BureauManagementPage, nextOrder } from './bureau-management-page';
import { ContactMessagesPage, replyLink } from './contact-messages-page';
import { ManagementDashboardPage, toMonthBars } from './management-dashboard-page';

const page = <T>(content: T[], totalElements = content.length) => ({ content, page: 0, size: 10, totalElements, totalPages: content.length ? 1 : 0 });
const text = (fixture: ComponentFixture<unknown>) => (fixture.nativeElement as HTMLElement).textContent ?? '';
const button = (root: HTMLElement, label: string) => [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.includes(label))!;

const member = (id: number, ordre: number): MembreBureau => ({ id, nom: 'Kaboré', prenom: 'Salif', fonction: 'Président', filiere: null, ordre });
const message = (id: number, extra: Partial<MessageContact> = {}): MessageContact => ({
  id,
  nom: 'Fatoumata Traoré',
  email: 'fatoumata.traore@recette.invalid',
  sujet: 'Demande d’information',
  message: 'Bonjour.',
  traite: false,
  createdAt: '2026-10-01T10:00:00',
  ...extra,
});

function setup() {
  localStorage.clear();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: FeatureService, useValue: { isEnabled: () => true } },
      { provide: DialogService, useValue: { confirm: () => of(true) } },
    ],
  });
  TestBed.inject(AuthStore).setSession(
    { accessToken: 'jeton', expiresIn: 900, utilisateur: { id: 11, email: 'salif.kabore@recette.invalid', nom: 'Kaboré', prenom: 'Salif', roles: ['MEMBRE', 'RESPONSABLE_CLUB'] } },
    false,
  );
  return TestBed.inject(HttpTestingController);
}

describe('tableau de bord du Responsable', () => {
  it('calcule des barres proportionnelles à la plus forte valeur', () => {
    const bars = toMonthBars([
      { mois: '2026-09', inscriptions: 2 },
      { mois: '2026-10', inscriptions: 4 },
    ]);
    expect(bars.map((b) => b.height)).toEqual([50, 100]);
    expect(bars[1].label).toBe('oct');
    expect(toMonthBars([{ mois: '2026-10', inscriptions: 0 }])[0].height).toBe(0);
  });

  it('n’affiche aucun compteur avant la réponse, puis les totaux réels ; retire ce qui n’a pas de donnée', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(ManagementDashboardPage);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.tiles')!.textContent).not.toMatch(/\d/);

    http.expectOne((r) => r.url.endsWith('/gestion/actualites')).flush(page([], 12));
    for (const request of http.match((r) => r.url.endsWith('/gestion/evenements'))) request.flush(page([], 4));
    http.expectOne((r) => r.url.endsWith('/projets/en-attente')).flush([]);
    http.expectOne((r) => r.url.endsWith('/gestion/indicateurs')).flush(null, { status: 500, statusText: 'Erreur' });
    await fixture.whenStable();

    expect(root.querySelectorAll('.tile').length).toBe(3);
    expect(root.querySelector('.chart')).toBeNull();
    expect(root.querySelector('.tiles')!.textContent).toContain('12');
    expect(text(fixture)).toContain('Aucune proposition n’est en attente.');
  });
});

describe('BureauManagementPage', () => {
  it('propose le rang suivant', () => {
    expect(nextOrder([])).toBe(1);
    expect(nextOrder([member(1, 1), member(2, 4)])).toBe(5);
  });

  it('n’invente aucun membre et crée celui qui est saisi', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(BureauManagementPage);
    http.expectOne((r) => r.url.endsWith('/bureau') && r.method === 'GET').flush([]);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(text(fixture)).toContain('La composition du bureau n’a pas encore été saisie.');
    expect(root.querySelector('tbody')).toBeNull();

    button(root, 'Ajouter un membre').click();
    await fixture.whenStable();
    const fill = (name: string, value: string) => {
      const control = root.querySelector<HTMLInputElement>(`[formcontrolname="${name}"]`)!;
      control.value = value;
      control.dispatchEvent(new Event('input'));
    };
    fill('prenom', 'Aminata');
    fill('nom', 'Sawadogo');
    fill('fonction', 'Présidente');
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    const request = http.expectOne((r) => r.url.endsWith('/bureau') && r.method === 'POST');
    expect(request.request.body).toEqual({ prenom: 'Aminata', nom: 'Sawadogo', fonction: 'Présidente', filiere: null, ordre: 1 });
  });
});

describe('ContactMessagesPage', () => {
  it('compose une réponse par courriel avec le sujet d’origine', () => {
    expect(replyLink(message(1))).toBe('mailto:fatoumata.traore@recette.invalid?subject=Re%20%3A%20Demande%20d%E2%80%99information');
  });

  it('transmet le filtre au serveur et marque un message comme traité', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(ContactMessagesPage);
    const first = http.expectOne((r) => r.url.endsWith('/gestion/messages'));
    expect(first.request.params.has('traite')).toBe(false);
    first.flush(page([message(1), message(2, { traite: true, reponseParNom: 'Salif Kaboré' })]));
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(text(fixture)).toContain('Traité par Salif Kaboré');

    button(root, 'Marquer comme traité').click();
    http.expectOne((r) => r.url.endsWith('/gestion/messages/1/traite') && r.method === 'PUT').flush(message(1, { traite: true }));
    http.expectOne((r) => r.url.endsWith('/gestion/messages')).flush(page([message(1, { traite: true })]));

    button(root, 'Nouveaux').click();
    const request = http.expectOne((r) => r.url.endsWith('/gestion/messages'));
    expect(request.request.params.get('traite')).toBe('false');
    request.flush(page([]));
    await fixture.whenStable();
    expect(text(fixture)).toContain('Aucun message n’est en attente de traitement.');
  });
});
