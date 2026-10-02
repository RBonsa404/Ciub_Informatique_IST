import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { toPage } from '../../core/api/public.api';
import { AuthStore } from '../../core/auth/auth.store';
import { FeatureService } from '../../core/config/feature.service';
import { formatDate, formatDateRange, formatTimeRange, initialsOf, parseApiDate, toBlocks } from '../../shared/format/format';
import { InscriptionAction } from '../../shared/inscription/inscription-action';
import { parsePresentation } from './about-pages';
import { ActualitesListPage } from './actualites-pages';
import { ContactPage } from './contact-page';
import { HomePage } from './home-page';
import { CONDITIONS_UTILISATION, MENTIONS_LEGALES, POLITIQUE_CONFIDENTIALITE } from './legal-content';
import { MentionsLegalesPage } from './legal-pages';

const page = <T>(content: T[]) => ({ content, page: 0, size: 10, totalElements: content.length, totalPages: content.length ? 1 : 0 });

function setup() {
  localStorage.clear();
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: FeatureService, useValue: { isEnabled: () => true } }],
  });
  return TestBed.inject(HttpTestingController);
}

const text = (fixture: ComponentFixture<unknown>) => (fixture.nativeElement as HTMLElement).textContent ?? '';

describe('formats', () => {
  it('lit une date sans fuseau en UTC et la formate en français', () => {
    expect(parseApiDate('2026-10-08T14:00:00')!.toISOString()).toBe('2026-10-08T14:00:00.000Z');
    expect(formatDate('2026-10-08T14:00:00', 'long')).toBe('8 octobre 2026');
    expect(formatDate('2026-10-08T23:30:00', 'jour')).toBe('08');
    expect(formatDate(null)).toBe('');
  });

  it('formate une plage de dates et d’heures', () => {
    expect(formatDateRange('2026-10-18T09:00:00', '2026-10-18T18:00:00')).toBe('18 octobre 2026');
    expect(formatDateRange('2026-10-18T09:00:00', '2026-10-19T18:00:00')).toBe('du 18 au 19 octobre 2026');
    expect(formatTimeRange('2026-10-18T09:00:00', '2026-10-18T18:00:00')).toBe('09:00 – 18:00');
  });

  it('découpe un texte libre en paragraphes, titres et citations', () => {
    expect(toBlocks('Un.\n\n# Titre\n\n> Citation\n\nDeux.').map((b) => b.kind)).toEqual(['paragraph', 'heading', 'quote', 'paragraph']);
    expect(toBlocks(null)).toEqual([]);
  });

  it('calcule les initiales d’un avatar neutre', () => {
    expect(initialsOf('Aminata Sawadogo')).toBe('AS');
    expect(initialsOf('Issouf')).toBe('I');
    expect(initialsOf(null)).toBe('');
  });

  it('uniformise la pagination du backend', () => {
    expect(toPage({ content: [1, 2], page: 3, size: 2, totalElements: 9, totalPages: 5 })).toEqual({ content: [1, 2], page: 3, size: 2, totalElements: 9, totalPages: 5 });
    expect(toPage(null).content).toEqual([]);
  });
});

describe('parsePresentation', () => {
  it('sépare l’introduction des sections titrées', () => {
    const content = parsePresentation('Introduction.\n\n# Mission\n\nTexte de mission.\n\n# Valeurs\n\nTexte de valeurs.');
    expect(content.intro).toEqual(['Introduction.']);
    expect(content.sections.map((s) => s.title)).toEqual(['Mission', 'Valeurs']);
  });

  it('traite un titre unique suivi d’un texte comme une introduction', () => {
    expect(parsePresentation('# Titre\n\nTexte.')).toEqual({ intro: ['Texte.'], sections: [] });
  });

  it('renvoie un contenu vide pour un texte vide', () => {
    expect(parsePresentation('')).toEqual({ intro: [], sections: [] });
  });
});

