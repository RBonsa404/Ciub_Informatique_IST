import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Formation, FormationService } from '../../../core/services/formation';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-formation-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './formation-list.html',
  styleUrls: ['./formation-list.scss']
})
export class FormationListComponent implements OnInit {
  formations: Formation[] = [];
  isFormateur = false;
  isLoggedIn = false;
  searchTerm = '';
  selectedNiveau = '';

  niveaux = ['Débutant', 'Intermédiaire', 'Avancé', 'Expert'];

  constructor(
    private formationService: FormationService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.isFormateur = this.authService.hasRole('FORMATEUR') || this.authService.hasRole('ADMIN');

    this.formationService.getFormations().subscribe({
      next: (data) => this.formations = data,
      error: () => this.formations = []
    });
  }

  get filteredFormations(): Formation[] {
    return this.formations.filter(f => {
      const matchSearch = !this.searchTerm || f.titre.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchNiveau = !this.selectedNiveau || f.niveau === this.selectedNiveau;
      return matchSearch && matchNiveau;
    });
  }

  getNiveauClass(niveau: string): string {
    const map: Record<string, string> = {
      'Débutant': 'badge-green',
      'Intermédiaire': 'badge-blue',
      'Avancé': 'badge-orange',
      'Expert': 'badge-purple'
    };
    return map[niveau] || 'badge-blue';
  }
}
