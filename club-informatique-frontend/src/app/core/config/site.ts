/** Coordonnées réelles du club. Seule source de ces valeurs dans l'application. */
export const SITE = {
  name: 'Club Informatique de l’IST',
  shortName: 'Club Informatique',
  institution: 'Institut Supérieur de Technologie',
  city: 'Ouagadougou',
  country: 'Burkina Faso',
  email: 'clubinformatique.ist@gmail.com',
  whatsapp: { label: '+226 64 93 15 57', href: 'https://wa.me/22664931557' },
  phones: [
    { label: '+226 75 54 52 59', href: 'tel:+22675545259' },
    { label: '+226 55 63 37 24', href: 'tel:+22655633724' },
  ],
  social: {
    linkedin: 'https://www.linkedin.com/in/club-informatique-453a4043b/',
    facebook: 'https://web.facebook.com/profile.php?id=61594887003694',
    tiktok: 'https://www.tiktok.com/@clubinformatique74',
  },
} as const;
