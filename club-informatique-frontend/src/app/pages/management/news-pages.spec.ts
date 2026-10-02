import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Actualite, NotificationItem } from '../../core/api/models';
import { AuthStore } from '../../core/auth/auth.store';
import { FeatureService } from '../../core/config/feature.service';
import { DialogService } from '../../shared/ui/dialog/confirm-dialog';
import { internalPathValidator, webUrlValidator } from '../../shared/validators';
import { NotificationsPage, internalLink } from '../member/notifications-page';
import { PublicationsListPage } from '../member/publications-pages';
import { BroadcastPage } from './broadcast-page';
import { NewsEditorPage, NewsListPage, appendBlock } from './news-pages';

const page = <T>(content: T[]) => ({ content, page: 0, size: 10, totalElements: content.length, totalPages: content.length ? 1 : 0 });
const text = (fixture: ComponentFixture<unknown>) => (fixture.nativeElement as HTMLElement).textContent ?? '';

const article = (id: number, extra: Partial<Actualite> = {}): Actualite => ({
  id,
  titre: `Article ${id}`,
  slug: `article-${id}`,
  contenu: 'Contenu',
  publie: true,
  datePublication: '2026-10-01T09:00:00',
  auteurNom: 'Salif Kaboré',
  ...extra,
});

const notification = (id: number, extra: Partial<NotificationItem> = {}): NotificationItem => ({
  id,
  titre: `Notification ${id}`,
  message: 'Message',
  type: 'MESSAGE_GLOBAL',
  lue: false,
  createdAt: '2026-10-01T10:00:00',
  ...extra,
});

function setup(confirm = true) {
  localStorage.clear();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: FeatureService, useValue: { isEnabled: () => true } },
      { provide: DialogService, useValue: { confirm: () => of(confirm) } },
    ],
  });
  TestBed.inject(AuthStore).setSession(
    { accessToken: 'jeton', expiresIn: 900, utilisateur: { id: 11, email: 'salif.kabore@recette.invalid', nom: 'Kaboré', prenom: 'Salif', roles: ['MEMBRE', 'RESPONSABLE_CLUB'] } },
    false,
  );
  return TestBed.inject(HttpTestingController);
}

const fill = (root: HTMLElement, name: string, value: string, event = 'input') => {
  const control = root.querySelector<HTMLInputElement>(`[formcontrolname="${name}"]`)!;
  control.value = value;
  control.dispatchEvent(new Event(event));
};
const button = (root: HTMLElement, label: string) => [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.includes(label))!;

describe('validations partagées', () => {
  it('distingue une adresse web d’un chemin interne', () => {
    expect(webUrlValidator(new FormControl('https://exemple.invalid/image.png'))).toBeNull();
    expect(webUrlValidator(new FormControl('image.png'))).toEqual({ adresse: true });
    expect(internalPathValidator(new FormControl('/evenements'))).toBeNull();
    expect(internalPathValidator(new FormControl(''))).toBeNull();
    expect(internalPathValidator(new FormControl('//exemple.invalid'))).toEqual({ chemin: true });
    expect(internalPathValidator(new FormControl('https://exemple.invalid'))).toEqual({ chemin: true });
  });

  it('ne suit que les liens internes d’une notification', () => {
    expect(internalLink('/espace/inscriptions')).toBe('/espace/inscriptions');
    expect(internalLink('https://exemple.invalid')).toBeNull();
    expect(internalLink('//exemple.invalid')).toBeNull();
    expect(internalLink(null)).toBeNull();
  });
});

describe('NotificationsPage', () => {
  it('transmet les filtres, revérifie la page reçue et marque une notification comme lue', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(NotificationsPage);
    http.expectOne((r) => r.url.endsWith('/notifications')).flush(page([notification(1), notification(2, { lue: true, type: 'SYSTEME' })]));
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('li').length).toBe(2);

    button(root, 'Marquer comme lue').click();
    http.expectOne((r) => r.url.endsWith('/notifications/1/lue') && r.method === 'PUT').flush({ message: 'ok' });
    http.expectOne((r) => r.url.endsWith('/notifications')).flush(page([notification(1, { lue: true }), notification(2, { lue: true, type: 'SYSTEME' })]));
    http.expectOne((r) => r.url.endsWith('/notifications/non-lues/count')).flush({ nonLues: 0 });

    button(root, 'Non lues').click();
    const request = http.expectOne((r) => r.url.endsWith('/notifications'));
    expect(request.request.params.get('lue')).toBe('false');
    request.flush(page([notification(1, { lue: true })]));
    await fixture.whenStable();
    expect(text(fixture)).toContain('Vous n’avez aucune notification non lue.');
  });
});

