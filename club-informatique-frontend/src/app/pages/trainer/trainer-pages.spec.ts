import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { Formation, Inscription, Presence, SessionFormation } from '../../core/api/models';
import { AuthStore } from '../../core/auth/auth.store';
import { FeatureService } from '../../core/config/feature.service';
import { AttendancePage, toAttendanceRows } from './attendance-page';
import { CourseDetailPage } from './course-detail-page';
import { CourseFormPage, CoursesListPage } from './courses-pages';
import { webUrlValidator } from '../../shared/validators';
import { PublishPage } from './publish-page';
import { TrainerDashboardPage } from './trainer-dashboard-page';
import { toApiDateTime } from '../../shared/format/format';
import { enrolledLabel, enrolledOf, ownedBy, progressOf, upcomingSessions } from './trainer-model';

const DAY = 86_400_000;
const iso = (offset: number) => new Date(Date.now() + offset).toISOString().slice(0, 19);
const page = <T>(content: T[]) => ({ content, number: 0, size: 10, totalElements: content.length, totalPages: content.length ? 1 : 0 });
const text = (fixture: ComponentFixture<unknown>) => (fixture.nativeElement as HTMLElement).textContent ?? '';

const session = (id: number, days: number, extra: Partial<SessionFormation> = {}): SessionFormation => ({
  id,
  formationId: 1,
  dateDebut: iso(DAY * days),
  dateFin: iso(DAY * days + 3_600_000),
  lieu: 'Salle informatique',
  capaciteMax: 20,
  nombreInscrits: 3,
  statut: 'PLANIFIEE',
  ...extra,
});

const formation = (id: number, extra: Partial<Formation> = {}): Formation => ({
  id,
  titre: `Cours ${id}`,
  slug: `cours-${id}`,
  description: 'Description',
  niveau: 'DEBUTANT',
  publie: true,
  formateurId: 10,
  sessions: [session(id * 10 + 1, -2), session(id * 10 + 2, 3)],
  ...extra,
});

function setup() {
  localStorage.clear();
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: FeatureService, useValue: { isEnabled: () => true } }],
  });
  TestBed.inject(AuthStore).setSession(
    { accessToken: 'jeton', expiresIn: 900, utilisateur: { id: 10, email: 'issouf.ouedraogo@recette.invalid', nom: 'Ouédraogo', prenom: 'Issouf', roles: ['MEMBRE', 'FORMATEUR'] } },
    false,
  );
  return TestBed.inject(HttpTestingController);
}

describe('modèle du formateur', () => {
  it('compte les séances tenues et les inscriptions des séances non annulées', () => {
    const course = formation(1, { sessions: [session(1, -2), session(2, 3), session(3, 5, { statut: 'ANNULEE', nombreInscrits: 9 })] });
    expect(progressOf(course)).toEqual({ done: 1, total: 2 });
    expect(enrolledOf(course)).toBe(6);
  });

  it('classe les séances à venir par date, avec leur rang dans le cours', () => {
    const result = upcomingSessions([formation(1), formation(2, { sessions: [session(21, 1), session(22, 2, { statut: 'ANNULEE' })] })], 5);
    expect(result.map((item) => item.session.id)).toEqual([21, 12]);
    expect(result[1]).toMatchObject({ rank: 2, total: 2 });
  });

  it('ne retient que les cours du formateur connecté', () => {
    expect([formation(1), formation(2, { formateurId: 99 })].filter(ownedBy(10)).map((f) => f.id)).toEqual([1]);
  });

  it('formate le nombre d’inscrits et les dates saisies', () => {
    expect(enrolledLabel(0)).toBe('Aucun inscrit');
    expect(enrolledLabel(1)).toBe('1 inscrit');
    expect(enrolledLabel(12)).toBe('12 inscrits');
    expect(enrolledLabel(null)).toBe('');
    expect(toApiDateTime('2026-11-05T23:59')).toBe('2026-11-05T23:59:00');
  });
});

