import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="bg-[#090d16] border-t border-white/10 mt-auto py-12 px-6">
      <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 class="text-xl font-bold font-heading mb-4">Club<span class="gradient-text">Info</span></h3>
          <p class="text-slate-400 text-sm leading-relaxed">
            Le hub d'excellence technologique pour les passionnés d'informatique, de développement logiciel, d'IA et de cybersécurité.
          </p>
        </div>
        <div>
          <h4 class="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Navigation</h4>
          <ul class="space-y-2 text-slate-400 text-sm">
            <li><a href="/actualites" class="hover:text-purple-400 transition-colors">Actualités</a></li>
            <li><a href="/evenements" class="hover:text-purple-400 transition-colors">Événements</a></li>
            <li><a href="/formations" class="hover:text-purple-400 transition-colors">Formations</a></li>
            <li><a href="/projets" class="hover:text-purple-400 transition-colors">Projets</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Ressources & Legal</h4>
          <ul class="space-y-2 text-slate-400 text-sm">
            <li><a href="/ressources" class="hover:text-purple-400 transition-colors">Bibliothèque Tech</a></li>
            <li><a href="/contact" class="hover:text-purple-400 transition-colors">Support & Contact</a></li>
            <li><a href="#" class="hover:text-purple-400 transition-colors">Politique RGPD</a></li>
            <li><a href="#" class="hover:text-purple-400 transition-colors">Charte Éthique</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Suivez-nous</h4>
          <div class="flex items-center gap-4 text-slate-400">
            <a href="#" class="w-10 h-10 rounded-lg glass-card flex items-center justify-center hover:text-purple-400"><i class="fa-brands fa-github"></i></a>
            <a href="#" class="w-10 h-10 rounded-lg glass-card flex items-center justify-center hover:text-cyan-400"><i class="fa-brands fa-discord"></i></a>
            <a href="#" class="w-10 h-10 rounded-lg glass-card flex items-center justify-center hover:text-purple-400"><i class="fa-brands fa-linkedin"></i></a>
          </div>
        </div>
      </div>
      <div class="max-w-7xl mx-auto border-t border-white/5 mt-12 pt-6 text-center text-slate-500 text-xs">
        © 2026 Club Informatique. Tous droits réservés. Construit avec Angular & Spring Boot.
      </div>
    </footer>
  `
})
export class FooterComponent {}
