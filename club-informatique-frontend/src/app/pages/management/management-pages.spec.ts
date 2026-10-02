import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Evenement, Inscription } from '../../core/api/models';
import { AuthStore } from '../../core/auth/auth.store';
import { FeatureService } from '../../core/config/feature.service';
import { toCsv, toLocalInput } from '../../shared/format/format';
import { EventsManagementPage, buildMonth, eventState } from './events-page';
import { RegistrationsPage, splitRegistrations } from './registrations-page';

const DAY = 86_400_000;
const iso = (offset: number) => new Date(Date.now() + offset).toISOString().slice(0, 19);
const page = <T>(content: T[]) => ({ content, page: 0, size: 10, totalElements: content.length, totalPages: content.length ? 1 : 0 });
const text = (fixture: ComponentFixture<unknown>) => (fixture.nativeElement as HTMLElement).textContent ?? '';

const event = (id: number, extra: Partial<Evenement> = {}): Evenement => ({
  id,
  titre: `Événement ${id}`,
  slug: `evenement-${id}`,
  description: 'Description',
  dateDebut: iso(DAY * id),
  dateFin: iso(DAY * id + 3_600_000),
  lieu: 'Salle des clubs',
  publie: true,
  ...extra,
});

const inscription = (id: number, nom: string, extra: Partial<Inscription> = {}): Inscription => ({
  id,
  utilisateurNom: nom,
  utilisateurEmail: `${nom.split(' ')[0].toLowerCase()}@recette.invalid`,
  evenementId: 1,
  dateInscription: iso(-DAY * id),
  statut: 'CONFIRMEE',
  ...extra,
});

function setup() {
  localStorage.clear();
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: FeatureService, useValue: { isEnabled: () => true } }],
  });
  TestBed.inject(AuthStore).setSession(
    { accessToken: 'jeton', expiresIn: 900, utilisateur: { id: 11, email: 'salif.kabore@recette.invalid', nom: 'Kaboré', prenom: 'Salif', roles: ['MEMBRE', 'RESPONSABLE_CLUB'] } },
    false,
  );
  return TestBed.inject(HttpTestingController);
}

describe('gestion des événements : modèle', () => {
  it('déduit l’état d’un événement de ses données', () => {
    expect(eventState(event(1, { publie: false })).label).toBe('Brouillon');
    expect(eventState(event(1, { dateDebut: iso(-DAY * 2), dateFin: iso(-DAY) })).label).toBe('Passé');
    expect(eventState(event(1, { capaciteMax: 2, placesRestantes: 0 })).label).toBe('Complet');
    expect(eventState(event(1, { capaciteMax: 2, placesRestantes: 1 })).label).toBe('À venir');
  });

  it('construit la grille d’un mois du lundi au dimanche et marque les jours d’événement', () => {
    const weeks = buildMonth(2026, 9, [event(1, { titre: 'Atelier', dateDebut: '2026-10-08T14:00:00' }), event(2, { dateDebut: '2026-11-02T10:00:00' })]);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    // Le 1er octobre 2026 est un jeudi : trois cases vides le précèdent.
    expect(weeks[0].map((cell) => cell.day)).toEqual([null, null, null, 1, 2, 3, 4]);
    const marked = weeks.flat().filter((cell) => cell.titles.length > 0);
    expect(marked).toEqual([{ day: 8, titles: ['Atelier'] }]);
    expect(weeks.flat().filter((cell) => cell.day !== null).length).toBe(31);
  });

  it('prépare les valeurs de formulaire et l’export', () => {
    expect(toLocalInput('2026-10-08T14:00:00')).toBe('2026-10-08T14:00');
    expect(toCsv([['Nom', 'Statut'], ['=SOMME(A1)', 'Dit "oui"']])).toBe('"Nom";"Statut"\r\n"\'=SOMME(A1)";"Dit ""oui"""');
  });
});