describe('TrainerDashboardPage et CoursesListPage', () => {
  it('affiche les prochaines séances réelles du formateur', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(TrainerDashboardPage);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('[aria-busy="true"]').length).toBe(2);
    http.expectOne((r) => r.url.endsWith('/formations/admin/all')).flush(page([formation(1), formation(2, { formateurId: 99 })]));
    await fixture.whenStable();
    expect(text(fixture)).toContain('Bienvenue, Issouf');
    expect(text(fixture)).toContain('Séance 2 / 2');
    expect(text(fixture)).toContain('3 inscrits');
    expect(text(fixture)).not.toContain('Cours 2');
  });

  it('transmet le filtre de publication et affiche le message vide du filtre', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(CoursesListPage);
    http.expectOne((r) => r.url.endsWith('/formations/admin/all')).flush(page([formation(1)]));
    await fixture.whenStable();
    expect(text(fixture)).toContain('1 / 2 séances');

    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('[role="group"] button')[2].click();
    const request = http.expectOne((r) => r.url.endsWith('/formations/admin/all'));
    expect(request.request.params.get('publie')).toBe('false');
    request.flush(page([formation(1)]));
    await fixture.whenStable();
    expect(text(fixture)).toContain('Vous n’avez aucun cours en brouillon.');
  });
});

