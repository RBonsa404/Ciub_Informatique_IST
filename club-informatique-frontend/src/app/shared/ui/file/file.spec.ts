import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { Fichier, TAILLE_MAXIMALE_OCTETS, estFichierDepose, nomDuFichier } from '../../../core/api/files.api';
import { safeUrl } from '../../format/format';
import { FileLink } from './file-link';
import { FileUpload } from './file-upload';

const DEPOSE = '/api/v1/fichiers/0f8fad5b-d9cb-469f-a165-70867728950e';

function setup() {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  return TestBed.inject(HttpTestingController);
}

describe('adresses de fichiers', () => {
  it('reconnaît un fichier déposé et refuse tout autre chemin interne', () => {
    expect(estFichierDepose(DEPOSE)).toBe(true);
    expect(estFichierDepose('/fichiers/0f8fad5b-d9cb-469f-a165-70867728950e')).toBe(true);
    expect(estFichierDepose('https://exemple.invalid/fichiers/0f8fad5b-d9cb-469f-a165-70867728950e')).toBe(false);
    expect(estFichierDepose('/api/v1/fichiers/../secret')).toBe(false);
    expect(estFichierDepose(null)).toBe(false);
  });

  it('ne propose à l’ouverture qu’un lien http(s) ou un fichier déposé', () => {
    expect(safeUrl(' https://exemple.invalid/a.pdf ')).toBe('https://exemple.invalid/a.pdf');
    expect(safeUrl(DEPOSE)).toBe(DEPOSE);
    expect(safeUrl('javascript:alert(1)')).toBeNull();
    expect(safeUrl('/espace/admin')).toBeNull();
    expect(safeUrl(null)).toBeNull();
  });

  it('lit le nom du fichier dans l’en-tête de la réponse', () => {
    expect(nomDuFichier("attachment; filename*=UTF-8''Support%20s%C3%A9ance%201.pdf")).toBe('Support séance 1.pdf');
    expect(nomDuFichier('attachment; filename="consigne.pdf"')).toBe('consigne.pdf');
    expect(nomDuFichier(null)).toBe('fichier');
  });
});

describe('FileUpload', () => {
  const choisir = (root: HTMLElement, fichier: File) => {
    const champ = root.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(champ, 'files', { value: [fichier], configurable: true });
    champ.dispatchEvent(new Event('change'));
  };

  it('refuse avant l’envoi une extension non acceptée, un fichier vide et un fichier trop volumineux', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(FileUpload);
    fixture.componentRef.setInput('label', 'Fichier joint');
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('10 Mo au plus');

    choisir(root, new File(['MZ'], 'outil.exe'));
    await fixture.whenStable();
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('Ce type de fichier n’est pas accepté.');

    choisir(root, new File([], 'vide.pdf'));
    await fixture.whenStable();
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('Ce fichier est vide.');

    const volumineux = new File(['x'], 'cours.pdf');
    Object.defineProperty(volumineux, 'size', { value: TAILLE_MAXIMALE_OCTETS + 1 });
    choisir(root, volumineux);
    await fixture.whenStable();
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('Ce fichier dépasse la taille autorisée.');
    http.expectNone((r) => r.method === 'POST');
  });

  it('envoie le fichier, annonce le fichier enregistré, puis permet de le retirer', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(FileUpload);
    fixture.componentRef.setInput('label', 'Fichier joint');
    const recus: Fichier[] = [];
    let retraits = 0;
    fixture.componentInstance.fileUploaded.subscribe((fichier) => recus.push(fichier));
    fixture.componentInstance.fileRemoved.subscribe(() => retraits++);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    choisir(root, new File(['%PDF-1.4'], 'Support.PDF'));
    const requete = http.expectOne((r) => r.url.endsWith('/fichiers') && r.method === 'POST');
    expect(requete.request.body instanceof FormData).toBe(true);
    expect((requete.request.body as FormData).get('fichier')).toBeInstanceOf(File);
    requete.flush({ id: 'a', url: DEPOSE, nom: 'Support.PDF', type: 'application/pdf', tailleOctets: 8 });
    await fixture.whenStable();

    expect(recus.map((f) => f.url)).toEqual([DEPOSE]);
    expect(root.textContent).toContain('Support.PDF');
    expect(root.querySelector('input[type="file"]')).toBeNull();

    root.querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();
    expect(retraits).toBe(1);
    expect(root.querySelector('input[type="file"]')).not.toBeNull();
  });

  it('explique un refus du serveur sur le type réel du contenu', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(FileUpload);
    fixture.componentRef.setInput('label', 'Fichier joint');
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    choisir(root, new File(['MZ'], 'faux.pdf'));
    http.expectOne((r) => r.url.endsWith('/fichiers')).flush({ status: 415, code: 'TYPE_REFUSE' }, { status: 415, statusText: 'Unsupported Media Type' });
    await fixture.whenStable();
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('son contenu ne correspond pas à son extension');
  });
});

@Component({
  imports: [FileLink],
  template: `<a id="externe" [appFileLink]="externe">Lien</a><a id="depose" [appFileLink]="depose">Fichier</a>`,
})
class Hote {
  externe = 'https://exemple.invalid/guide.pdf';
  depose = DEPOSE;
}

describe('FileLink', () => {
  it('ouvre un lien externe dans un nouvel onglet et télécharge un fichier déposé avec la session', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(Hote);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const externe = root.querySelector<HTMLAnchorElement>('#externe')!;
    const depose = root.querySelector<HTMLAnchorElement>('#depose')!;

    expect(externe.getAttribute('target')).toBe('_blank');
    expect(externe.getAttribute('rel')).toBe('noopener noreferrer');
    expect(depose.getAttribute('target')).toBeNull();

    const creer = vi.fn(() => 'blob:essai');
    const liberer = vi.fn();
    Object.assign(URL, { createObjectURL: creer, revokeObjectURL: liberer });

    const clic = new MouseEvent('click', { cancelable: true });
    depose.dispatchEvent(clic);
    expect(clic.defaultPrevented).toBe(true);
    http.expectOne((r) => r.url === DEPOSE && r.method === 'GET')
      .flush(new Blob(['%PDF']), { headers: { 'Content-Disposition': 'attachment; filename="consigne.pdf"' } });
    expect(creer).toHaveBeenCalledTimes(1);

    const clicExterne = new MouseEvent('click', { cancelable: true });
    externe.addEventListener('click', (event) => event.preventDefault(), { once: true });
    externe.dispatchEvent(clicExterne);
    http.expectNone((r) => r.url.includes('exemple.invalid'));
  });
});
