import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { ActualitesComponent } from './features/actualites/actualites.component';
import { EvenementsComponent } from './features/evenements/evenements.component';
import { FormationsComponent } from './features/formations/formations.component';
import { ProjetsComponent } from './features/projets/projets.component';
import { RessourcesComponent } from './features/ressources/ressources.component';
import { ContactComponent } from './features/contact/contact.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { MembreDashboardComponent } from './features/dashboards/membre-dashboard/membre-dashboard.component';
import { AdminDashboardComponent } from './features/dashboards/admin-dashboard/admin-dashboard.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'actualites', component: ActualitesComponent },
  { path: 'evenements', component: EvenementsComponent },
  { path: 'formations', loadComponent: () => import('./features/formations/formation-list/formation-list.component').then(m => m.FormationListComponent) },
  { path: 'formations/nouvelle', loadComponent: () => import('./features/formations/formation-form/formation-form').then(m => m.FormationForm), canActivate: [authGuard] },
  { path: 'formations/:id', loadComponent: () => import('./features/formations/formation-detail/formation-detail.component').then(m => m.FormationDetailComponent) },
  { path: 'projets', component: ProjetsComponent },
  { path: 'ressources', component: RessourcesComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard/membre', component: MembreDashboardComponent, canActivate: [authGuard] },
  { path: 'dashboard/admin', component: AdminDashboardComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
