import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import {
  Actualite,
  Evenement,
  Formation,
  Projet,
  Ressource,
  Statistiques,
  PageResponse,
  ApiResponse,
  User,
  Inscription,
  Devoir,
  Presence,
  Notification,
  AuditLog,
  AlerteSecurite,
  PageInfo
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/v1';

  /* ── Public & Actualités ── */
  getActualites(page = 0, size = 10, search?: string): Observable<PageResponse<Actualite>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search) params = params.set('search', search);

    return this.http.get<PageResponse<Actualite>>(`${this.baseUrl}/actualites`, { params }).pipe(
      catchError(() => of(this.getMockActualitesPage(page, size)))
    );
  }

  getActualiteBySlug(slug: string): Observable<Actualite> {
    return this.http.get<Actualite>(`${this.baseUrl}/actualites/${slug}`).pipe(
      catchError(() => of(this.getMockActualiteDetail(slug)))
    );
  }

  /* ── Événements ── */
  getEvenements(page = 0, size = 10, aVenir = true): Observable<PageResponse<Evenement>> {
    const params = new HttpParams().set('page', page).set('size', size).set('aVenir', aVenir);
    return this.http.get<PageResponse<Evenement>>(`${this.baseUrl}/evenements`, { params }).pipe(
      catchError(() => of(this.getMockEvenementsPage(page, size)))
    );
  }

  getEvenementById(id: number): Observable<Evenement> {
    return this.http.get<Evenement>(`${this.baseUrl}/evenements/${id}`).pipe(
      catchError(() => of(this.getMockEvenementDetail(id)))
    );
  }

  inscrireEvenement(evenementId: number): Observable<ApiResponse<Inscription>> {
    return this.http.post<ApiResponse<Inscription>>(`${this.baseUrl}/evenements/${evenementId}/inscriptions`, {});
  }

  /* ── Formations ── */
  getFormations(page = 0, size = 10, niveau?: string): Observable<PageResponse<Formation>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (niveau) params = params.set('niveau', niveau);

    return this.http.get<PageResponse<Formation>>(`${this.baseUrl}/formations`, { params }).pipe(
      catchError(() => of(this.getMockFormationsPage(page, size)))
    );
  }

  getFormationById(id: number): Observable<Formation> {
    return this.http.get<Formation>(`${this.baseUrl}/formations/${id}`).pipe(
      catchError(() => of(this.getMockFormationDetail(id)))
    );
  }

  inscrireSessionFormation(sessionId: number): Observable<ApiResponse<Inscription>> {
    return this.http.post<ApiResponse<Inscription>>(`${this.baseUrl}/sessions-formation/${sessionId}/inscriptions`, {});
  }

  /* ── Projets ── */
  getProjets(page = 0, size = 10, statut?: string): Observable<PageResponse<Projet>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (statut) params = params.set('statut', statut);

    return this.http.get<PageResponse<Projet>>(`${this.baseUrl}/projets`, { params }).pipe(
      catchError(() => of(this.getMockProjetsPage(page, size)))
    );
  }

  getProjetById(id: number): Observable<Projet> {
    return this.http.get<Projet>(`${this.baseUrl}/projets/${id}`).pipe(
      catchError(() => of(this.getMockProjetDetail(id)))
    );
  }

  proposerProjet(projet: Partial<Projet>): Observable<ApiResponse<Projet>> {
    return this.http.post<ApiResponse<Projet>>(`${this.baseUrl}/projets`, projet);
  }

  rejoindreProjet(projetId: number, role: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/projets/${projetId}/membres`, { role });
  }

  /* ── Ressources ── */
  getRessources(page = 0, size = 12, type?: string): Observable<PageResponse<Ressource>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (type) params = params.set('type', type);

    return this.http.get<PageResponse<Ressource>>(`${this.baseUrl}/ressources`, { params }).pipe(
      catchError(() => of(this.getMockRessourcesPage(page, size)))
    );
  }

  /* ── Membre & Dashboard ── */
  getMesInscriptions(): Observable<Inscription[]> {
    return this.http.get<Inscription[]>(`${this.baseUrl}/me/inscriptions`).pipe(
      catchError(() => of(this.getMockMesInscriptions()))
    );
  }

  annulerInscription(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/inscriptions/${id}`);
  }

  getMesDevoirs(): Observable<Devoir[]> {
    return this.http.get<Devoir[]>(`${this.baseUrl}/me/devoirs`).pipe(
      catchError(() => of(this.getMockMesDevoirs()))
    );
  }

  getMesNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/me/notifications`).pipe(
      catchError(() => of(this.getMockNotifications()))
    );
  }

  marquerNotificationLue(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/notifications/${id}/lire`, {});
  }

  /* ── Statistiques ── */
  getStatistiques(): Observable<Statistiques> {
    return this.http.get<Statistiques>(`${this.baseUrl}/statistiques`).pipe(
      catchError(() => of({
        totalMembres: 342,
        totalFormations: 28,
        totalEvenements: 19,
        totalProjets: 45,
        totalInscriptions: 820,
        membresActifs: 295,
        formationsEnCours: 6,
        evenementsAVenir: 4,
        projetsEnCours: 14
      }))
    );
  }

  /* ── Admin / Formateur / Responsable APIs ── */
  getUtilisateurs(page = 0, size = 10): Observable<PageResponse<User>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<User>>(`${this.baseUrl}/admin/utilisateurs`, { params }).pipe(
      catchError(() => of(this.getMockUsersPage()))
    );
  }

  updateUserStatut(userId: number, statut: 'ACTIF' | 'SUSPENDU' | 'INACTIF'): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/admin/utilisateurs/${userId}/statut`, { statut });
  }

  getAuditLogs(page = 0, size = 20): Observable<PageResponse<AuditLog>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<AuditLog>>(`${this.baseUrl}/admin/audit-logs`, { params }).pipe(
      catchError(() => of(this.getMockAuditLogs()))
    );
  }

  getAlertesSecurite(): Observable<AlerteSecurite[]> {
    const mockAlertes: AlerteSecurite[] = [
      { id: 1, type: 'BRUTE_FORCE_PREVENTED', description: 'Tentatives multiples de connexion bloquées sur ip 192.168.1.105', severite: 'WARNING', resolue: false, timestamp: '2026-09-23T11:20:00Z' },
      { id: 2, type: 'RATE_LIMIT_EXCEEDED', description: 'Seuil API 100 req/min dépassé temporairement par client', severite: 'INFO', resolue: true, timestamp: '2026-09-22T19:40:00Z' }
    ];
    return this.http.get<AlerteSecurite[]>(`${this.baseUrl}/admin/alertes-securite`).pipe(
      catchError(() => of(mockAlertes))
    );
  }

  /* ── Mock data fallbacks for smooth client-side offline preview ── */
  private getMockActualitesPage(page: number, size: number): PageResponse<Actualite> {
    const mockList: Actualite[] = [
      {
        id: 1,
        titre: 'Lancement de l\'Année Académique 2026-2027 & Hackathon Tech IST',
        slug: 'lancement-annee-academique-2026-hackathon',
        resume: 'Rejoignez le Club Informatique pour une nouvelle saison riche en challenges, ateliers IA et projets collaboratifs.',
        contenu: 'C’est avec une immense fierté que le Bureau du Club Informatique de l’Institut Supérieur de Technologie (IST) inaugure cette nouvelle saison. Au programme : des bootcamps certifiants, des hackathons universitaires et des rencontres exclusives avec les leaders du secteur numérique burkinabè et international.',
        imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
        publie: true,
        auteur: { id: 1, nom: 'Ouedraogo', prenom: 'Moussa' },
        createdAt: '2026-09-18T10:00:00Z'
      },
      {
        id: 2,
        titre: 'Partenariat Stratégique avec l\'ANPTIC et Écosystème Startup',
        slug: 'partenariat-anptic-ecosysteme-startup',
        resume: 'Une convention signée pour offrir aux membres du Club des stages immersifs et des opportunités d’incubation.',
        contenu: 'Le club renforce ses liens avec les institutions publiques et privées. Les étudiants membres bénéficieront d’un accès prioritaire aux centres de ressources numériques.',
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
        publie: true,
        auteur: { id: 2, nom: 'Sawadogo', prenom: 'Aïcha' },
        createdAt: '2026-09-14T14:30:00Z'
      },
      {
        id: 3,
        titre: 'Succès éclatant pour notre équipe au Tournoi National de Cybersécurité',
        slug: 'succes-tournoi-national-cybersecurite',
        resume: 'Nos étudiants décrochent la 2ème place nationale lors du Capture The Flag (CTF) inter-universitaire.',
        contenu: 'Face à 15 universités et instituts concurrents, la team "IST CyberGuardians" a brillé par ses compétences en cryptographie, reverse engineering et sécurité web.',
        imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80',
        publie: true,
        auteur: { id: 3, nom: 'Kabore', prenom: 'Yacouba' },
        createdAt: '2026-09-08T09:15:00Z'
      }
    ];

    return {
      content: mockList,
      totalElements: mockList.length,
      totalPages: 1,
      size,
      number: page,
      first: page === 0,
      last: true
    };
  }

  private getMockActualiteDetail(slug: string): Actualite {
    return {
      id: 1,
      titre: 'Lancement de l\'Année Académique 2026-2027 & Hackathon Tech IST',
      slug,
      resume: 'Rejoignez le Club Informatique pour une nouvelle saison riche en challenges, ateliers IA et projets collaboratifs.',
      contenu: `
