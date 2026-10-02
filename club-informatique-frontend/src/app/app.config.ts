import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import localeFr from '@angular/common/locales/fr';
import { ApplicationConfig, LOCALE_ID, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration, withNoIncrementalHydration } from '@angular/platform-browser';
import { TitleStrategy, provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { authInterceptor } from './core/http/auth.interceptor';
import { errorInterceptor } from './core/http/error.interceptor';
import { prerenderInterceptor } from './core/http/prerender.interceptor';

registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })),
    // Les titres sont posés par SeoService : la stratégie par défaut du routeur est neutralisée.
    { provide: TitleStrategy, useValue: { updateTitle: () => {} } },
    provideHttpClient(withFetch(), withInterceptors([prerenderInterceptor, errorInterceptor, authInterceptor])),
    // Les pages publiques pré-rendues à la construction sont reprises telles quelles par le navigateur.
    // Sans hydratation différée : elle exigerait un script en ligne, que la politique de sécurité du contenu interdit.
    ...(environment.production ? [provideClientHydration(withNoIncrementalHydration())] : []),
    { provide: LOCALE_ID, useValue: 'fr' },
    // Restaure la session avant le premier rendu, uniquement si une session a déjà existé sur cet appareil.
    provideAppInitializer(() => firstValueFrom(inject(AuthService).restore())),
  ],
};
