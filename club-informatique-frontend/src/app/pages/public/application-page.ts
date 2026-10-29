import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo/seo.service';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';

/**
 * Fichiers de l'application Android, servis par le site lui-même (dossier public/telechargements).
 * L'application n'est pas publiée sur le Play Store : cette page est le seul point de téléchargement.
 * À chaque nouvelle version : remplacer les fichiers, puis mettre à jour ces valeurs.
 */
export const APPLICATION_ANDROID = {
  version: '1.0.1',
  versionPrecedente: '1.0.0',
  androidMinimum: 'Android 7.0',
  principal: { fichier: '/telechargements/club-info-ist-1.0.1-arm64.apk', taille: '21,1 Mo' },
  ancien: { fichier: '/telechargements/club-info-ist-1.0.1-armv7.apk', taille: '18,8 Mo', libelle: 'Téléphone plus ancien ? Version 32 bits' },
  /** Empreinte SHA-256 du certificat de signature du club, identique pour toutes les versions. */
  libelleEmpreinte: 'Empreinte SHA-256 du certificat',
  empreinteCertificat: 'EC:14:FC:F1:A4:55:FB:3D:9F:10:7C:68:62:51:39:65:8A:38:53:0B:1E:9D:54:6B:DB:FF:8B:0C:6A:8A:7C:92',
} as const;

/** Téléchargement et installation de l'application mobile Android du club. */
@Component({
  selector: 'app-application-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, Icon],
  styles: `
    .hero {
      padding: 4rem 0 2.5rem;
    }
    .hero h1 {
      font-size: clamp(2.3rem, 5vw, 3.3rem);
      line-height: 1.08;
      margin-bottom: 1.25rem;
    }
    .lead {
      font-size: 1.05rem;
      line-height: 1.75;
      max-width: 560px;
      margin-bottom: 1.75rem;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1rem 1.5rem;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem 1.25rem;
      margin-top: 1.25rem;
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .visual {
      width: 100%;
      height: 320px;
      border-radius: 20px;
      border: 2px solid rgba(56, 189, 248, 0.2);
      box-shadow:
        0 20px 60px rgba(0, 0, 0, 0.4),
        0 0 25px rgba(56, 189, 248, 0.1);
      background: linear-gradient(135deg, #0b1e3f, #1d4ed8 60%, #0b1e3f);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      color: #fff;
    }
    .visual img {
      background: #fff;
      border-radius: 20px;
      padding: 5px;
      box-shadow: 0 0 30px rgba(56, 189, 248, 0.5);
    }
    .steps {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
      gap: 1.5rem;
      counter-reset: etape;
    }
    .step {
      border-top: 3px solid var(--color-blue-royal);
    }
    .step:nth-child(2) {
      border-top-color: var(--color-amber-tech);
    }
    .step:nth-child(3) {
      border-top-color: var(--color-cyan-circuit);
    }
    .step h3 {
      font-size: 1.05rem;
      margin-bottom: 0.6rem;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .step h3::before {
      counter-increment: etape;
      content: counter(etape);
      flex: none;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--color-blue-royal);
      color: #fff;
      font-size: 0.85rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .step p {
      font-size: 0.92rem;
      line-height: 1.65;
    }
    .notes {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
      gap: 1.5rem;
    }
    .notes h2 {
      font-size: 1.05rem;
      margin-bottom: 0.6rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--accent-active);
    }
    .notes p {
      font-size: 0.9rem;
      line-height: 1.65;
    }
    .fingerprint {
      font-family: var(--font-mono, monospace);
      font-size: 0.75rem;
      word-break: break-all;
      color: var(--text-muted);
      margin-top: 0.5rem;
    }
  `,
  template: `
    <section class="hero">
      <div class="page-container split">
        <div>
          <div class="pill" style="margin-bottom: 1.25rem">Application mobile</div>
          <h1>Le club dans <span class="accent">votre poche</span></h1>
          <p class="lead">
            Retrouvez les formations, les événements, vos inscriptions, vos supports et vos notifications du Club Informatique de l’IST sur votre
            téléphone Android, avec le même compte que sur le site.
          </p>
          <div class="actions">
            <a appBtn size="lg" [href]="app.principal.fichier" download>
              <app-icon name="download" [size]="18" /> Télécharger pour Android
            </a>
            <a class="accent-small font-bold" [href]="app.ancien.fichier" download>{{ app.ancien.libelle }}</a>
          </div>
          <div class="meta">
            <span>Version {{ app.version }}</span>
            <span>{{ app.principal.taille }}</span>
            <span>{{ app.androidMinimum }} ou plus récent</span>
          </div>
        </div>
        <div class="split-decor" aria-hidden="true">
          <div class="visual">
            <img src="img/logo-176.webp" alt="" width="90" height="90" />
            <div class="font-heading" style="font-size: 1.2rem; font-weight: 800">Club Info IST</div>
          </div>
        </div>
      </div>
    </section>

    <section class="page-section" aria-labelledby="titre-installation">
      <div class="page-container">
        <h2 id="titre-installation" style="margin-bottom: 1.5rem">Installer l’application</h2>
        <div class="steps">
          <article class="glass-card step">
            <h3>Téléchargez le fichier</h3>
            <p>Depuis votre téléphone, touchez « Télécharger pour Android ». Le fichier se trouve ensuite dans vos téléchargements.</p>
          </article>
          <article class="glass-card step">
            <h3>Autorisez l’installation</h3>
            <p>Ouvrez le fichier. Android vous demande d’autoriser votre navigateur à installer des applications : activez l’autorisation, puis revenez en arrière.</p>
          </article>
          <article class="glass-card step">
            <h3>Installez et connectez-vous</h3>
            <p>Touchez « Installer », puis ouvrez l’application et connectez-vous avec votre compte du club.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="page-section" style="padding-top: 0">
      <div class="page-container notes">
        <article class="glass-card">
          <h2><app-icon name="shield" [size]="18" /> Pourquoi cet avertissement ?</h2>
          <p>
            L’application est distribuée uniquement sur ce site, et non sur le Play Store. Android peut donc afficher un message sur son origine.
            Elle est signée avec le certificat du club : si un message de Play Protect apparaît, touchez « Plus de détails », puis « Installer quand même ».
          </p>
          <p class="fingerprint">{{ app.libelleEmpreinte }} : {{ app.empreinteCertificat }}</p>
        </article>
        <article class="glass-card">
          <h2><app-icon name="refresh-cw" [size]="18" /> Vous aviez la première version ?</h2>
          <p>
            La version {{ app.versionPrecedente }} n’était pas signée avec le certificat du club. Désinstallez-la avant d’installer celle-ci, sinon Android refusera la mise à jour.
            Vos données restent sur votre compte : il suffit de vous reconnecter.
          </p>
          <p style="margin-top: 0.75rem">
            Une question ? <a routerLink="/contact" class="accent-small font-bold">Contactez le club</a>.
          </p>
        </article>
      </div>
    </section>
  `,
})
export class ApplicationPage {
  protected readonly app = APPLICATION_ANDROID;

  constructor() {
    inject(SeoService).apply({
      title: 'Application mobile',
      description: 'Téléchargez l’application Android du Club Informatique de l’IST : formations, événements, inscriptions et notifications sur votre téléphone.',
      path: '/application',
    });
  }
}
