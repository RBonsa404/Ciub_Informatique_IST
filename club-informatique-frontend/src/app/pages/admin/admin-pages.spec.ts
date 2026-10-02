import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AdminApi, CompteUtilisateur, EntreeJournal, toRole } from '../../core/api/admin.api';
import { Role } from '../../core/auth/auth.models';
import { AuthStore } from '../../core/auth/auth.store';
import { FeatureService } from '../../core/config/feature.service';
import { DialogService } from '../../shared/ui/dialog/confirm-dialog';
import { AdminDashboardPage } from './admin-dashboard-page';
import { assignableRoles, sortRoles, toShares } from './admin-model';
import { AuditLogPage, StatisticsPage, matchesEntry, sortAlerts } from './insight-pages';
import { RolesMatrixPage, toMatrix } from './reference-pages';
import { UserDetailPage, UsersListPage, matchesAccount } from './users-pages';

const page = <T>(content: T[]) => ({ content, page: 0, size: 10, totalElements: content.length, totalPages: content.length ? 1 : 0 });
const text = (fixture: ComponentFixture<unknown>) => (fixture.nativeElement as HTMLElement).textContent ?? '';
const button = (root: HTMLElement, label: string) => [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.includes(label))!;

const raw = (id: number, roles: string[], extra: Record<string, unknown> = {}) => ({
  id,
  nom: 'Sawadogo',
  prenom: 'Aminata',
  email: `compte${id}@recette.invalid`,
  filiere: 'Informatique de gestion',
  statut: 'ACTIF',
  roles,
  createdAt: '2026-10-01T10:00:00',
  ...extra,
});
const account = (roles: Role[], extra: Partial<CompteUtilisateur> = {}): CompteUtilisateur => ({ id: 9, nom: 'Sawadogo', prenom: 'Aminata', email: 'aminata@recette.invalid', statut: 'ACTIF', roles, ...extra });
const entry = (id: number, extra: Partial<EntreeJournal> = {}): EntreeJournal => ({ id, action: 'CONNEXION', utilisateurEmail: 'aminata@recette.invalid', dateAction: '2026-10-01T10:00:00', statut: 'SUCCES', ...extra });

const STATS = {
  totalMembres: 7,
  membresActifs: 6,
  totalEvenements: 3,
  totalFormations: 2,
  totalProjets: 3,
  totalRessources: 4,
  totalMessagesNonTraites: 9,
  repartitionMembresParRole: { MEMBRE: 3, ADMIN: 1 },
  repartitionProjetsParStatut: { PROPOSE: 1, EN_COURS: 2 },
};

function setup(roles: Role[] = ['ADMIN'], id = 12) {
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
  TestBed.inject(AuthStore).setSession({ accessToken: 'jeton', expiresIn: 900, utilisateur: { id, email: 'abdoul.compaore@recette.invalid', nom: 'Compaoré', prenom: 'Abdoul', roles } }, false);
  return TestBed.inject(HttpTestingController);
}