# Une année pleine d'innovations technologiques

Le Club Informatique de l'IST a le plaisir de convier l'ensemble des étudiants, enseignants et partenaires à la rentrée solennelle de nos activités pour la promotion 2026-2027.

### Ce qui vous attend cette saison :
- **Formations intensives :** Angular, Spring Boot, DevOps, IA générative et Cyberdéfense.
- **Grands Événements :** IST Hack Days, DevFests universitaires et sessions de mentoring avec des professionnels de renommée.
- **FabLab & Projets :** Accompagnement de vos idées vers des prototypes fonctionnels et des startups.

Rejoignez-nous dès maintenant et devenez acteur du numérique à l'IST !
      `,
      imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
      publie: true,
      auteur: { id: 1, nom: 'Ouedraogo', prenom: 'Moussa' },
      createdAt: '2026-09-18T10:00:00Z'
    };
  }

  private getMockEvenementsPage(page: number, size: number): PageResponse<Evenement> {
    const list: Evenement[] = [
      {
        id: 1,
        titre: 'IST Code Clash 2026 — Hackathon 48H',
        slug: 'ist-code-clash-2026-hackathon',
        description: '48 heures non-stop d’idéation, de prototypage et de programmation pour relever des défis concrets en santé, éducation et fintech.',
        lieu: 'Campus Principal IST — Amphi B & FabLab',
        dateDebut: '2026-10-15T08:00:00Z',
        dateFin: '2026-10-17T18:00:00Z',
        capaciteMax: 100,
        nbInscrits: 68,
        imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
        publie: true,
        organisateur: { id: 1, nom: 'Bureau', prenom: 'Club Info' },
        createdAt: '2026-09-10T10:00:00Z'
      },
      {
        id: 2,
        titre: 'Masterclass : Architecture Cloud & DevOps avec Kubernetes',
        slug: 'masterclass-architecture-cloud-devops',
        description: 'Atelier pratique animé par un Cloud Architect certifié AWS/GCP. Déploiement de microservices conteneurisés en production.',
        lieu: 'Salle Informatique Lab 3',
        dateDebut: '2026-10-24T14:00:00Z',
        dateFin: '2026-10-24T18:00:00Z',
        capaciteMax: 40,
        nbInscrits: 32,
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
        publie: true,
        organisateur: { id: 2, nom: 'Sankara', prenom: 'Idrissa' },
        createdAt: '2026-09-12T11:00:00Z'
      },
      {
        id: 3,
        titre: 'Séminaire Cyberdéfense & Éthique du Hacking',
        slug: 'seminaire-cyberdefense-ethique-hacking',
        description: 'Sensibilisation aux menaces contemporaines, analyse de malwares et démonstration d’attaques/défenses en laboratoire sécurisé.',
        lieu: 'Amphi Ouédraogo — IST',
        dateDebut: '2026-11-05T09:00:00Z',
        dateFin: '2026-11-05T12:30:00Z',
        capaciteMax: 150,
        nbInscrits: 110,
        imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
        publie: true,
        organisateur: { id: 3, nom: 'Traore', prenom: 'Mariam' },
        createdAt: '2026-09-15T09:00:00Z'
      }
    ];

    return {
      content: list,
      totalElements: list.length,
      totalPages: 1,
      size,
      number: page,
      first: true,
      last: true
    };
  }

  private getMockEvenementDetail(id: number): Evenement {
    return {
      id,
      titre: 'IST Code Clash 2026 — Hackathon 48H',
      slug: 'ist-code-clash-2026-hackathon',
      description: '48 heures non-stop d’idéation, de prototypage et de programmation pour relever des défis concrets.',
      lieu: 'Campus Principal IST — Amphi B & FabLab',
      dateDebut: '2026-10-15T08:00:00Z',
      dateFin: '2026-10-17T18:00:00Z',
      capaciteMax: 100,
      nbInscrits: 68,
      imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
      publie: true,
      organisateur: { id: 1, nom: 'Bureau', prenom: 'Club Info' },
      createdAt: '2026-09-10T10:00:00Z'
    };
  }

  private getMockFormationsPage(page: number, size: number): PageResponse<Formation> {
    const list: Formation[] = [
      {
        id: 1,
        titre: 'Fullstack Moderne : Angular 22 & Spring Boot 4',
        slug: 'fullstack-moderne-angular-spring-boot',
        description: 'Maîtrisez le développement d’applications professionnelles de bout en bout avec JWT, Clean Architecture et Tailwind CSS.',
        objectifs: 'Créer une API REST robuste avec Spring Boot, concevoir une interface moderne et réactive avec Angular et déployer sur le Cloud.',
        prerequis: 'Bases en Java, TypeScript et HTML/CSS.',
        niveau: 'INTERMEDIAIRE',
        dureeHeures: 36,
        imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80',
        publie: true,
        formateur: { id: 10, nom: 'Compaore', prenom: 'David', photoUrl: '' },
        sessions: [
          { id: 101, titre: 'Session Octobre 2026', dateDebut: '2026-10-05T18:00:00Z', dateFin: '2026-11-15T20:00:00Z', lieu: 'En ligne (Google Meet) & Lab IST', capaciteMax: 30, nbInscrits: 22, formationId: 1 }
        ],
        createdAt: '2026-09-01T10:00:00Z'
      },
      {
        id: 2,
        titre: 'Initiation à l\'Intelligence Artificielle & Python pour la Data',
        slug: 'initiation-ia-python-data',
        description: 'Apprenez à manipuler les données, entraîner vos premiers modèles de Machine Learning et intégrer des LLMs dans vos apps.',
        objectifs: 'Comprendre Pandas, NumPy, Scikit-Learn et l’API OpenAI/Gemini pour des cas d’usage réels.',
        prerequis: 'Curiosité scientifique et bases de programmation.',
        niveau: 'DEBUTANT',
        dureeHeures: 24,
        imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80',
        publie: true,
        formateur: { id: 11, nom: 'Nikiema', prenom: 'Fatou', photoUrl: '' },
        sessions: [
          { id: 102, titre: 'Session Automne 2026', dateDebut: '2026-10-12T16:00:00Z', dateFin: '2026-11-20T18:00:00Z', lieu: 'Lab IA - IST', capaciteMax: 25, nbInscrits: 25, formationId: 2 }
        ],
        createdAt: '2026-09-05T10:00:00Z'
      },
      {
        id: 3,
        titre: 'Cybersécurité Offensive & Tests d\'Intrusion (Pentest)',
        slug: 'cybersecurite-offensive-pentest',
        description: 'Découvrez les techniques d’audit de sécurité, l’exploitation de vulnérabilités web (OWASP Top 10) et la rédaction de rapports.',
        objectifs: 'Savoir sécuriser un réseau et tester la résilience des serveurs web en toute légalité.',
        prerequis: 'Bases solides en réseaux (TCP/IP) et système Linux.',
        niveau: 'AVANCE',
        dureeHeures: 40,
        imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
        publie: true,
        formateur: { id: 12, nom: 'Zongo', prenom: 'Stephane', photoUrl: '' },
        sessions: [
          { id: 103, titre: 'Session Spéciale Pentest', dateDebut: '2026-11-02T18:00:00Z', dateFin: '2026-12-18T20:00:00Z', lieu: 'Lab Sécurité', capaciteMax: 20, nbInscrits: 14, formationId: 3 }
        ],
        createdAt: '2026-09-07T10:00:00Z'
      }
    ];

    return {
      content: list,
      totalElements: list.length,
      totalPages: 1,
      size,
      number: page,
      first: true,
      last: true
    };
  }

  private getMockFormationDetail(id: number): Formation {
    return {
      id,
      titre: 'Fullstack Moderne : Angular 22 & Spring Boot 4',
      slug: 'fullstack-moderne-angular-spring-boot',
      description: 'Maîtrisez le développement d’applications professionnelles de bout en bout avec JWT, Clean Architecture et Tailwind CSS.',
      objectifs: 'Créer une API REST robuste avec Spring Boot, concevoir une interface moderne et réactive avec Angular et déployer sur le Cloud.',
      prerequis: 'Bases en Java, TypeScript et HTML/CSS.',
      niveau: 'INTERMEDIAIRE',
      dureeHeures: 36,
      imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80',
      publie: true,
      formateur: { id: 10, nom: 'Compaore', prenom: 'David', photoUrl: '' },
      sessions: [
        { id: 101, titre: 'Session Octobre 2026', dateDebut: '2026-10-05T18:00:00Z', dateFin: '2026-11-15T20:00:00Z', lieu: 'En ligne (Google Meet) & Lab IST', capaciteMax: 30, nbInscrits: 22, formationId: id }
      ],
      createdAt: '2026-09-01T10:00:00Z'
    };
  }

  private getMockProjetsPage(page: number, size: number): PageResponse<Projet> {
    const list: Projet[] = [
      {
        id: 1,
        titre: 'Plateforme Numérique Club Informatique IST',
        slug: 'plateforme-club-informatique-ist',
        description: 'Développement de l’écosystème web du Club : portail public, gestion des adhésions, formations et gouvernance administrative.',
        technologies: 'Angular 22, Spring Boot 4, Tailwind CSS, PostgreSQL',
        statut: 'EN_COURS',
        avancement: 85,
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
        repositoryUrl: 'https://github.com/club-info-ist/club-app',
        porteur: { id: 1, nom: 'Ouedraogo', prenom: 'Moussa' },
        membres: [
          { id: 1, utilisateur: { id: 1, nom: 'Ouedraogo', prenom: 'Moussa' }, role: 'Tech Lead', dateAdhesion: '2026-09-01' },
          { id: 2, utilisateur: { id: 2, nom: 'Sawadogo', prenom: 'Aïcha' }, role: 'Frontend Dev', dateAdhesion: '2026-09-02' }
        ],
        createdAt: '2026-09-01T10:00:00Z'
      },
      {
        id: 2,
        titre: 'SmartCampus IoT — Gestion d’Énergie & Présences',
        slug: 'smartcampus-iot-gestion-energie',
        description: 'Capteurs connectés ESP32 et LoRaWAN pour surveiller l’éclairage et optimiser la consommation énergétique des salles de cours.',
        technologies: 'ESP32, C++, MQTT, Python FastAPI, Vue.js',
        statut: 'EN_COURS',
        avancement: 60,
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
        porteur: { id: 5, nom: 'Kinda', prenom: 'Benoit' },
        membres: [],
        createdAt: '2026-08-15T10:00:00Z'
      },
      {
        id: 3,
        titre: 'AgriTech BF — Diagnostic Maladies des Plantes par Vision IA',
        slug: 'agritech-bf-diagnostic-plantes-ia',
        description: 'Application mobile d’aide aux agriculteurs pour identifier les maladies des cultures locales via la caméra de leur smartphone.',
        technologies: 'Flutter, TensorFlow Lite, Python, Django',
        statut: 'TERMINE',
        avancement: 100,
        imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?w=800&auto=format&fit=crop&q=80',
        porteur: { id: 6, nom: 'Boro', prenom: 'Alassane' },
        membres: [],
        createdAt: '2026-05-10T10:00:00Z'
      }
    ];

    return {
      content: list,
      totalElements: list.length,
      totalPages: 1,
      size,
      number: page,
      first: true,
      last: true
    };
  }

  private getMockProjetDetail(id: number): Projet {
    return {
      id,
      titre: 'Plateforme Numérique Club Informatique IST',
      slug: 'plateforme-club-informatique-ist',
      description: 'Développement de l’écosystème web du Club : portail public, gestion des adhésions, formations et gouvernance administrative.',
      objectifs: 'Digitaliser l\'intégralité des processus du club et offrir aux étudiants une vitrine pour valoriser leurs réalisations.',
      technologies: 'Angular 22, Spring Boot 4, Tailwind CSS, PostgreSQL',
      statut: 'EN_COURS',
      avancement: 85,
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
      repositoryUrl: 'https://github.com/club-info-ist/club-app',
      porteur: { id: 1, nom: 'Ouedraogo', prenom: 'Moussa' },
      membres: [
        { id: 1, utilisateur: { id: 1, nom: 'Ouedraogo', prenom: 'Moussa' }, role: 'Tech Lead', dateAdhesion: '2026-09-01' },
        { id: 2, utilisateur: { id: 2, nom: 'Sawadogo', prenom: 'Aïcha' }, role: 'Frontend Dev', dateAdhesion: '2026-09-02' }
      ],
      createdAt: '2026-09-01T10:00:00Z'
    };
  }

  private getMockRessourcesPage(page: number, size: number): PageResponse<Ressource> {
    const list: Ressource[] = [
      {
        id: 1,
        titre: 'Support de Cours : Architecture REST & Bonnes Pratiques',
        description: 'Document PDF complet sur le design d\'API, codes HTTP et sécurité JWT.',
        type: 'PDF',
        url: '#',
        taille: 4200000,
        publique: true,
        auteur: { id: 10, nom: 'Compaore', prenom: 'David' },
        createdAt: '2026-09-10T10:00:00Z'
      },
      {
        id: 2,
        titre: 'Cheat Sheet : Commandes Docker & Docker Compose',
        description: 'Guide mémo synthétique pour conteneuriser vos applications en 5 minutes.',
        type: 'COURS',
        url: '#',
        taille: 1500000,
        publique: true,
        auteur: { id: 12, nom: 'Zongo', prenom: 'Stephane' },
        createdAt: '2026-09-12T10:00:00Z'
      },
      {
        id: 3,
        titre: 'Enregistrement Vidéo : Débuter avec Angular Signals & v22',
        description: 'Replay de la session live du 15 Septembre animée par le club.',
        type: 'VIDEO',
        url: 'https://youtube.com',
        taille: 0,
        publique: true,
        auteur: { id: 2, nom: 'Sawadogo', prenom: 'Aïcha' },
        createdAt: '2026-09-16T14:00:00Z'
      }
    ];

    return {
      content: list,
      totalElements: list.length,
      totalPages: 1,
      size,
      number: page,
      first: true,
      last: true
    };
  }

  private getMockMesInscriptions(): Inscription[] {
    return [
      {
        id: 1,
        statut: 'CONFIRMEE',
        dateInscription: '2026-09-20T10:00:00Z',
        utilisateur: { id: 1, nom: 'Moi', prenom: 'Etudiant', email: 'etudiant@ist.bf' },
        sessionFormation: {
          id: 101,
          titre: 'Session Octobre 2026',
          dateDebut: '2026-10-05T18:00:00Z',
          formation: { id: 1, titre: 'Fullstack Moderne : Angular 22 & Spring Boot 4' }
        }
      },
      {
        id: 2,
        statut: 'CONFIRMEE',
        dateInscription: '2026-09-21T14:00:00Z',
        utilisateur: { id: 1, nom: 'Moi', prenom: 'Etudiant', email: 'etudiant@ist.bf' },
        evenement: {
          id: 1,
          titre: 'IST Code Clash 2026 — Hackathon 48H',
          dateDebut: '2026-10-15T08:00:00Z'
        }
      }
    ];
  }

  private getMockMesDevoirs(): Devoir[] {
    return [
      {
        id: 1,
        titre: 'TP 1 : Création d’une API REST Spring Boot & JPA',
        description: 'Modélisez les entités Utilisateur, Rôle et Session. Ajoutez les tests unitaires.',
        dateLimite: '2026-10-20T23:59:00Z',
        formationId: 1,
        createdAt: '2026-10-06T10:00:00Z'
      },
      {
        id: 2,
        titre: 'TP 2 : Interface Reactive Angular avec Signals',
        description: 'Implémentez le composant de recherche en temps réel et la gestion du panier de cours.',
        dateLimite: '2026-10-30T23:59:00Z',
        formationId: 1,
        createdAt: '2026-10-16T10:00:00Z'
      }
    ];
  }

  private getMockNotifications(): Notification[] {
    return [
      {
        id: 1,
        titre: 'Inscription confirmée !',
        message: 'Votre place pour le Hackathon IST Code Clash 2026 est validée.',
        type: 'INSCRIPTION',
        lue: false,
        createdAt: '2026-09-22T08:30:00Z'
      },
      {
        id: 2,
        titre: 'Nouveau devoir disponible',
        message: 'Le formateur David Compaore a publié le TP 1 de la formation Fullstack.',
        type: 'INFO',
        lue: true,
        createdAt: '2026-09-21T15:00:00Z'
      }
    ];
  }

  private getMockUsersPage(): PageResponse<User> {
    const users: User[] = [
      {
        id: 1,
        nom: 'Ouedraogo',
        prenom: 'Moussa',
        email: 'president@ist.bf',
        telephone: '+226 70 00 00 01',
        filiere: 'Génie Logiciel',
        anneeEtude: 3,
        statut: 'ACTIF',
        roles: [{ id: 4, nom: 'ROLE_RESPONSABLE_CLUB', permissions: [] }],
        twoFactorEnabled: true,
        createdAt: '2026-09-01T08:00:00Z'
      },
      {
        id: 2,
        nom: 'Sawadogo',
        prenom: 'Aïcha',
        email: 'admin@ist.bf',
        statut: 'ACTIF',
        roles: [{ id: 5, nom: 'ROLE_ADMIN', permissions: [] }],
        twoFactorEnabled: true,
        createdAt: '2026-09-01T08:00:00Z'
      },
      {
        id: 3,
        nom: 'Compaore',
        prenom: 'David',
        email: 'formateur@ist.bf',
        filiere: 'Informatique',
        statut: 'ACTIF',
        roles: [{ id: 3, nom: 'ROLE_FORMATEUR', permissions: [] }],
        twoFactorEnabled: false,
        createdAt: '2026-09-02T10:00:00Z'
      },
      {
        id: 4,
        nom: 'Kabore',
        prenom: 'Ibrahim',
        email: 'membre@ist.bf',
        filiere: 'Réseaux & Télécoms',
        anneeEtude: 2,
        statut: 'ACTIF',
        roles: [{ id: 2, nom: 'ROLE_MEMBRE', permissions: [] }],
        twoFactorEnabled: false,
        createdAt: '2026-09-05T12:00:00Z'
      }
    ];

    return {
      content: users,
      totalElements: users.length,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true
    };
  }

  private getMockAuditLogs(): PageResponse<AuditLog> {
    const logs: AuditLog[] = [
      { id: 1, action: 'AUTH_LOGIN', entityType: 'Utilisateur', entityId: 1, utilisateur: 'president@ist.bf', ipAddress: '192.168.1.50', timestamp: '2026-09-23T12:00:00Z' },
      { id: 2, action: 'PROJET_CREATE', entityType: 'Projet', entityId: 1, utilisateur: 'president@ist.bf', ipAddress: '192.168.1.50', timestamp: '2026-09-23T11:45:00Z' },
      { id: 3, action: 'FORMATION_UPDATE', entityType: 'Formation', entityId: 1, utilisateur: 'formateur@ist.bf', ipAddress: '192.168.1.72', timestamp: '2026-09-23T10:30:00Z' }
    ];

    return {
      content: logs,
      totalElements: logs.length,
      totalPages: 1,
      size: 20,
      number: 0,
      first: true,
      last: true
    };
  }
}
