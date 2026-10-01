import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import localeFr from '@angular/common/locales/fr';
import { ApplicationConfig, LOCALE_ID, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { TitleStrategy, provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { authInterceptor } from './core/http/auth.interceptor';
import { errorInterceptor } from './core/http/error.interceptor';

registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })),
    // Les titres sont posés par SeoService : la stratégie par défaut du routeur est neutralisée.
    { provide: TitleStrategy, useValue: { updateTitle: () => {} } },
    provideHttpClient(withFetch(), withInterceptors([errorInterceptor, authInterceptor])),
    { provide: LOCALE_ID, useValue: 'fr' },
    // Restaure la session avant le premier rendu, uniquement si une session a déjà existé sur cet appareil.
    provideAppInitializer(() => firstValueFrom(inject(AuthService).restore())),
  ],
};