describe('modèle de l’administration', () => {
  it('lit un rôle avec ou sans préfixe et écarte un rôle inconnu', () => {
    expect(toRole('FORMATEUR')).toBe('FORMATEUR');
    expect(toRole('ADMIN')).toBe('ADMIN');
    expect(toRole('INCONNU')).toBeNull();
  });

  it('réserve Super Admin et DSI au Super Admin', () => {
    expect(assignableRoles(['ADMIN'])).toEqual(['MEMBRE', 'FORMATEUR', 'RESPONSABLE_CLUB', 'ADMIN']);
    expect(assignableRoles(['ADMIN', 'SUPER_ADMIN'])).toContain('SUPER_ADMIN');
    expect(sortRoles(['MEMBRE', 'ADMIN'])).toEqual(['ADMIN', 'MEMBRE']);
  });

  it('calcule des parts sans inventer de total', () => {
    expect(toShares({ a: 3, b: 1 }, (key) => key)).toEqual([
      { label: 'a', value: 3, percent: 75 },
      { label: 'b', value: 1, percent: 25 },
    ]);
    expect(toShares({ a: 0 }, (key) => key)[0].percent).toBe(0);
    expect(toShares(null, (key) => key)).toEqual([]);
  });

  it('construit la matrice des droits effectifs', () => {
    const matrix = toMatrix(
      [
        { role: 'ADMIN', description: '', permissions: ['USER_MANAGE', 'ACTUALITE_READ'] },
        { role: 'MEMBRE', description: '', permissions: ['ACTUALITE_READ'] },
      ],
      [
        { nom: 'USER_MANAGE', description: 'Gérer les comptes' },
        { nom: 'ACTUALITE_READ', description: 'Lire les actualités' },
      ],
    );
    expect(matrix.roles).toEqual(['MEMBRE', 'ADMIN']);
    expect(matrix.rows.map((row) => [row.permission.nom, row.granted])).toEqual([
      ['ACTUALITE_READ', [true, true]],
      ['USER_MANAGE', [false, true]],
    ]);
  });

  it('filtre les comptes, les entrées du journal et trie les alertes', () => {
    expect(matchesAccount(account(['MEMBRE']), 'sawa', null)).toBe(true);
    expect(matchesAccount(account(['MEMBRE']), '', 'ADMIN')).toBe(false);
    expect(matchesEntry(entry(1, { statut: 'ECHEC' }), 'aminata', 'ECHEC')).toBe(true);
    expect(matchesEntry(entry(1), '', 'ECHEC')).toBe(false);
    expect(sortAlerts([{ typeAlerte: 'a', description: '', gravite: 'FAIBLE' }, { typeAlerte: 'b', description: '', gravite: 'CRITIQUE' }]).map((a) => a.typeAlerte)).toEqual(['b', 'a']);
  });
});

describe('AdminApi', () => {
  it('reprend la forme des noms de rôle du serveur à l’écriture', () => {
    const http = setup();
    const api = TestBed.inject(AdminApi);
    let received: CompteUtilisateur | undefined;
    api.compte(9).subscribe((value) => (received = value));
    http.expectOne((r) => r.url.endsWith('/admin/users/9')).flush(raw(9, ['MEMBRE', 'FORMATEUR']));
    expect(received?.roles).toEqual(['MEMBRE', 'FORMATEUR']);

    api.changerRoles(9, ['MEMBRE']).subscribe();
    const request = http.expectOne((r) => r.url.endsWith('/admin/users/9/roles'));
    expect(request.request.body).toEqual({ roles: ['MEMBRE'] });
  });
});

describe('tableau de bord et statistiques', () => {
  it('n’affiche aucun chiffre avant la réponse, puis les totaux réels', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(AdminDashboardPage);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.tiles')!.textContent).not.toMatch(/\d/);
    http.expectOne((r) => r.url.endsWith('/admin/statistiques')).flush(STATS);
    http.expectOne((r) => r.url.endsWith('/admin/security/audit-logs')).flush(page([]));
    await fixture.whenStable();
    expect(root.querySelector('.tiles')!.textContent).toContain('7');
    expect(text(fixture)).toContain('Aucune action n’a encore été journalisée.');
    expect(text(fixture)).not.toContain('Configuration du système');
  });

  it('affiche les répartitions réelles avec leurs libellés', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(StatisticsPage);
    http.expectOne((r) => r.url.endsWith('/admin/statistiques')).flush(STATS);
    await fixture.whenStable();
    expect(text(fixture)).toContain('Membre');
    expect(text(fixture)).toContain('3 (75 %)');
    expect(text(fixture)).toContain('En cours');
  });
});

