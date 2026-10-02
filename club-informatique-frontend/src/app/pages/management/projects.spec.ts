import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Projet } from '../../core/api/models';
import { AuthStore } from '../../core/auth/auth.store';
import { FeatureService } from '../../core/config/feature.service';
import { progressValue } from '../../shared/project/project-summary';
import { DialogService } from '../../shared/ui/dialog/confirm-dialog';
import { MyProjectsPage, ProposeProjectPage } from '../member/projects-pages';
import { TrainerProjectFollowPage, TrainerProjectsPage } from '../trainer/trainer-projects-pages';
import { ProjectReviewPage, ProjectsReviewListPage, countDecided } from './projects-review-pages';

const page = <T>(content: T[], totalElements = content.length) => ({ content, number: 0, size: 10, totalElements, totalPages: content.length ? 1 : 0 });
const text = (fixture: ComponentFixture<unknown>) => (fixture.nativeElement as HTMLElement).textContent ?? '';

const project = (id: number, extra: Partial<Projet> = {}): Projet => ({
  id,
  titre: `Projet ${id}`,
  slug: `projet-${id}`,
  description: 'Description du projet.',
  technologies: 'Angular, Spring Boot',
  statut: 'EN_COURS',
  porteurNom: 'Aminata Sawadogo',
  avancementPourcentage: 40,
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
    { accessToken: 'jeton', expiresIn: 900, utilisateur: { id: 9, email: 'aminata.sawadogo@recette.invalid', nom: 'Sawadogo', prenom: 'Aminata', roles: ['MEMBRE'] } },
    false,
  );
  return TestBed.inject(HttpTestingController);
}

const fill = (root: HTMLElement, name: string, value: string) => {
  const control = root.querySelector<HTMLInputElement>(`[formcontrolname="${name}"]`)!;
  control.value = value;
  control.dispatchEvent(new Event('input'));
};
const button = (root: HTMLElement, label: string) => [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.includes(label))!;

describe('modèle des projets', () => {
  it('borne l’avancement et respecte une valeur absente', () => {
    expect(progressValue(project(1, { avancementPourcentage: 140 }))).toBe(100);
    expect(progressValue(project(1, { avancementPourcentage: -5 }))).toBe(0);
    expect(progressValue(project(1, { avancementPourcentage: null }))).toBeNull();
  });

  it('ne compte les projets décidés que si la liste est complète', () => {
    const list = [project(1), project(2, { statut: 'REJETE' }), project(3, { statut: 'TERMINE' }), project(4, { statut: 'PROPOSE' })];
    expect(countDecided(list, 4)).toEqual({ valides: 2, rejetes: 1 });
    expect(countDecided(list, 250)).toBeNull();
  });
});

describe('ProposeProjectPage', () => {
  it('transmet une proposition avec les champs attendus par le serveur', async () => {
    const http = setup();
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ProposeProjectPage);
    http.expectOne((r) => r.url.endsWith('/categories')).flush([]);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    http.expectNone((r) => r.method === 'POST');

    fill(root, 'titre', 'Annuaire des anciens');
    fill(root, 'technologies', 'Angular,  PostgreSQL');
    fill(root, 'description', 'Mettre en relation les anciens étudiants.');
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    const request = http.expectOne((r) => r.url.endsWith('/projets') && r.method === 'POST');
    expect(request.request.body).toEqual({
      titre: 'Annuaire des anciens',
      description: 'Mettre en relation les anciens étudiants.',
      objectifs: '',
      technologies: 'Angular, PostgreSQL',
      depotGit: null,
      categorieId: null,
    });
  });
});

