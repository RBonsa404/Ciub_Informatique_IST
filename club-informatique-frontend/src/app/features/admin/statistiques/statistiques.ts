import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { Statistiques } from '../../../core/models';

@Component({
  selector: 'app-admin-statistiques',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-page">
      <div class="page-title-box">
        <h1>Statistiques & KPIs de la Plateforme</h1>
        <p>Indicateurs de performance, croissance des adhésions et taux d'engagement du Club Informatique.</p>
      </div>

      <!-- KPI Overview Cards -->
      <div class="kpi-grid">
        <div class="glass-card kpi-card">
          <div class="kpi-head">
            <span class="kpi-title">Total Membres Inscrits</span>
            <div class="kpi-icon icon-blue">👥</div>
          </div>
          <div class="kpi-number">{{ stats()?.totalMembres || 342 }}</div>
          <div class="kpi-trend positive">+18% ce semestre</div>
        </div>

        <div class="glass-card kpi-card">
          <div class="kpi-head">
            <span class="kpi-title">Formations Dispensées</span>
            <div class="kpi-icon icon-amber">📚</div>
          </div>
          <div class="kpi-number">{{ stats()?.totalFormations || 28 }}</div>
          <div class="kpi-trend neutral">6 sessions actives</div>
        </div>

        <div class="glass-card kpi-card">
          <div class="kpi-head">
            <span class="kpi-title">Événements Réalisés</span>
            <div class="kpi-icon icon-green">🏆</div>
          </div>
          <div class="kpi-number">{{ stats()?.totalEvenements || 19 }}</div>
          <div class="kpi-trend positive">4 à venir</div>
        </div>

        <div class="glass-card kpi-card">
          <div class="kpi-head">
            <span class="kpi-title">Projets Développés</span>
            <div class="kpi-icon icon-purple">🚀</div>
          </div>
          <div class="kpi-number">{{ stats()?.totalProjets || 45 }}</div>
          <div class="kpi-trend positive">14 en cours</div>
        </div>
      </div>

      <!-- Graphiques & Répartition (CSS Pure modern charts) -->
      <div class="charts-grid mt-6">
        <!-- Répartition par filière -->
        <div class="glass-card chart-card">
          <h3>Répartition des Membres par Filière</h3>
          <p class="text-xs text-muted mb-4">Données actualisées en temps réel</p>

          <div class="bars-list">
            <div class="bar-row">
              <span class="bar-lbl">Génie Logiciel</span>
              <div class="bar-track">
                <div class="bar-fill fill-blue" style="width: 48%;"></div>
              </div>
              <span class="bar-pct">48%</span>
            </div>

            <div class="bar-row">
              <span class="bar-lbl">Réseaux & Télécoms</span>
              <div class="bar-track">
                <div class="bar-fill fill-amber" style="width: 26%;"></div>
              </div>
              <span class="bar-pct">26%</span>
            </div>

            <div class="bar-row">
              <span class="bar-lbl">Systèmes d'Information</span>
              <div class="bar-track">
                <div class="bar-fill fill-green" style="width: 16%;"></div>
              </div>
              <span class="bar-pct">16%</span>
            </div>

            <div class="bar-row">
              <span class="bar-lbl">Cybersécurité</span>
              <div class="bar-track">
                <div class="bar-fill fill-purple" style="width: 10%;"></div>
              </div>
              <span class="bar-pct">10%</span>
            </div>
          </div>
        </div>

        <!-- Taux de complétion et assiduité -->
        <div class="glass-card chart-card">
          <h3>Indicateurs d'Assiduité & Certification</h3>
          <p class="text-xs text-muted mb-4">Performances pédagogiques</p>

          <div class="donut-stats-grid">
            <div class="metric-circle">
              <div class="circle-val">92%</div>
              <div class="circle-lbl">Taux de présence moyen</div>
            </div>

            <div class="metric-circle">
              <div class="circle-val">84%</div>
              <div class="circle-lbl">Rendus de devoirs à temps</div>
            </div>

            <div class="metric-circle">
              <div class="circle-val">88%</div>
              <div class="circle-lbl">Taux de satisfaction apprenants</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-page { display: flex; flex-direction: column; gap: 2rem; }
    .page-title-box h1 { font-size: 1.85rem; margin-bottom: 0.35rem; }
    .page-title-box p { color: var(--text-secondary); font-size: 0.95rem; }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }
    .kpi-card { padding: 1.5rem; border-radius: 18px; }
    .kpi-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .kpi-title { font-size: 0.8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }
    .kpi-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
    .icon-blue { background: rgba(27, 58, 140, 0.1); }
    .icon-amber { background: rgba(245, 166, 35, 0.1); }
    .icon-green { background: rgba(34, 197, 94, 0.1); }
    .icon-purple { background: rgba(147, 51, 234, 0.1); }
    .kpi-number { font-size: 2.2rem; font-weight: 800; line-height: 1; }
    .kpi-trend { font-size: 0.78rem; font-weight: 600; margin-top: 0.5rem; }
    .positive { color: var(--color-success); }
    .neutral { color: var(--color-bleu-royal); }
    [data-theme="dark"] .neutral { color: var(--color-amber-tech); }
    .charts-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    .chart-card { padding: 2rem; border-radius: 20px; }
    .chart-card h3 { font-size: 1.2rem; font-weight: 700; margin-bottom: 0.2rem; }
    .bars-list { display: flex; flex-direction: column; gap: 1.25rem; }
    .bar-row { display: flex; align-items: center; gap: 1rem; }
    .bar-lbl { width: 160px; font-size: 0.85rem; color: var(--text-secondary); }
    .bar-track { flex: 1; height: 10px; border-radius: 9999px; background: var(--border-color); overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 9999px; }
    .fill-blue { background: var(--color-bleu-royal); }
    .fill-amber { background: var(--color-amber-tech); }
    .fill-green { background: var(--color-success); }
    .fill-purple { background: #9333ea; }
    .bar-pct { font-size: 0.82rem; font-weight: 700; width: 40px; text-align: right; }
    .donut-stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-top: 2rem;
    }
    .metric-circle {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 1.5rem 1rem;
      border-radius: 16px;
      background: rgba(0,0,0,0.02);
      border: 1px solid var(--border-color);
    }
    .circle-val {
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--color-bleu-royal);
      margin-bottom: 0.4rem;
    }
    [data-theme="dark"] .circle-val { color: var(--color-amber-tech); }
    .circle-lbl { font-size: 0.78rem; color: var(--text-secondary); line-height: 1.3; }
    .mt-6 { margin-top: 1.5rem; }
    .mb-4 { margin-bottom: 1rem; }
    .text-xs { font-size: 0.75rem; }
    @media (max-width: 900px) {
      .charts-grid { grid-template-columns: 1fr; }
      .donut-stats-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminStatistiquesComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly stats = signal<Statistiques | null>(null);

  ngOnInit(): void {
    this.api.getStatistiques().subscribe(data => this.stats.set(data));
  }
}
