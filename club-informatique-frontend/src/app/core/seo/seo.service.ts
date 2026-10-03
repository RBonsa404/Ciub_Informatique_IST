import { DOCUMENT, isPlatformServer } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { SITE } from '../config/site';

export interface PageMeta {
  /** Titre de la page, sans le nom du site. */
  readonly title: string;
  /** Titre complet, nom du site compris : remplace la composition « titre | nom du site » (page d'accueil). */
  readonly fullTitle?: string;
  readonly description?: string;
  /** Chemin canonique (commence par « / »). Par défaut : le chemin courant sans paramètres. */
  readonly path?: string;
  /** Page non indexable (espace connecté, authentification contextuelle, erreurs). */
  readonly noindex?: boolean;
  readonly image?: string;
}

/** Image de partage par défaut : 1200 x 630 pixels, format attendu par les réseaux sociaux et les messageries. */
const DEFAULT_IMAGE = { path: '/img/partage.png', width: '1200', height: '630', alt: `Logo du ${SITE.name}` };

/**
 * Origine écrite dans les pages pré-rendues quand l'adresse publique du site n'est pas configurée.
 * Nginx la remplace à l'envoi par l'adresse sous laquelle la page est demandée (`deploiement/nginx.conf.template`) :
 * les aperçus de lien reçoivent ainsi des adresses absolues, quel que soit le domaine.
 */
export const ORIGINE_A_REMPLACER = 'https://origine-du-site.invalid';

/** Métadonnées de page : titre unique, description, URL canonique, Open Graph, Twitter Card, indexation. */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly preRendu = isPlatformServer(inject(PLATFORM_ID));

  apply(page: PageMeta): void {
    const fullTitle = page.fullTitle ?? `${page.title} | ${SITE.name}`;
    this.title.setTitle(fullTitle);

    this.setName('description', page.description);
    this.setName('robots', page.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');

    const url = this.absolute(page.path ?? this.document.location.pathname);
    this.setCanonical(page.noindex ? null : url);

    const image = page.image ? { path: page.image, width: undefined, height: undefined, alt: page.title } : DEFAULT_IMAGE;
    const imageUrl = /^https?:\/\//i.test(image.path) ? image.path : this.absolute(image.path);

    this.setProperty('og:type', 'website');
    this.setProperty('og:locale', 'fr_FR');
    this.setProperty('og:site_name', SITE.name);
    this.setProperty('og:title', fullTitle);
    this.setProperty('og:description', page.description);
    this.setProperty('og:url', url);
    this.setProperty('og:image', imageUrl);
    this.setProperty('og:image:width', image.width);
    this.setProperty('og:image:height', image.height);
    this.setProperty('og:image:alt', image.alt);
    this.setName('twitter:card', 'summary_large_image');
    this.setName('twitter:title', fullTitle);
    this.setName('twitter:description', page.description);
    this.setName('twitter:image', imageUrl);
    this.setName('twitter:image:alt', image.alt);
  }

  /** Données structurées de l'organisation et du site : informations réelles uniquement. */
  setOrganizationJsonLd(): void {
    const id = 'ld-organisation';
    if (this.document.getElementById(id)) return;
    const origine = this.origin();
    const script = this.document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${origine}/#organisation`,
          name: SITE.name,
          alternateName: SITE.shortName,
          description: `Club d’étudiants de l’${SITE.institution} (${SITE.city}) consacré à l’informatique : formations, ateliers, projets et événements.`,
          email: SITE.email,
          url: `${origine}/`,
          logo: `${origine}/icons/icon-512.png`,
          image: `${origine}${DEFAULT_IMAGE.path}`,
          address: { '@type': 'PostalAddress', addressLocality: SITE.city, addressCountry: 'BF' },
          sameAs: [SITE.social.linkedin, SITE.social.facebook, SITE.social.tiktok],
        },
        {
          '@type': 'WebSite',
          '@id': `${origine}/#site`,
          name: SITE.name,
          url: `${origine}/`,
          inLanguage: 'fr',
          publisher: { '@id': `${origine}/#organisation` },
        },
      ],
    });
    this.document.head.appendChild(script);
  }

  private origin(): string {
    if (environment.siteUrl) return environment.siteUrl;
    return this.preRendu ? ORIGINE_A_REMPLACER : this.document.location.origin;
  }

  private absolute(path: string): string {
    return `${this.origin()}${path.startsWith('/') ? path : `/${path}`}`;
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
