import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ResourceState } from '../../core/api/resource-state';
import { ThemeService } from '../../core/theme/theme.service';
import { Field, FieldControl } from './field/field';
import { Pagination } from './pagination/pagination';
import { TabItem, Tabs } from './tabs/tabs';

describe('Pagination', () => {
  function labels(page: number, totalPages: number): string[] {
    const fixture = TestBed.createComponent(Pagination);
    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('totalPages', totalPages);
    fixture.detectChanges();
    return [...(fixture.nativeElement as HTMLElement).querySelectorAll('.pagination > *')].map((el) => el.getAttribute('aria-label') ?? el.textContent!.trim());
  }

  it('n’affiche rien pour une seule page', () => {
    expect(labels(0, 1)).toEqual([]);
  });

  it('abrège les longues séries autour de la page courante', () => {
    expect(labels(4, 10)).toEqual(['Page précédente', 'Page 1', '…', 'Page 4', 'Page 5', 'Page 6', '…', 'Page 10', 'Page suivante']);
  });

  it('marque la page courante et désactive les extrémités', () => {
    const fixture = TestBed.createComponent(Pagination);
    fixture.componentRef.setInput('page', 0);
    fixture.componentRef.setInput('totalPages', 3);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('1');
    expect((el.querySelector('[aria-label="Page précédente"]') as HTMLButtonElement).disabled).toBe(true);
    expect((el.querySelector('[aria-label="Page suivante"]') as HTMLButtonElement).disabled).toBe(false);
  });
});

describe('Field', () => {
  @Component({
    imports: [ReactiveFormsModule, Field, FieldControl],
    template: `
      <app-field label="Adresse électronique" hint="Aide" [required]="true" [messages]="{ email: 'Adresse invalide.' }">
        <input appControl type="email" [formControl]="control" />
      </app-field>
    `,
  })
  class Host {
    readonly control = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] });
  }

  it('relie le contrôle à son libellé, à son aide et à son message d’erreur', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector('input')!;
    const label = el.querySelector('label')!;

    expect(label.getAttribute('for')).toBe(input.id);
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(el.querySelector(`#${input.getAttribute('aria-describedby')}`)?.textContent).toBe('Aide');

    input.value = 'pas-une-adresse';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(input.getAttribute('aria-invalid')).toBe('true');
    const describedBy = input.getAttribute('aria-describedby')!.split(' ');
    expect(describedBy.length).toBe(2);
    expect(el.querySelector('.form-error')?.textContent).toBe('Adresse invalide.');
  });
});

describe('Tabs', () => {
  const tabs: TabItem[] = [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
    { id: 'c', label: 'C' },
  ];

  it('change d’onglet au clavier et boucle aux extrémités', () => {
    const fixture = TestBed.createComponent(Tabs);
    fixture.componentRef.setInput('tabs', tabs);
    fixture.componentRef.setInput('label', 'Exemple');
    fixture.componentRef.setInput('selected', 'a');
    fixture.detectChanges();
    const buttons = () => [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('[role="tab"]')];

    buttons()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe('c');
    expect(buttons()[2].getAttribute('aria-selected')).toBe('true');
    expect(buttons()[0].getAttribute('tabindex')).toBe('-1');

    buttons()[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    expect(fixture.componentInstance.selected()).toBe('a');
  });
});

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.setAttribute('data-theme', 'dark');
  });

  it('bascule le thème, l’applique au document et le mémorise', () => {
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('dark');

    service.toggle();

    expect(service.theme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('ci_ist_theme')).toBe('light');
  });
});

describe('ResourceState', () => {
  it('distingue contenu, vide et erreur, et commence par le chargement', () => {
    const ready = new ResourceState(() => of([1]));
    expect(ready.status()).toBe('loading');
    ready.load();
    expect(ready.status()).toBe('ready');

    const empty = new ResourceState(() => of({ content: [] }));
    empty.load();
    expect(empty.status()).toBe('empty');

    const failed = new ResourceState(() => throwError(() => new Error('panne')));
    failed.load();
    expect(failed.status()).toBe('error');
    expect(failed.error()?.userMessage).toBeTruthy();
  });

  it('considère un zéro renvoyé par l’API comme un contenu et non comme un vide', () => {
    const zero = new ResourceState(() => of(0));
    zero.load();
    expect(zero.status()).toBe('ready');
    expect(zero.data()).toBe(0);
  });
});