describe('comptes utilisateurs', () => {
  it('transmet la recherche et le rôle au serveur', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(UsersListPage);
    http.expectOne((r) => r.url.endsWith('/admin/users')).flush(page([raw(9, ['MEMBRE']), raw(10, ['FORMATEUR', 'MEMBRE'], { nom: 'Ouédraogo', prenom: 'Issouf' })]));
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('tbody tr').length).toBe(2);

    const select = root.querySelector<HTMLSelectElement>('#filtre-role')!;
    select.value = 'FORMATEUR';
    select.dispatchEvent(new Event('change'));
    const request = http.expectOne((r) => r.url.endsWith('/admin/users'));
    expect(request.request.params.get('role')).toBe('FORMATEUR');
    request.flush(page([raw(9, ['MEMBRE']), raw(10, ['FORMATEUR', 'MEMBRE'])]));
    await fixture.whenStable();
    expect(root.querySelectorAll('tbody tr').length).toBe(1);
  });

  it('exige un rôle, puis enregistre l’identité et les rôles modifiés', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(UserDetailPage);
    fixture.componentRef.setInput('id', '9');
    await fixture.whenStable();
    http.expectOne((r) => r.url.endsWith('/admin/users/9')).flush(raw(9, ['MEMBRE']));
    await fixture.whenStable();
    http.expectOne((r) => r.url.endsWith('/admin/security/audit-logs')).flush(page([]));
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const boxes = () => [...root.querySelectorAll<HTMLInputElement>('fieldset input[type="checkbox"]')];
    expect(boxes().length).toBe(4);

    const member = boxes().find((box) => box.checked)!;
    member.checked = false;
    member.dispatchEvent(new Event('change'));
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    http.expectNone((r) => r.method === 'PUT');
    expect(text(fixture)).toContain('Attribuez au moins un rôle.');

    for (const box of boxes().slice(0, 2)) {
      box.checked = true;
      box.dispatchEvent(new Event('change'));
    }
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    const identity = http.expectOne((r) => r.url.endsWith('/admin/users/9') && r.method === 'PUT');
    expect(identity.request.body).toEqual({ prenom: 'Aminata', nom: 'Sawadogo', filiere: 'Informatique de gestion' });
    identity.flush(raw(9, ['MEMBRE']));
    const roles = http.expectOne((r) => r.url.endsWith('/admin/users/9/roles'));
    expect(roles.request.body).toEqual({ roles: ['FORMATEUR', 'MEMBRE'] });
  });

  it('interdit de se suspendre ou de modifier ses propres rôles', async () => {
    const http = setup(['ADMIN'], 12);
    const fixture = TestBed.createComponent(UserDetailPage);
    fixture.componentRef.setInput('id', '12');
    await fixture.whenStable();
    http.expectOne((r) => r.url.endsWith('/admin/users/12')).flush(raw(12, ['ADMIN']));
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(button(root, 'Suspendre')).toBeUndefined();
    expect(root.querySelector<HTMLFieldSetElement>('fieldset')!.disabled).toBe(true);
    expect(text(fixture)).toContain('Vous ne pouvez pas modifier vos propres rôles.');
  });
});

describe('rôles et journal', () => {
  it('affiche la matrice en lecture seule', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(RolesMatrixPage);
    http.expectOne((r) => r.url.endsWith('/admin/roles')).flush([{ id: 1, nom: 'MEMBRE', description: '', permissions: ['ACTUALITE_READ'] }]);
    http.expectOne((r) => r.url.endsWith('/admin/permissions')).flush([{ id: 1, nom: 'ACTUALITE_READ', description: 'Lire les actualités' }]);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(text(fixture)).toContain('Lire les actualités');
    expect(root.querySelectorAll('button').length).toBe(0);
  });

  it('signale un journal vide sans rien inventer', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(AuditLogPage);
    http.expectOne((r) => r.url.endsWith('/admin/security/audit-logs')).flush(page([]));
    await fixture.whenStable();
    expect(text(fixture)).toContain('Aucune action n’a encore été journalisée.');
  });
});
