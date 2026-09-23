import { Routes } from '@angular/router';
import { PublicLayout } from './layouts/public-layout/public-layout';
import { DashboardLayout } from './layouts/dashboard-layout/dashboard-layout';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // ── Public Routes (with Navbar & Footer) ──
  {
    path: '',
    component: PublicLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/public/home/home').then(m => m.Home)
      },
      {
        path: 'a-propos',
        loadComponent: () => import('./features/public/about/about').then(m => m.About)
      },
      {
        path: 'bureau',
        loadComponent: () => import('./features/public/bureau/bureau').then(m => m.BureauComponent)
      },
      {
        path: 'actualites',
        loadComponent: () => import('./features/public/actualites/actualites-list').then(m => m.ActualitesList)
      },
      {
        path: 'actualites/:slug',
        loadComponent: () => import('./features/public/actualites/actualites-detail').then(m => m.ActualitesDetailComponent)
      },
      {
        path: 'evenements',
        loadComponent: () => import('./features/public/evenements/evenements-list').then(m => m.EvenementsListComponent)
      },
      {
        path: 'evenements/:id',
        loadComponent: () => import('./features/public/evenements/evenement-detail').then(m => m.EvenementDetailComponent)
      },
      {
        path: 'formations',
        loadComponent: () => import('./features/public/formations/formations-list').then(m => m.FormationsListComponent)
      },
      {
        path: 'formations/:id',
        loadComponent: () => import('./features/public/formations/formation-detail').then(m => m.FormationDetailComponent)
      },
      {
        path: 'projets',
        loadComponent: () => import('./features/public/projets/projets-list').then(m => m.ProjetsListComponent)
      },
      {
        path: 'projets/:id',
        loadComponent: () => import('./features/public/projets/projet-detail').then(m => m.ProjetDetailComponent)
      },
      {
        path: 'ressources',
        loadComponent: () => import('./features/public/ressources/ressources-list').then(m => m.RessourcesListComponent)
      },
      {
        path: 'contact',
        loadComponent: () => import('./features/public/contact/contact').then(m => m.Contact)
      },
      {
        path: 'cgu',
        loadComponent: () => import('./features/public/legal/cgu').then(m => m.CguComponent)
      },
      {
        path: 'mentions-legales',
        loadComponent: () => import('./features/public/legal/cgu').then(m => m.CguComponent)
      },
      {
        path: 'politique-confidentialite',
        loadComponent: () => import('./features/public/legal/privacy').then(m => m.PrivacyComponent)
      },
      // ── Auth Pages (inside Public layout) ──
      {
        path: 'auth/login',
        loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
      },
      {
        path: 'auth/register',
        loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent)
      },
      {
        path: 'auth/forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent)
      },
      {
        path: 'auth/reset-password',
        loadComponent: () => import('./features/auth/reset-password/reset-password').then(m => m.ResetPasswordComponent)
      }
    ]
  },

  // ── Dashboard Routes (Member, Trainer, Club Manager, Admin, DSI) ──
  {
    path: '',
    component: DashboardLayout,
    canActivate: [authGuard],
    children: [
      // ── Espace Membre ──
      {
        path: 'membre/dashboard',
        loadComponent: () => import('./features/membre/dashboard/dashboard').then(m => m.MembreDashboardComponent)
      },
      {
        path: 'membre/profil',
        loadComponent: () => import('./features/membre/profil/profil').then(m => m.MembreProfilComponent)
      },
      {
        path: 'membre/inscriptions',
        loadComponent: () => import('./features/membre/inscriptions/inscriptions').then(m => m.MembreInscriptionsComponent)
      },
      {
        path: 'membre/devoirs',
        loadComponent: () => import('./features/membre/devoirs/devoirs').then(m => m.MembreDevoirsComponent)
      },
      {
        path: 'membre/proposer-projet',
        loadComponent: () => import('./features/membre/proposer-projet/proposer-projet').then(m => m.MembreProposerProjetComponent)
      },
      {
        path: 'membre/notifications',
        loadComponent: () => import('./features/membre/notifications/notifications').then(m => m.MembreNotificationsComponent)
      },

      // ── Espace Formateur ──
      {
        path: 'formateur/formations',
        canActivate: [roleGuard(['ROLE_FORMATEUR', 'ROLE_RESPONSABLE_CLUB', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'])],
        loadComponent: () => import('./features/formateur/formations/formations-manage').then(m => m.FormateurFormationsManageComponent)
      },
      {
        path: 'formateur/presences',
        canActivate: [roleGuard(['ROLE_FORMATEUR', 'ROLE_RESPONSABLE_CLUB', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'])],
        loadComponent: () => import('./features/formateur/presences/presences').then(m => m.FormateurPresencesComponent)
      },
      {
        path: 'formateur/ressources',
        canActivate: [roleGuard(['ROLE_FORMATEUR', 'ROLE_RESPONSABLE_CLUB', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'])],
        loadComponent: () => import('./features/formateur/ressources/ressources-manage').then(m => m.FormateurRessourcesManageComponent)
      },
      {
        path: 'formateur/projets',
        canActivate: [roleGuard(['ROLE_FORMATEUR', 'ROLE_RESPONSABLE_CLUB', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'])],
        loadComponent: () => import('./features/formateur/projets/projets-suivi').then(m => m.FormateurProjetsSuiviComponent)
      },

      // ── Espace Responsable Club ──
      {
        path: 'responsable/actualites',
        canActivate: [roleGuard(['ROLE_RESPONSABLE_CLUB', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'])],
        loadComponent: () => import('./features/responsable/actualites/actualites-manage').then(m => m.ResponsableActualitesManageComponent)
      },
      {
        path: 'responsable/evenements',
        canActivate: [roleGuard(['ROLE_RESPONSABLE_CLUB', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'])],
        loadComponent: () => import('./features/responsable/evenements/evenements-manage').then(m => m.ResponsableEvenementsManageComponent)
      },
      {
        path: 'responsable/projets',
        canActivate: [roleGuard(['ROLE_RESPONSABLE_CLUB', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'])],
        loadComponent: () => import('./features/responsable/projets/projets-validation').then(m => m.ResponsableProjetsValidationComponent)
      },
      {
        path: 'responsable/inscriptions',
        canActivate: [roleGuard(['ROLE_RESPONSABLE_CLUB', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'])],
        loadComponent: () => import('./features/responsable/inscriptions/inscriptions-manage').then(m => m.ResponsableInscriptionsManageComponent)
      },
      {
        path: 'responsable/notifications',
        canActivate: [roleGuard(['ROLE_RESPONSABLE_CLUB', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'])],
        loadComponent: () => import('./features/responsable/notifications/notifications-send').then(m => m.ResponsableNotificationsSendComponent)
      },

      // ── Espace Administration & DSI ──
      {
        path: 'admin/statistiques',
        canActivate: [roleGuard(['ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_DSI'])],
        loadComponent: () => import('./features/admin/statistiques/statistiques').then(m => m.AdminStatistiquesComponent)
      },
      {
        path: 'admin/utilisateurs',
        canActivate: [roleGuard(['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'])],
        loadComponent: () => import('./features/admin/utilisateurs/utilisateurs').then(m => m.AdminUtilisateursComponent)
      },
      {
        path: 'admin/roles',
        canActivate: [roleGuard(['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'])],
        loadComponent: () => import('./features/admin/roles/roles').then(m => m.AdminRolesComponent)
      },
      {
        path: 'admin/categories',
        canActivate: [roleGuard(['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'])],
        loadComponent: () => import('./features/admin/categories/categories').then(m => m.AdminCategoriesComponent)
      },
      {
        path: 'admin/securite',
        canActivate: [roleGuard(['ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_DSI'])],
        loadComponent: () => import('./features/admin/securite/securite').then(m => m.AdminSecuriteComponent)
      },
      {
        path: 'admin/systeme',
        canActivate: [roleGuard(['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'])],
        loadComponent: () => import('./features/admin/systeme/systeme').then(m => m.AdminSystemeComponent)
      },
      {
        path: 'admin/conformite',
        canActivate: [roleGuard(['ROLE_DSI', 'ROLE_SUPER_ADMIN', 'ROLE_ADMIN'])],
        loadComponent: () => import('./features/admin/conformite/conformite').then(m => m.AdminConformiteComponent)
      }
    ]
  },

  // Fallback
  {
    path: '**',
    redirectTo: ''
  }
];