describe('HomePage', () => {
  it('n’affiche aucun chiffre pendant le chargement', () => {
    const http = setup();
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    expect(text(fixture)).not.toMatch(/\d/);
    http.match(() => true);
  });

  it('masque les sections sans donnée', () => {
    const http = setup();
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    http.expectOne((r) => r.url === '/api/v1/pages/accueil').flush({ slug: 'accueil', titre: 'Accueil', contenu: '' });
    http.expectOne((r) => r.url === '/api/v1/evenements').flush(page([]));
    http.expectOne((r) => r.url === '/api/v1/actualites').flush(page([]));
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('section').length).toBe(1);
    expect(text(fixture)).not.toContain('Prochains événements');
    expect(text(fixture)).not.toContain('actualités');
  });

  it('masque une section en erreur et affiche l’autre', () => {
    const http = setup();
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    http.expectOne((r) => r.url === '/api/v1/pages/accueil').flush(null, { status: 404, statusText: 'Not Found' });
    http.expectOne((r) => r.url === '/api/v1/evenements').flush(null, { status: 500, statusText: 'Erreur' });
    http
      .expectOne((r) => r.url === '/api/v1/actualites')
      .flush(page([{ id: 1, titre: 'Titre réel', slug: 'titre-reel', contenu: 'x', datePublication: '2026-10-01T10:00:00' }]));
    fixture.detectChanges();
    expect(text(fixture)).not.toContain('Prochains événements');
    expect(text(fixture)).toContain('Titre réel');
    expect(text(fixture)).toContain('1 oct. 2026');
  });

  it('demande les événements à venir triés par date', () => {
    const http = setup();
    TestBed.createComponent(HomePage).detectChanges();
    const request = http.expectOne((r) => r.url === '/api/v1/evenements').request;
    expect(request.params.get('aVenir')).toBe('true');
    expect(request.params.get('sort')).toBe('dateDebut,asc');
    http.match(() => true);
  });
});

