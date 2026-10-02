package com.clubinfo.ist.admin.service;

import com.clubinfo.ist.admin.dto.AdminDtos.Alerte;
import com.clubinfo.ist.admin.dto.AdminDtos.Conformite;
import com.clubinfo.ist.admin.dto.AdminDtos.Indicateurs;
import com.clubinfo.ist.admin.dto.AdminDtos.PointFrequentation;
import com.clubinfo.ist.admin.dto.AdminDtos.Sauvegarde;
import com.clubinfo.ist.admin.dto.AdminDtos.Statistiques;
import com.clubinfo.ist.admin.dto.AdminDtos.Verification;
import com.clubinfo.ist.common.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.info.BuildProperties;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Chiffres de l'administration. Tout est compté en base au moment de la demande : comptes de test,
 * contenus créés par eux et éléments supprimés n'entrent dans aucun total.
 */
@Service
@RequiredArgsConstructor
public class TableauxDeBordService {

    private static final String MEMBRES = """
            SELECT COUNT(DISTINCT u.id) FROM utilisateur u
            JOIN utilisateur_role ur ON ur.utilisateur_id = u.id JOIN role r ON r.id = ur.role_id
            WHERE u.deleted_at IS NULL AND NOT u.test AND r.nom = 'ROLE_MEMBRE'""";
    private static final int ECHECS_SIGNALES = 5;
    private static final int ECHECS_CRITIQUES = 20;
    private static final int JOURS_ENTRE_SAUVEGARDES = 8;
    private static final int COUT_MINIMAL_DU_HACHAGE = 10;

    private final JdbcTemplate jdbc;
    private final JwtProvider jwtProvider;
    private final ObjectProvider<BuildProperties> construction;
    private final ObjectProvider<JavaMailSender> courriel;

    @Value("${app.security.bcrypt-strength}")
    private int coutDuHachage;
    @Value("${app.cookie.secure:false}")
    private boolean cookieSecurise;
    @Value("${app.cors.allowed-origins:}")
    private String origines;

    // ---------------------------------------------------------------- Statistiques

    @Transactional(readOnly = true)
    public Statistiques statistiques() {
        Map<String, Long> parRole = new LinkedHashMap<>();
        jdbc.query("""
                SELECT r.nom, COUNT(u.id) AS effectif FROM role r
                LEFT JOIN utilisateur_role ur ON ur.role_id = r.id
                LEFT JOIN utilisateur u ON u.id = ur.utilisateur_id AND u.deleted_at IS NULL AND NOT u.test
                GROUP BY r.nom ORDER BY r.nom""", ligne -> {
            parRole.put(ligne.getString("nom").replaceFirst("^ROLE_", ""), ligne.getLong("effectif"));
        });
        Map<String, Long> parStatut = new LinkedHashMap<>();
        for (String statut : List.of("PROPOSE", "VALIDE", "EN_COURS", "TERMINE", "REJETE")) {
            parStatut.put(statut, 0L);
        }
        jdbc.query("""
                SELECT p.statut, COUNT(*) AS effectif FROM projet p JOIN utilisateur u ON u.id = p.porteur_id
                WHERE p.deleted_at IS NULL AND NOT u.test GROUP BY p.statut""", ligne -> {
            parStatut.put(ligne.getString("statut"), ligne.getLong("effectif"));
        });
        return new Statistiques(
                compter(MEMBRES),
                compter(MEMBRES + " AND u.statut = 'ACTIF'"),
                compter(horsTest("evenement", "organisateur_id")),
                compter(horsTest("formation", "formateur_id")),
                compter("SELECT COUNT(*) FROM projet p JOIN utilisateur u ON u.id = p.porteur_id WHERE p.deleted_at IS NULL AND NOT u.test"),
                compter(horsTest("ressource", "auteur_id")),
                compter("SELECT COUNT(*) FROM message_contact WHERE deleted_at IS NULL AND NOT traite"),
                parRole, parStatut);
    }

