import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FormationService, Formation } from '../../../core/services/formation';
import { SessionFormationService, SessionFormation } from '../../../core/services/session-formation';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-formation-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './formation-detail.html',
  styleUrls: ['./formation-detail.scss']
})
export class FormationDetailComponent implements OnInit {
  formation: Formation | null = null;
  sessions: SessionFormation[] = [];
  showLoginModal = false;
  inscriptionSuccess: number | null = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public authService: AuthService,
    private formationService: FormationService,
    private sessionService: SessionFormationService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params: any) => {
      const id = +params['id'];

      this.formationService.getFormation(id).subscribe({
        next: (data) => { this.formation = data; this.isLoading = false; },
        error: () => { this.isLoading = false; }
      });

      this.sessionService.getSessionsByFormation(id).subscribe({
        next: (data) => this.sessions = data,
        error: () => this.sessions = []
      });
    });
  }

  getProgressPercent(session: SessionFormation): number {
    if (!session.capaciteMax) return 0;
    const inscrits = session.inscrits ?? 0;
    return Math.round((inscrits / session.capaciteMax) * 100);
  }

  isComplet(session: SessionFormation): boolean {
    return (session.inscrits ?? 0) >= session.capaciteMax;
  }

  inscrire(session: SessionFormation): void {
    if (!this.authService.isLoggedIn()) {
      this.showLoginModal = true;
      return;
    }
    if (this.isComplet(session)) return;

    const token = this.authService.getToken();
    this.http.post(`/api/v1/inscriptions`, {
      sessionId: session.id,
    }, { headers: { Authorization: `Bearer ${token}` } }).subscribe({
      next: () => {
        if (session.inscrits === undefined) session.inscrits = 0;
        session.inscrits++;
        this.inscriptionSuccess = session.id;
        setTimeout(() => this.inscriptionSuccess = null, 4000);
      },
      error: (err) => {
        alert(err?.error?.message || 'Erreur lors de l\'inscription. Vérifiez que vous n\'êtes pas déjà inscrit.');
      }
    });
  }

  goToLogin(): void {
    this.showLoginModal = false;
    this.router.navigate(['/login']);
  }

  getNiveauClass(niveau: string): string {
    const map: Record<string, string> = {
      'Débutant': 'badge-green', 'Intermédiaire': 'badge-blue',
      'Avancé': 'badge-orange', 'Expert': 'badge-purple'
    };
    return map[niveau] || 'badge-blue';
  }
}