describe('EventsManagementPage', () => {
  it('liste les événements réels et valide le formulaire de création', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(EventsManagementPage);
    for (const request of http.match((r) => r.url.endsWith('/gestion/evenements'))) request.flush(page([event(1), event(2, { publie: false })]));
    http.expectOne((r) => r.url.endsWith('/categories')).flush([]);
    await fixture.whenStable();
    expect(text(fixture)).toContain('Événement 1');
    expect(text(fixture)).toContain('Brouillon');

    const root = fixture.nativeElement as HTMLElement;
    [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.includes('Nouvel événement'))!.click();
    await fixture.whenStable();
    const fill = (name: string, value: string) => {
      const control = root.querySelector<HTMLInputElement>(`[formcontrolname="${name}"]`)!;
      control.value = value;
      control.dispatchEvent(new Event('input'));
    };
    fill('titre', 'Soirée de rentrée');
    fill('lieu', 'Amphithéâtre');
    fill('dateDebut', '2030-01-10T18:00');
    fill('dateFin', '2030-01-10T17:00');
    fill('description', 'Accueil des nouveaux membres.');
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    http.expectNone((r) => r.method === 'POST');
    expect(text(fixture)).toContain('La fin doit être postérieure au début.');

    fill('dateFin', '2030-01-10T20:00');
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    const request = http.expectOne((r) => r.url.endsWith('/evenements') && r.method === 'POST');
    expect(request.request.body).toEqual({
      titre: 'Soirée de rentrée',
      description: 'Accueil des nouveaux membres.',
      dateDebut: '2030-01-10T18:00:00',
      dateFin: '2030-01-10T20:00:00',
      lieu: 'Amphithéâtre',
      capaciteMax: null,
      categorieId: null,
      publie: true,
    });
  });
});

describe('inscriptions et listes d’attente', () => {
  const list = [
    inscription(1, 'Salif Kaboré'),
    inscription(2, 'Aminata Sawadogo'),
    inscription(3, 'Mariam Zongo', { statut: 'LISTE_ATTENTE', dateInscription: '2026-10-02T10:00:00' }),
    inscription(4, 'Boukary Tapsoba', { statut: 'LISTE_ATTENTE', dateInscription: '2026-10-01T10:00:00' }),
    inscription(5, 'Issouf Ouédraogo', { statut: 'ANNULEE' }),
  ];

  it('sépare les confirmés (par nom) de la liste d’attente (par ancienneté)', () => {
    const result = splitRegistrations(list);
    expect(result.confirmed.map((i) => i.utilisateurNom)).toEqual(['Aminata Sawadogo', 'Salif Kaboré']);
    expect(result.waiting.map((i) => i.utilisateurNom)).toEqual(['Boukary Tapsoba', 'Mariam Zongo']);
    expect(splitRegistrations(list, 'zongo').waiting.length).toBe(1);
    expect(splitRegistrations(list, 'zongo').confirmed.length).toBe(0);
  });

  it('charge l’activité de l’adresse, conserve le rang réel et promeut un membre', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(RegistrationsPage);
    fixture.componentRef.setInput('evenement', '1');
    await fixture.whenStable();
    http.expectOne((r) => r.url.endsWith('/gestion/evenements')).flush(page([event(1)]));
    http.expectOne((r) => r.url.endsWith('/gestion/formations')).flush(page([]));
    await fixture.whenStable();
    http.expectOne((r) => r.url.endsWith('/inscriptions/evenements/1')).flush(list);
    await fixture.whenStable();
    expect(text(fixture)).toContain('Inscrits confirmés (2)');
    expect(text(fixture)).toContain('Liste d’attente (2)');
    expect(text(fixture)).toContain('Rang 1 sur la liste d’attente');

    const promote = [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.includes('Promouvoir'))!;
    promote.click();
    const request = http.expectOne((r) => r.url.endsWith('/inscriptions/4/statut') && r.method === 'PUT');
    expect(request.request.body).toEqual({ statut: 'CONFIRMEE', motif: null });
  });

  it('invite à choisir une activité quand aucune n’est sélectionnée', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(RegistrationsPage);
    await fixture.whenStable();
    http.expectOne((r) => r.url.endsWith('/gestion/evenements')).flush(page([event(1)]));
    http.expectOne((r) => r.url.endsWith('/gestion/formations')).flush(page([]));
    await fixture.whenStable();
    expect(text(fixture)).toContain('Choisissez une activité pour afficher ses inscriptions.');
    http.expectNone((r) => r.url.includes('/inscriptions/'));
  });
});