    /** Effectif actif et inscriptions confirmées des six derniers mois. */
    @Transactional(readOnly = true)
    public Indicateurs indicateurs() {
        List<PointFrequentation> frequentation = jdbc.query("""
                SELECT to_char(m.mois, 'YYYY-MM') AS mois, COUNT(i.id) AS inscriptions
                FROM generate_series(date_trunc('month', CAST(? AS timestamp)) - interval '5 months',
                                     date_trunc('month', CAST(? AS timestamp)), interval '1 month') AS m(mois)
                LEFT JOIN (inscription i JOIN utilisateur u ON u.id = i.utilisateur_id AND NOT u.test)
                       ON date_trunc('month', i.date_inscription) = m.mois AND i.statut = 'CONFIRMEE' AND i.deleted_at IS NULL
                GROUP BY m.mois ORDER BY m.mois""",
                (ligne, numero) -> new PointFrequentation(ligne.getString("mois"), ligne.getLong("inscriptions")),
                Timestamp.valueOf(LocalDateTime.now()), Timestamp.valueOf(LocalDateTime.now()));
        return new Indicateurs(compter(MEMBRES + " AND u.statut = 'ACTIF'"), frequentation);
    }

    // ---------------------------------------------------------------- Sécurité

    /** Comptes à examiner : verrouillés, suspendus, ou visés par des échecs de connexion répétés depuis 24 heures. */
    @Transactional(readOnly = true)
    public List<Alerte> alertes() {
        Timestamp maintenant = Timestamp.valueOf(LocalDateTime.now());
        List<Alerte> alertes = new ArrayList<>(jdbc.query(
                "SELECT id, email FROM utilisateur WHERE deleted_at IS NULL AND verrouille_jusqua > ? ORDER BY verrouille_jusqua DESC",
                (ligne, numero) -> new Alerte("COMPTE_VERROUILLE", "Compte verrouillé après des échecs de connexion répétés.",
                        ligne.getString("email"), ligne.getLong("id"), "MOYENNE"), maintenant));
        alertes.addAll(jdbc.query(
                "SELECT id, email FROM utilisateur WHERE deleted_at IS NULL AND statut = 'SUSPENDU' ORDER BY updated_at DESC NULLS LAST",
                (ligne, numero) -> new Alerte("COMPTE_SUSPENDU", "Compte suspendu par l'administration.",
                        ligne.getString("email"), ligne.getLong("id"), "FAIBLE")));
        alertes.addAll(jdbc.query("""
                SELECT utilisateur_email, COUNT(*) AS echecs FROM audit_log
                WHERE action = 'CONNEXION' AND statut = 'ECHEC' AND utilisateur_email IS NOT NULL AND date_action > ?
                GROUP BY utilisateur_email HAVING COUNT(*) >= ? ORDER BY echecs DESC""",
                (ligne, numero) -> new Alerte("ECHECS_DE_CONNEXION", ligne.getLong("echecs") + " connexions refusées en 24 heures.",
                        ligne.getString("utilisateur_email"), null, ligne.getLong("echecs") >= ECHECS_CRITIQUES ? "CRITIQUE" : "MOYENNE"),
                Timestamp.valueOf(LocalDateTime.now().minusHours(24)), ECHECS_SIGNALES));
        return alertes;
    }

    // ---------------------------------------------------------------- Exploitation

    @Transactional(readOnly = true)
    public List<Sauvegarde> sauvegardes() {
        return jdbc.query("SELECT id, effectuee_le, taille_octets, statut FROM sauvegarde ORDER BY effectuee_le DESC, id DESC LIMIT 30",
                (ligne, numero) -> new Sauvegarde(ligne.getLong("id"), ligne.getTimestamp("effectuee_le").toLocalDateTime(),
                        ligne.getObject("taille_octets", Long.class), ligne.getString("statut")));
    }

    public String version() {
        BuildProperties informations = construction.getIfAvailable();
        return informations == null ? "développement" : informations.getVersion();
    }

