import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SiteTextsPage, apercu } from './site-texts-page';

const text = (fixture: ComponentFixture<unknown>) => (fixture.nativeElement as HTMLElement).textContent ?? '';
const root = (fixture: ComponentFixture<unknown>) => fixture.nativeElement as HTMLElement;

function setup() {
  TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
  const http = TestBed.inject(HttpTestingController);
  const fixture = TestBed.createComponent(SiteTextsPage);
  fixture.detectChanges();
  return { http, fixture };
}

function repondre(http: HttpTestingController, accueil: string, presentation: string) {
  http.expectOne('/api/v1/pages/accueil').flush({ slug: 'accueil', titre: 'Accueil', contenu: accueil });
  http.expectOne('/api/v1/pages/presentation').flush({ slug: 'presentation', titre: 'Qui sommes-nous', contenu: presentation });
}

describe('Textes du site', () => {
  it('construit l’aperçu de la présentation : introduction, puis une carte par titre', () => {
    const resultat = apercu('presentation', 'Introduction.\n\n# Ce que nous faisons\n\nDes ateliers.\n\n# Nous rejoindre\n\nInscription en ligne.');
    expect(resultat.intro).toEqual(['Introduction.']);
    expect(resultat.sections.map((section) => section.title)).toEqual(['Ce que nous faisons', 'Nous rejoindre']);
  });

  it('ne garde que les paragraphes pour l’accueil', () => {
    expect(apercu('accueil', '# Titre\n\nPremier.\n\nSecond.').intro).toEqual(['Premier.', 'Second.']);
  });

  it('reprend les textes enregistrés et les publie par le serveur', async () => {
    const { http, fixture } = setup();
    repondre(http, 'Texte d’accueil enregistré.', 'Intro.\n\n# Carte\n\nTexte de carte.');
    fixture.detectChanges();
    await fixture.whenStable();

    const zone = root(fixture).querySelector<HTMLTextAreaElement>('textarea')!;
    expect(zone.value).toBe('Texte d’accueil enregistré.');
    expect(text(fixture)).toContain('Texte d’accueil enregistré.');

    zone.value = 'Nouveau texte d’accueil.';
    zone.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(text(fixture)).toContain('Nouveau texte d’accueil.');

    root(fixture).querySelector('form')!.dispatchEvent(new Event('submit'));
    const envoi = http.expectOne((r) => r.method === 'PUT' && r.url === '/api/v1/pages/accueil');
    expect(envoi.request.body).toEqual({ titre: 'Accueil', contenu: 'Nouveau texte d’accueil.' });
    envoi.flush({ slug: 'accueil', titre: 'Accueil', contenu: 'Nouveau texte d’accueil.' });
    http.verify();
  });

  it('refuse un texte vide sans appeler le serveur', async () => {
    const { http, fixture } = setup();
    repondre(http, '', '');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(text(fixture)).toContain('La page n’affiche aucun texte tant que celui-ci est vide.');
    root(fixture).querySelector('form')!.dispatchEvent(new Event('submit'));
    http.expectNone((r) => r.method === 'PUT');
  });

  it('passe à la présentation par l’onglet', async () => {
    const { http, fixture } = setup();
    repondre(http, 'Accueil.', 'Intro.\n\n# Ce que nous faisons\n\nDes ateliers.');
    fixture.detectChanges();
    await fixture.whenStable();
    const onglet = [...root(fixture).querySelectorAll<HTMLButtonElement>('[role="tab"]')].find((b) => b.textContent?.includes('Présentation'))!;
    onglet.click();
    fixture.detectChanges();
    expect(root(fixture).querySelector<HTMLInputElement>('input[type="text"]')!.value).toBe('Qui sommes-nous');
    expect(text(fixture)).toContain('Ce que nous faisons');
  });

  it('affiche l’état d’erreur si les textes ne se chargent pas', () => {
    const { http, fixture } = setup();
    http.expectOne('/api/v1/pages/accueil').flush(null, { status: 500, statusText: 'Erreur' });
    http.match('/api/v1/pages/presentation');
    fixture.detectChanges();
    expect(root(fixture).querySelector('textarea')).toBeNull();
  });
});
