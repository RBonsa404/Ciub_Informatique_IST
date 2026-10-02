// Applique le thème avant le premier rendu (aucun scintillement).
// Préférence mémorisée, sinon préférence du système. Fichier externe : compatible avec une CSP stricte.
(function () {
  var theme;
  try {
    theme = localStorage.getItem('ci_ist_theme');
  } catch (e) {
    theme = null;
  }
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  document.documentElement.setAttribute('data-theme', theme);
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'light' ? '#F8FAFC' : '#070D1E');
})();