describe('ActualitesListPage', () => {
  it('affiche l’état vide de l’annexe C', () => {
    const http = setup();
    const fixture = TestBed.createComponent(ActualitesListPage);
    fixture.detectChanges();
    http.expectOne((r) => r.url === '/api/v1/actualites').flush(page([]));
    http.expectOne('/api/v1/categories').flush([]);
    fixture.detectChanges();
    expect(text(fixture)).toContain('Aucune publication n’a encore été diffusée.');
  });

  it('affiche l’état d’erreur avec l’action « Réessayer » puis recharge', () => {
    const http = setup();
    const fixture = TestBed.createComponent(ActualitesListPage);
    fixture.detectChanges();
    http.expectOne((r) => r.url === '/api/v1/actualites').flush(null, { status: 503, statusText: 'x' });
    http.expectOne('/api/v1/categories').flush([]);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[role=alert]')!.textContent).toContain('Les données n’ont pas pu être chargées');
    root.querySelector<HTMLButtonElement>('[role=alert] button')!.click();
    http.expectOne((r) => r.url === '/api/v1/actualites').flush(page([]));
  });

  it('filtre par catégorie réelle côté serveur', () => {
    const http = setup();
    const fixture = TestBed.createComponent(ActualitesListPage);
    fixture.detectChanges();
    http.expectOne((r) => r.url === '/api/v1/actualites').flush(page([{ id: 1, titre: 'A', slug: 'a', contenu: 'x' }]));
    http.expectOne('/api/v1/categories').flush([{ id: 7, nom: 'Vie du club', slug: 'vie-du-club' }]);
    fixture.detectChanges();
    const chip = [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.filter-chips button')].find((b) => b.textContent!.includes('Vie du club'))!;
    chip.click();
    const request = http.expectOne((r) => r.url === '/api/v1/actualites').request;
    expect(request.params.get('categorieId')).toBe('7');
    expect(request.params.get('page')).toBe('0');
  });
});

describe('InscriptionAction', () => {
  function create(http: HttpTestingController, roles: readonly ('MEMBRE' | 'ADMIN')[] | null, inputs: Record<string, unknown> = {}) {
    if (roles) TestBed.inject(AuthStore).setSession({ accessToken: 't', expiresIn: 900, utilisateur: { id: 1, email: 'e', nom: 'N', prenom: 'P', roles } }, false);
    const fixture = TestBed.createComponent(InscriptionAction);
    fixture.componentRef.setInput('target', { kind: 'evenement', id: 12 });
    for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
    fixture.detectChanges();
    return fixture;
  }

  it('invite un visiteur à se connecter', () => {
    const http = setup();
    const fixture = create(http, null);
    expect(text(fixture)).toContain('Se connecter pour participer');
    http.expectNone('/api/v1/inscriptions/me');
  });

  it('ne propose aucune action à un rôle sans espace Membre', () => {
    const http = setup();
    const fixture = create(http, ['ADMIN']);
    expect(text(fixture).trim()).toBe('');
  });

  it('inscrit un membre et affiche le statut renvoyé par le serveur', () => {
    const http = setup();
    const fixture = create(http, ['MEMBRE'], { full: true });
    http.expectOne((r) => r.url === '/api/v1/inscriptions/me').flush(page([]));
    fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')!;
    expect(button.textContent).toContain('Rejoindre la liste d’attente');
    button.click();
    http.expectOne({ method: 'POST', url: '/api/v1/inscriptions/evenements/12' }).flush({ id: 5, evenementId: 12, statut: 'LISTE_ATTENTE', dateInscription: '2026-10-01T10:00:00' });
    fixture.detectChanges();
    expect(text(fixture)).toContain('Liste d’attente');
    expect(text(fixture)).toContain('Annuler mon inscription');
  });

  it('reconnaît une inscription existante', () => {
    const http = setup();
    const fixture = create(http, ['MEMBRE']);
    http.expectOne((r) => r.url === '/api/v1/inscriptions/me').flush(page([{ id: 9, evenementId: 12, statut: 'CONFIRMEE', dateInscription: '2026-10-01T10:00:00' }]));
    fixture.detectChanges();
    expect(text(fixture)).toContain('Inscription confirmée');
  });
});

describe('ContactPage', () => {
  function fill(root: HTMLElement): void {
    const set = (selector: string, value: string) => {
      const el = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
      el.value = value;
      el.dispatchEvent(new Event('input'));
    };
    set('[formcontrolname=nom]', '  Rasmata   Ilboudo ');
    set('[formcontrolname=email]', 'Rasmata.Ilboudo@Exemple.invalid');
    set('[formcontrolname=sujet]', 'Demande');
    set('[formcontrolname=message]', 'Un message suffisamment long.');
  }

  it('exige le consentement', () => {
    const http = setup();
    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    fill(root);
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    http.expectNone('/api/v1/contact');
    expect(text(fixture)).toContain('Votre accord est nécessaire');
  });

  it('envoie des valeurs normalisées avec le champ piège et la durée de saisie', () => {
    const http = setup();
    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    fill(root);
    root.querySelector<HTMLInputElement>('input[type=checkbox]')!.click();
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    const request = http.expectOne('/api/v1/contact');
    expect(request.request.body).toMatchObject({ nom: 'Rasmata Ilboudo', email: 'rasmata.ilboudo@exemple.invalid', sujet: 'Demande', siteWeb: '' });
    expect(typeof request.request.body.dureeSaisieMs).toBe('number');
    request.flush(null, { status: 201, statusText: 'Created' });
    fixture.detectChanges();
    expect(root.querySelector('[role=status]')!.textContent).toContain('Message envoyé');
  });

  it('n’affiche que les coordonnées réelles du club', () => {
    setup();
    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('a[href="mailto:clubinformatique.ist@gmail.com"]')).not.toBeNull();
    expect(root.querySelector('a[href="https://wa.me/22664931557"]')).not.toBeNull();
    expect(root.querySelector('a[href="tel:+22675545259"]')).not.toBeNull();
    expect(root.querySelector('a[href="tel:+22655633724"]')).not.toBeNull();
  });
});

describe('pages légales', () => {
  it('signalent les informations en attente au lieu de les inventer', () => {
    for (const document of [MENTIONS_LEGALES, POLITIQUE_CONFIDENTIALITE, CONDITIONS_UTILISATION]) {
      const pending = document.sections.flatMap((s) => s.paragraphs).filter((p) => p.pending);
      expect(pending.length).toBeGreaterThan(0);
      for (const paragraph of pending) expect(paragraph.text).toContain('Information en attente de validation par le club.');
    }
  });

  it('citent la loi applicable et l’autorité de contrôle', () => {
    const all = JSON.stringify(POLITIQUE_CONFIDENTIALITE);
    expect(all).toContain('loi n° 001-2021/AN du 30 mars 2021');
    expect(all).toContain('Commission de l’informatique et des libertés');
  });

  it('numérotent les sections et affichent la date de mise à jour', () => {
    setup();
    const fixture = TestBed.createComponent(MentionsLegalesPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect([...root.querySelectorAll('.number')].map((n) => n.textContent)).toEqual(['01', '02', '03', '04', '05']);
    expect(root.textContent).toContain('Dernière mise à jour : 1 octobre 2026');
    expect(root.querySelectorAll('h1').length).toBe(1);
  });
});