describe('MyProjectsPage', () => {
  it('affiche le motif d’un rejet et ne lie que les projets publiés', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(MyProjectsPage);
    http.expectOne((r) => r.url.endsWith('/categories')).flush([]);
    const request = http.expectOne((r) => r.url.endsWith('/projets/mes-projets'));
    expect(request.request.params.get('sort')).toBe('createdAt,desc');
    request.flush(page([project(1), project(2, { statut: 'REJETE', motifDecision: 'Périmètre trop large.' }), project(3, { statut: 'PROPOSE' })]));
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(text(fixture)).toContain('Périmètre trop large.');
    expect(root.querySelectorAll('li a').length).toBe(1);
    expect(root.querySelectorAll('[role="progressbar"]').length).toBe(1);
  });

  it('invite à proposer un projet quand la liste est vide', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(MyProjectsPage);
    http.expectOne((r) => r.url.endsWith('/categories')).flush([]);
    http.expectOne((r) => r.url.endsWith('/projets/mes-projets')).flush(page([]));
    await fixture.whenStable();
    expect(text(fixture)).toContain('Vous n’avez pas encore proposé de projet.');
  });
});

describe('suivi par le formateur', () => {
  it('affiche le nombre réel de projets validés une fois la réponse reçue', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(TrainerProjectsPage);
    http.expectOne((r) => r.url.endsWith('/categories')).flush([]);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.counter')).toBeNull();
    http.expectOne((r) => r.url.endsWith('/projets')).flush(page([project(1), project(2)], 12));
    await fixture.whenStable();
    expect(root.querySelector('.counter')!.textContent).toContain('12');
    expect(root.querySelector('.counter')!.textContent).toContain('projets validés');
  });

  it('enregistre l’avancement et la note de suivi', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(TrainerProjectFollowPage);
    fixture.componentRef.setInput('id', '1');
    await fixture.whenStable();
    http.expectOne((r) => r.url.endsWith('/projets/1')).flush(project(1, { suiviFormateur: 'Bon départ.' }));
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector<HTMLInputElement>('[formcontrolname="avancement"]')!.value).toBe('40');

    fill(root, 'avancement', '140');
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    http.expectNone((r) => r.method === 'PUT');
    expect(text(fixture)).toContain('L’avancement est compris entre 0 et 100.');

    fill(root, 'avancement', '60');
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    const request = http.expectOne((r) => r.url.endsWith('/projets/1/suivi') && r.method === 'PUT');
    expect(request.request.body).toEqual({ suiviFormateur: 'Bon départ.', avancementPourcentage: 60 });
  });
});

describe('validation par le Responsable', () => {
  it('liste les propositions en attente avec des décomptes exacts', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(ProjectsReviewListPage);
    http.expectOne((r) => r.url.endsWith('/projets/en-attente')).flush([project(3, { statut: 'PROPOSE' })]);
    http.expectOne((r) => r.url.endsWith('/projets/admin/all')).flush(page([project(1), project(2), project(3, { statut: 'PROPOSE' })]));
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr').length).toBe(1);
    expect(text(fixture)).toContain('validés');
    expect(text(fixture)).toContain('Projet 3');
  });

  it('exige un motif pour rejeter et envoie la décision confirmée', async () => {
    const http = setup(true);
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ProjectReviewPage);
    fixture.componentRef.setInput('id', '3');
    await fixture.whenStable();
    http.expectOne((r) => r.url.endsWith('/projets/3')).flush(project(3, { statut: 'PROPOSE' }));
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    button(root, 'Rejeter').click();
    await fixture.whenStable();
    http.expectNone((r) => r.method === 'PUT');
    expect(text(fixture)).toContain('Indiquez le motif du rejet.');

    const motif = root.querySelector<HTMLTextAreaElement>('textarea')!;
    motif.value = 'Périmètre trop large.';
    motif.dispatchEvent(new Event('input'));
    button(root, 'Rejeter').click();
    const request = http.expectOne((r) => r.url.endsWith('/projets/3/validation') && r.method === 'PUT');
    expect(request.request.body).toEqual({ statut: 'REJETE', motif: 'Périmètre trop large.' });
  });

  it('n’offre aucune décision sur un projet déjà traité', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(ProjectReviewPage);
    fixture.componentRef.setInput('id', '1');
    await fixture.whenStable();
    http.expectOne((r) => r.url.endsWith('/projets/1')).flush(project(1));
    await fixture.whenStable();
    expect(text(fixture)).toContain('Ce projet a déjà fait l’objet d’une décision');
    expect(button(fixture.nativeElement as HTMLElement, 'Approuver')).toBeUndefined();
  });
});