    /** Chaque contrôle interroge la configuration ou la base ; aucun n'est déclaré conforme d'office. */
    @Transactional(readOnly = true)
    public Conformite conformite() {
        Timestamp limiteDesSauvegardes = Timestamp.valueOf(LocalDateTime.now().minusDays(JOURS_ENTRE_SAUVEGARDES));
        List<String> listeDesOrigines = Arrays.stream(origines.split(",")).map(String::trim).filter(origine -> !origine.isEmpty()).toList();
        boolean originesRestreintes = !listeDesOrigines.isEmpty() && listeDesOrigines.stream().noneMatch(origine -> origine.contains("*"));

        List<Verification> verifications = List.of(
                new Verification("HACHAGE_DES_MOTS_DE_PASSE", "Mots de passe hachés avec un coût d'au moins " + COUT_MINIMAL_DU_HACHAGE,
                        coutDuHachage >= COUT_MINIMAL_DU_HACHAGE && compter("""
                                SELECT COUNT(*) FROM utilisateur WHERE deleted_at IS NULL AND mot_de_passe <> '!' AND mot_de_passe NOT LIKE '$2%'""") == 0),
                new Verification("SECRET_DE_SIGNATURE_FOURNI", "Secret de signature des jetons fourni par l'environnement", jwtProvider.secretFourni()),
                new Verification("COOKIE_DE_SESSION_SECURISE", "Cookie de session transmis en HTTPS uniquement", cookieSecurise),
                new Verification("ORIGINES_RESTREINTES", "Origines autorisées limitées à une liste exacte", originesRestreintes),
                new Verification("SUPER_ADMIN_REEL", "Au moins un Super Admin réel et actif", compter("""
                        SELECT COUNT(DISTINCT u.id) FROM utilisateur u JOIN utilisateur_role ur ON ur.utilisateur_id = u.id JOIN role r ON r.id = ur.role_id
                        WHERE u.deleted_at IS NULL AND NOT u.test AND u.statut = 'ACTIF' AND r.nom = 'ROLE_SUPER_ADMIN'""") > 0),
                new Verification("MOT_DE_PASSE_INITIAL_CHANGE", "Aucun mot de passe initial en attente de changement", compter("""
                        SELECT COUNT(*) FROM utilisateur WHERE deleted_at IS NULL AND NOT test AND changement_mot_de_passe_requis""") == 0),
                new Verification("AUCUN_COMPTE_DE_TEST", "Aucun compte de test présent",
                        compter("SELECT COUNT(*) FROM utilisateur WHERE deleted_at IS NULL AND test") == 0),
                new Verification("SAUVEGARDE_RECENTE", "Sauvegarde réussie depuis moins de " + JOURS_ENTRE_SAUVEGARDES + " jours",
                        jdbc.queryForObject("SELECT COUNT(*) FROM sauvegarde WHERE statut = 'REUSSIE' AND effectuee_le > ?", Long.class, limiteDesSauvegardes) > 0),
                new Verification("COURRIEL_CONFIGURE", "Serveur d'envoi des courriels configuré", courriel.getIfAvailable() != null));

        boolean conforme = verifications.stream().allMatch(Verification::conforme);
        return new Conformite(conforme ? "CONFORME" : "A_EXAMINER", version(), System.getProperty("java.version"),
                compter("SELECT COUNT(*) FROM utilisateur WHERE deleted_at IS NULL AND NOT test AND statut = 'ACTIF'"),
                jdbc.queryForObject("SELECT COUNT(*) FROM audit_log WHERE action = 'CONNEXION' AND statut = 'ECHEC' AND date_action > ?", Long.class,
                        Timestamp.valueOf(LocalDateTime.now().minusDays(30))),
                verifications);
    }

    private long compter(String requete) {
        Long total = jdbc.queryForObject(requete, Long.class);
        return total == null ? 0 : total;
    }

    /** Éléments non supprimés dont l'auteur n'est pas un compte de test (un auteur absent ne les écarte pas). */
    private static String horsTest(String table, String colonneAuteur) {
        return "SELECT COUNT(*) FROM " + table + " t LEFT JOIN utilisateur u ON u.id = t." + colonneAuteur
                + " WHERE t.deleted_at IS NULL AND COALESCE(u.test, FALSE) = FALSE";
    }
}
