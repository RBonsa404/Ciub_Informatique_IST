import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FormationService } from '../../../core/services/formation';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-formation-form',
  styleUrl: './formation-form.scss',
  templateUrl: './formation-form.html',
})
export class FormationForm {
  form: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  niveaux = ['Débutant', 'Intermédiaire', 'Avancé', 'Expert'];

  constructor(
    private fb: FormBuilder,
    private formationService: FormationService,
    private router: Router
  ) {
    this.form = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      niveau: ['Débutant', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isSubmitting = true;
    this.errorMessage = '';

    this.formationService.createFormation(this.form.value).subscribe({
      next: () => this.router.navigate(['/formations']),
      error: (err: any) => {
        this.errorMessage = err?.error?.message || 'Une erreur est survenue.';
        this.isSubmitting = false;
      }
    });
  }
}
