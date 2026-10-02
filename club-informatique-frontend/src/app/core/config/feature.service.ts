import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ModuleKey } from './features';

@Injectable({ providedIn: 'root' })
export class FeatureService {
  isEnabled(module: ModuleKey): boolean {
    return environment.features[module] === true;
  }
}