describe('PublicationsListPage', () => {
  it('affiche les annonces réservées aux membres, sans réaction ni commentaire', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(PublicationsListPage);
    http.expectOne((r) => r.url.endsWith('/publications')).flush(page([article(1, { resume: 'Résumé de l’annonce', visibilite: 'MEMBRES' })]));
    await fixture.whenStable();
    expect(text(fixture)).toContain('Article 1');
    expect(text(fixture)).toContain('Résumé de l’annonce');
    expect(text(fixture)).not.toContain('commentaire');
  });
});

describe('gestion des actualités', () => {
  it('ajoute un bloc à la fin du contenu', () => {
    expect(appendBlock('', '# Titre')).toBe('# Titre');
    expect(appendBlock('Premier paragraphe.\n\n', '> Citation')).toBe('Premier paragraphe.\n\n> Citation');
  });

  it('filtre par statut et bascule la publication', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(NewsListPage);
    http.expectOne((r) => r.url.endsWith('/gestion/actualites')).flush(page([article(1), article(2, { publie: false, datePublication: null })]));
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('tbody tr').length).toBe(2);

    button(root, 'Publier').click();
    http.expectOne((r) => r.url.endsWith('/actualites/2/publication') && r.method === 'PATCH').flush(article(2));
    http.expectOne((r) => r.url.endsWith('/gestion/actualites')).flush(page([article(1), article(2)]));

    const select = root.querySelector<HTMLSelectElement>('select')!;
    select.value = 'brouillon';
    select.dispatchEvent(new Event('change'));
    const request = http.expectOne((r) => r.url.endsWith('/gestion/actualites'));
    expect(request.request.params.get('publie')).toBe('false');
    request.flush(page([]));
    await fixture.whenStable();
    expect(text(fixture)).toContain('Aucune actualité n’est en brouillon.');
  });

  it('enregistre un brouillon puis publie avec les champs du contrat', async () => {
    const http = setup();
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(NewsEditorPage);
    http.expectOne((r) => r.url.endsWith('/categories')).flush([]);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    button(root, 'Enregistrer le brouillon').click();
    await fixture.whenStable();
    http.expectNone((r) => r.method === 'POST');
    expect(text(fixture)).toContain('Ce champ est obligatoire.');

    fill(root, 'titre', 'Compte rendu');
    button(root, 'Citation').click();
    fill(root, 'image', 'couverture.png');
    button(root, 'Enregistrer le brouillon').click();
    await fixture.whenStable();
    http.expectNone((r) => r.method === 'POST');

    fill(root, 'image', '');
    button(root, 'Enregistrer le brouillon').click();
    const request = http.expectOne((r) => r.url.endsWith('/actualites') && r.method === 'POST');
    expect(request.request.body).toEqual({ titre: 'Compte rendu', resume: '', contenu: '> Texte de la citation', image: null, categorieId: null, publie: false, visibilite: 'PUBLIC' });
  });
});

describe('BroadcastPage', () => {
  it('n’envoie la notification qu’après confirmation', async () => {
    const http = setup(false);
    const fixture = TestBed.createComponent(BroadcastPage);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    fill(root, 'titre', 'Réunion mensuelle');
    fill(root, 'message', 'Jeudi à 16 h.');
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    http.expectNone((r) => r.method === 'POST');
  });

  it('envoie le titre, le message et le lien interne', async () => {
    const http = setup(true);
    const fixture = TestBed.createComponent(BroadcastPage);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    fill(root, 'titre', 'Réunion mensuelle');
    fill(root, 'message', 'Jeudi à 16 h.');
    await fixture.whenStable();
    expect(root.querySelector('.bubble')!.textContent).toContain('Réunion mensuelle');

    fill(root, 'lien', 'evenements');
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    http.expectNone((r) => r.method === 'POST');

    fill(root, 'lien', '/evenements');
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    const request = http.expectOne((r) => r.url.endsWith('/notifications/globales'));
    expect(request.request.body).toEqual({ titre: 'Réunion mensuelle', message: 'Jeudi à 16 h.', lien: '/evenements' });
  });
});
