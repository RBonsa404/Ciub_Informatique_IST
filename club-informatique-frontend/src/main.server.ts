import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';

/** Point d'entrée du pré-rendu : il ne sert qu'à la construction, aucun serveur de rendu n'est déployé. */
const bootstrap = (context: BootstrapContext) => bootstrapApplication(App, config, context);

export default bootstrap;
