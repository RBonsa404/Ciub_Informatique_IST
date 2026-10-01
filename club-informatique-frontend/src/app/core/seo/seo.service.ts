import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { SITE } from '../config/site';

export interface PageMeta {
  /** Titre de la page, sans le nom du site. */
  readonly title: string;
  readonly description?: string;
  /** Chemin canonique (commence par « / »). Par défaut : le chemin courant sans paramètres. */
  readonly path?: string;
  /** Page non indexable (espace connecté, authentification contextuelle, erreurs). */
  readonly noindex?: boolean;
  readonly image?: string;
}

const DEFAULT_IMAGE = '/img/partage.png';

/** Métadonnées de page : titre unique, description, URL canonique, Open Graph, Twitter Card, indexation. */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  apply(page: PageMeta): void {
    const fullTitle = `${page.title} | ${SITE.name}`;
    this.title.setTitle(fullTitle);

    this.setName('description', page.description);
    this.setName('robots', page.noindex ? 'noindex, nofollow' : 'index, follow');

    const url = this.absolute(page.path ?? this.document.location.pathname);
    this.setCanonical(page.noindex ? null : url);

    this.setProperty('og:type', 'website');
    this.setProperty('og:locale', 'fr_FR');
    this.setProperty('og:site_name', SITE.name);
    this.setProperty('og:title', fullTitle);
    this.setProperty('og:description', page.description);
    this.setProperty('og:url', url);
    this.setProperty('og:image', this.absolute(page.image ?? DEFAULT_IMAGE));
    this.setName('twitter:card', 'summary_large_image');
    this.setName('twitter:title', fullTitle);
    this.setName('twitter:description', page.description);
  }

  /** Données structurées de l'organisation : informations réelles uniquement. */
  setOrganizationJsonLd(): void {
    const id = 'ld-organisation';
    if (this.document.getElementById(id)) return;
    const script = this.document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE.name,
      email: SITE.email,
      url: environment.siteUrl || undefined,
      logo: this.absolute('/icons/icon-512.png'),
      address: { '@type': 'PostalAddress', addressLocality: SITE.city, addressCountry: 'BF' },
      sameAs: [SITE.social.linkedin, SITE.social.facebook, SITE.social.tiktok],
    });
    this.document.head.appendChild(script);
  }

  private absolute(path: string): string {
    const origin = environment.siteUrl || this.document.location.origin;
    return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private setName(name: string, content: string | undefined): void {
    if (content) this.meta.updateTag({ name, content });
    else this.meta.removeTag(`name="${name}"`);
  }

  private setProperty(property: string, content: string | undefined): void {
    if (content) this.meta.updateTag({ property, content });
    else this.meta.removeTag(`property="${property}"`);
  }

  private setCanonical(url: string | null): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!url) {
      link?.remove();
      return;
    }
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = url;
  }
}
