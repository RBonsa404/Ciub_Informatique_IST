import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { toConformite } from '../../core/api/system.api';
import { Role } from '../../core/auth/auth.models';
import { AuthStore } from '../../core/auth/auth.store';
import { FORCED_PASSWORD_ROUTE, passwordChangeGuard } from '../../core/auth/guards';
import { FeatureService } from '../../core/config/feature.service';
import { NavigationService } from '../../core/navigation/navigation.service';
import { DialogService } from '../../shared/ui/dialog/confirm-dialog';
import { ForcedPasswordPage } from './forced-password-page';
import { CompliancePage, SystemConfigPage, formatSize } from './system-pages';

const text = (fixture: ComponentFixture<unknown>) => (fixture.nativeElement as HTMLElement).textContent ?? '';
const page = <T>(content: T[]) => ({ content, page: 0, size: 10, totalElements: content.length, totalPages: content.length ? 1 : 0 });
const CONFIG = { nomPlateforme: 'Club Informatique IST', version: '1.0.0', maintenanceMode: false, inscriptionsOuvertes: true, maxLoginAttempts: 5, lockoutDurationMinutes: 15 };

function setup(roles: Role[], forced = false, confirm = true) {
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
    { accessToken: 'jeton', expiresIn: 900, utilisateur: { id: 13, email: 'mariam.zongo@recette.invalid', nom: 'Zongo', prenom: 'Mariam', roles, changementMotDePasseRequis: forced } },
    false,
  );
  return TestBed.inject(HttpTestingController);
}

const fill = (root: HTMLElement, name: string, value: string) => {
  const control = root.querySelector<HTMLInputElement>(`[formcontrolname="${name}"]`)!;
  control.value = value;
  control.dispatchEvent(new Event('input'));
};

describe('conformité', () => {
  it('lit le rapport du contrat ; une liste de contrôles absente donne une liste vide', () => {
    const sansControles = toConformite({ statut: 'CONFORME', comptesActifs: 7, tentativesEchouees: 0 });
    expect(sansControles.statut).toBe('CONFORME');
    expect(sansControles.comptesActifs).toBe(7);
    expect(sansControles.verifications).toEqual([]);

    const target = toConformite({ statut: 'A_EXAMINER', verifications: [{ code: 'A', libelle: 'Contrôle', conforme: false }] });
    expect(target.verifications).toEqual([{ code: 'A', libelle: 'Contrôle', conforme: false }]);
    expect(target.comptesActifs).toBeNull();
  });

  it('signale un contrôle non conforme', async () => {
    const http = setup(['DSI']);
    const fixture = TestBed.createComponent(CompliancePage);
    http.expectOne((r) => r.url.endsWith('/dsi/conformite')).flush({ statut: 'A_EXAMINER', verifications: [{ code: 'A', libelle: 'Sauvegarde récente', conforme: false }] });
    http.expectOne((r) => r.url.endsWith('/dsi/conformite/logs')).flush(page([]));
    await fixture.whenStable();
    expect(text(fixture)).toContain('Contrôles à examiner');
    expect(text(fixture)).toContain('Non conforme');
    expect(text(fixture)).toContain('Aucune action n’a encore été journalisée.');
  });
});

describe('SystemConfigPage', () => {
  it('formate une taille de fichier', () => {
    expect(formatSize(14_890_000)).toBe('14,2 Mo');
    expect(formatSize(null)).toBe('');
  });

  it('n’active le mode maintenance qu’après confirmation', async () => {
    const http = setup(['ADMIN', 'SUPER_ADMIN'], false, false);
    const fixture = TestBed.createComponent(SystemConfigPage);
    http.expectOne((r) => r.url.endsWith('/admin/system/config')).flush(CONFIG);
    http.expectOne((r) => r.url.endsWith('/admin/system/sauvegardes')).flush(null, { status: 500, statusText: 'Erreur' });
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(text(fixture)).toContain('L’état des sauvegardes n’est pas disponible.');
    expect(root.querySelectorAll('input[type="checkbox"]').length).toBe(2);

    const box = root.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    box.checked = true;
    box.dispatchEvent(new Event('change'));
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    http.expectNone((r) => r.method === 'PUT');
  });

  it('enregistre les réglages dans les bornes', async () => {
    const http = setup(['ADMIN', 'SUPER_ADMIN']);
    const fixture = TestBed.createComponent(SystemConfigPage);
    http.expectOne((r) => r.url.endsWith('/admin/system/config')).flush(CONFIG);
    http.expectOne((r) => r.url.endsWith('/admin/system/sauvegardes')).flush([]);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(text(fixture)).toContain('Aucune sauvegarde n’a encore été enregistrée.');

    fill(root, 'maxLoginAttempts', '50');
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    http.expectNone((r) => r.method === 'PUT');

    fill(root, 'maxLoginAttempts', '4');
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    const request = http.expectOne((r) => r.url.endsWith('/admin/system/config') && r.method === 'PUT');
    expect(request.request.body).toEqual({ nomPlateforme: 'Club Informatique IST', maxLoginAttempts: 4, lockoutDurationMinutes: 15, maintenanceMode: false, inscriptionsOuvertes: true });
  });
});

describe('changement de mot de passe imposé', () => {
  const run = (url: string) => TestBed.runInInjectionContext(() => passwordChangeGuard({} as never, { url } as never));

  it('renvoie toute page de l’espace vers le choix du mot de passe et vide le menu', () => {
    setup(['ADMIN', 'SUPER_ADMIN'], true);
    const result = run('/espace/admin/utilisateurs');
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(FORCED_PASSWORD_ROUTE);
    expect(run(FORCED_PASSWORD_ROUTE)).toBe(true);
    expect(TestBed.inject(NavigationService).space()).toEqual([]);
  });

  it('ferme la page une fois le changement fait', () => {
    setup(['ADMIN', 'SUPER_ADMIN'], false);
    expect(run('/espace/admin')).toBe(true);
    expect(TestBed.inject(Router).serializeUrl(run(FORCED_PASSWORD_ROUTE) as UrlTree)).toBe('/espace');
  });

  it('refuse un mot de passe identique, puis lève l’indicateur après le changement', async () => {
    const http = setup(['ADMIN', 'SUPER_ADMIN'], true);
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ForcedPasswordPage);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    fill(root, 'ancien', 'Initial@2026x');
    fill(root, 'nouveau', 'Initial@2026x');
    fill(root, 'confirmation', 'Initial@2026x');
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    http.expectNone((r) => r.method === 'PUT');
    expect(text(fixture)).toContain('doit être différent du mot de passe initial');

    fill(root, 'nouveau', 'Nouveau@2026x');
    fill(root, 'confirmation', 'Nouveau@2026x');
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    const request = http.expectOne((r) => r.url.endsWith('/users/me/password'));
    expect(request.request.body).toEqual({ ancienMotDePasse: 'Initial@2026x', nouveauMotDePasse: 'Nouveau@2026x' });
    request.flush(null, { status: 204, statusText: 'No Content' });
    // Le serveur a fermé les sessions : la page renouvelle la sienne, et la réponse lève l'indicateur.
    http.expectOne((r) => r.url.endsWith('/auth/refresh'))
      .flush({ accessToken: 'jeton-2', expiresIn: 900, utilisateur: { id: 1, email: 'admin@essai.invalid', nom: 'Zongo', prenom: 'Boukary', roles: ['ADMIN', 'SUPER_ADMIN'], changementMotDePasseRequis: false } });
    expect(TestBed.inject(AuthStore).user()?.changementMotDePasseRequis).toBe(false);
  });
});
