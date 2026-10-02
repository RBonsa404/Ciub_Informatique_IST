package com.clubinfo.ist.admin.service;

import com.clubinfo.ist.common.journal.JournalService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Réglages de la plateforme, conservés en base et appliqués : verrouillage des comptes, ouverture des inscriptions,
 * mode maintenance. Ils sont lus à chaque requête, donc gardés en mémoire quelques secondes.
 */
@Service
@RequiredArgsConstructor
public class ParametresService {

    public record Reglages(String nomPlateforme, boolean maintenanceMode, boolean inscriptionsOuvertes, int maxLoginAttempts,
                           int lockoutDurationMinutes) {
    }

    private static final Duration FRAICHEUR = Duration.ofSeconds(15);

    private final JdbcTemplate jdbc;
    private final JournalService journal;

    @Value("${app.mail.from-name}")
    private String nomParDefaut;
    @Value("${app.security.max-login-attempts}")
    private int echecsParDefaut;
    @Value("${app.security.lock-duration-minutes}")
    private int minutesParDefaut;

    private volatile Reglages courants;
    private volatile long lusA;

    public Reglages reglages() {
        Reglages connus = courants;
        if (connus == null || System.nanoTime() - lusA > FRAICHEUR.toNanos()) {
            return recharger();
        }
        return connus;
    }

    /** Relit la base sans attendre. */
    public Reglages recharger() {
        Map<String, String> valeurs = new HashMap<>();
        jdbc.query("SELECT cle, valeur FROM parametre_systeme", ligne -> {
            valeurs.put(ligne.getString("cle"), ligne.getString("valeur"));
        });
        Reglages lus = new Reglages(
                valeurs.getOrDefault("nomPlateforme", nomParDefaut),
                Boolean.parseBoolean(valeurs.getOrDefault("maintenanceMode", "false")),
                Boolean.parseBoolean(valeurs.getOrDefault("inscriptionsOuvertes", "true")),
                entier(valeurs.get("maxLoginAttempts"), echecsParDefaut),
                entier(valeurs.get("lockoutDurationMinutes"), minutesParDefaut));
        courants = lus;
        lusA = System.nanoTime();
        return lus;
    }

    @Transactional
    public Reglages enregistrer(Reglages reglages) {
        ecrire("nomPlateforme", reglages.nomPlateforme());
        ecrire("maintenanceMode", String.valueOf(reglages.maintenanceMode()));
        ecrire("inscriptionsOuvertes", String.valueOf(reglages.inscriptionsOuvertes()));
        ecrire("maxLoginAttempts", String.valueOf(reglages.maxLoginAttempts()));
        ecrire("lockoutDurationMinutes", String.valueOf(reglages.lockoutDurationMinutes()));
        journal.enregistrer("REGLAGES_MODIFIES", "Maintenance : " + reglages.maintenanceMode() + " ; inscriptions ouvertes : " + reglages.inscriptionsOuvertes()
                + " ; verrouillage après " + reglages.maxLoginAttempts() + " échecs pendant " + reglages.lockoutDurationMinutes() + " minutes",
                JournalService.Resultat.SUCCES);
        courants = reglages;
        lusA = System.nanoTime();
        return reglages;
    }

    private void ecrire(String cle, String valeur) {
        jdbc.update("INSERT INTO parametre_systeme (cle, valeur, updated_at) VALUES (?, ?, NOW()) "
                + "ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur, updated_at = NOW()", cle, valeur);
    }

    private static int entier(String valeur, int parDefaut) {
        try {
            return valeur == null ? parDefaut : Integer.parseInt(valeur);
        } catch (NumberFormatException illisible) {
            return parDefaut;
        }
    }
}