describe('CourseFormPage', () => {
  it('crée un cours avec les champs du contrat', async () => {
    const http = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(CourseFormPage);
    http.expectOne((r) => r.url.endsWith('/categories')).flush([{ id: 1, nom: 'Développement', slug: 'developpement' }]);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    http.expectNone((r) => r.method === 'POST');
    expect(text(fixture)).toContain('Ce champ est obligatoire.');

    const fill = (name: string, value: string) => {
      const control = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[formcontrolname="${name}"]`)!;
      control.value = value;
      control.dispatchEvent(new Event('input'));
    };
    fill('titre', '  Initiation   à Git ');
    fill('description', 'Découvrir Git.');
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    const request = http.expectOne((r) => r.url.endsWith('/formations') && r.method === 'POST');
    expect(request.request.body).toEqual({ titre: 'Initiation à Git', niveau: 'DEBUTANT', categorieId: null, description: 'Découvrir Git.', objectifs: '', prerequis: '', publie: false });
    request.flush(formation(7));
    expect(navigate).toHaveBeenCalledWith(['/espace/formateur/cours', 7]);
  });
});

describe('CourseDetailPage', () => {
  it('refuse une séance dont la fin précède le début et envoie une séance valide', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(CourseDetailPage);
    fixture.componentRef.setInput('id', '1');
    await fixture.whenStable();
    http.expectOne((r) => r.url.endsWith('/formations/1')).flush(formation(1));
    http.expectOne((r) => r.url.endsWith('/ressources/formation/1')).flush([]);
    http.expectOne((r) => r.url.endsWith('/formations/1/devoirs')).flush([]);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(text(fixture)).toContain('Aucun support ni devoir n’est publié.');
    expect(root.querySelectorAll('ol li').length).toBe(2);

    [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.includes('Planifier une séance'))!.click();
    await fixture.whenStable();
    const fill = (name: string, value: string) => {
      const control = root.querySelector<HTMLInputElement>(`[formcontrolname="${name}"]`)!;
      control.value = value;
      control.dispatchEvent(new Event('input'));
    };
    fill('dateDebut', '2030-05-10T16:00');
    fill('dateFin', '2030-05-10T14:00');
    fill('lieu', 'Salle B');
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    http.expectNone((r) => r.method === 'POST');
    expect(text(fixture)).toContain('La fin doit être postérieure au début.');

    fill('dateFin', '2030-05-10T18:00');
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    const request = http.expectOne((r) => r.url.endsWith('/formations/1/sessions') && r.method === 'POST');
    expect(request.request.body).toEqual({ dateDebut: '2030-05-10T16:00:00', dateFin: '2030-05-10T18:00:00', lieu: 'Salle B', lienVisio: null, capaciteMax: null, statut: 'PLANIFIEE' });
  });
});

describe('AttendancePage', () => {
  const inscrits: Inscription[] = [
    { id: 4, utilisateurNom: 'Aminata Sawadogo', sessionFormationId: 11, dateInscription: iso(-DAY), statut: 'CONFIRMEE' },
    { id: 5, utilisateurNom: 'Salif Kaboré', sessionFormationId: 11, dateInscription: iso(-DAY), statut: 'LISTE_ATTENTE' },
    { id: 6, utilisateurNom: 'Abdoul Compaoré', sessionFormationId: 11, dateInscription: iso(-DAY), statut: 'CONFIRMEE' },
  ];
  const presences: Presence[] = [{ id: 1, inscriptionId: 4, sessionId: 11, statut: 'ABSENT', datePointage: '2026-10-01T10:00:00' }];

  it('rapproche les inscrits confirmés des pointages enregistrés', () => {
    const rows = toAttendanceRows(inscrits, presences);
    expect(rows.map((r) => r.nom)).toEqual(['Abdoul Compaoré', 'Aminata Sawadogo']);
    expect(rows.map((r) => r.saved)).toEqual([null, 'ABSENT']);
  });

  it('n’envoie que les pointages modifiés', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(AttendancePage);
    fixture.componentRef.setInput('id', '1');
    fixture.componentRef.setInput('sessionId', '11');
    await fixture.whenStable();
    http.expectOne((r) => r.url.endsWith('/formations/1')).flush(formation(1));
    http.expectOne((r) => r.url.endsWith('/inscriptions/formations/11')).flush(inscrits);
    http.expectOne((r) => r.url.endsWith('/presences/sessions/11')).flush(presences);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(text(fixture)).toContain('1 absent');
    expect(text(fixture)).toContain('1 non pointé');
    const save = [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.includes('Enregistrer la feuille'))!;
    expect(save.disabled).toBe(true);

    const select = root.querySelector<HTMLSelectElement>('tbody select')!;
    select.value = 'PRESENT';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(text(fixture)).toContain('1 présent');
    save.click();
    const request = http.expectOne((r) => r.url.endsWith('/presences/sessions/11') && r.method === 'POST');
    expect(request.request.body).toEqual({ presences: [{ inscriptionId: 6, statut: 'PRESENT' }] });
  });
});

describe('PublishPage', () => {
  it('valide une adresse web complète', () => {
    expect(webUrlValidator(new FormControl('https://exemple.invalid/sujet.pdf'))).toBeNull();
    expect(webUrlValidator(new FormControl(''))).toBeNull();
    expect(webUrlValidator(new FormControl('sujet.pdf'))).toEqual({ adresse: true });
  });

  it('publie un devoir puis une ressource avec les corps attendus par le serveur', async () => {
    const http = setup();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(PublishPage);
    fixture.componentRef.setInput('id', '1');
    await fixture.whenStable();
    http.expectOne((r) => r.url.endsWith('/formations/1')).flush(formation(1));
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const fill = (name: string, value: string, event = 'input') => {
      const control = root.querySelector<HTMLInputElement>(`[formcontrolname="${name}"]`)!;
      control.value = value;
      control.dispatchEvent(new Event(event));
    };

    fill('titre', 'Exercices de la séance');
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    http.expectNone((r) => r.method === 'POST');
    expect(text(fixture)).toContain('Indiquez la date limite de rendu.');

    fill('dateLimite', '2030-06-01T23:59');
    fill('description', 'Réaliser les exercices.');
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    const devoir = http.expectOne((r) => r.url.endsWith('/formations/1/devoirs'));
    expect(devoir.request.body).toEqual({ titre: 'Exercices de la séance', description: 'Réaliser les exercices.', dateLimite: '2030-06-01T23:59:00', fichierConsigne: null });
    devoir.flush({ status: 400, message: 'refus' }, { status: 400, statusText: 'Bad Request' });
    await fixture.whenStable();

    fill('type', 'SUPPORT_COURS', 'change');
    await fixture.whenStable();
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    http.expectNone((r) => r.method === 'POST');
    expect(text(fixture)).toContain('Indiquez l’adresse du document.');

    fill('adresse', 'https://exemple.invalid/support.pdf');
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    const ressource = http.expectOne((r) => r.url.endsWith('/ressources') && r.method === 'POST');
    expect(ressource.request.body).toEqual({
      titre: 'Exercices de la séance',
      description: 'Réaliser les exercices.',
      type: 'SUPPORT_COURS',
      urlFichier: 'https://exemple.invalid/support.pdf',
      estPublique: false,
      formationId: 1,
    });
  });
});
