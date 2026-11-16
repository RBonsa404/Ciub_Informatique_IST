package com.clubinfo.ist.carte;

import com.clubinfo.ist.inscription.repository.PresenceRepository;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Carte de membre : jeton du QR code, numéro de membre, image de la carte et statut du membre.
 * Un membre devient actif après {@value #SEANCES_POUR_ETRE_ACTIF} séances de formation pointées ; avant, il est passif.
 * Les événements ne comptent pas.
 */
@Service
@RequiredArgsConstructor
public class CarteService {

    public static final int SEANCES_POUR_ETRE_ACTIF = 5;
    public static final String JOURS_DES_SEANCES = "les jeudis et les samedis";

    /** Sans caractères ambigus (0/O, 1/l/I) : un jeton reste lisible s'il faut le saisir à la main. */
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static final int LONGUEUR_JETON = 16;
    private static final DateTimeFormatter MOIS = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.FRENCH);

    private final SecureRandom hasard = new SecureRandom();
    private final UtilisateurRepository utilisateurs;
    private final PresenceRepository presences;

    @Value("${app.frontend-url}")
    private String site;

    /** État de la carte, tel que l'affiche le profil. */
    public record EtatCarte(String numeroMembre, long seancesSuivies, int seuil, boolean actif, String joursDesSeances) {
    }

    /** Attribue au besoin le jeton, le numéro de membre et la date d'adhésion. */
    @Transactional
    public Utilisateur preparer(Utilisateur membre) {
        boolean modifie = false;
        if (membre.getCarteJeton() == null) {
            String jeton;
            do {
                jeton = nouveauJeton();
            } while (utilisateurs.findByCarteJetonAndDeletedAtIsNull(jeton).isPresent());
            membre.setCarteJeton(jeton);
            modifie = true;
        }
        if (membre.getNumeroMembre() == null) {
            membre.setNumeroMembre("IST-%d-%04d".formatted(LocalDate.now().getYear(), utilisateurs.prochainNumeroDeMembre()));
            modifie = true;
        }
        if (membre.getDateAdhesion() == null) {
            membre.setDateAdhesion(LocalDate.now());
            modifie = true;
        }
        return modifie ? utilisateurs.save(membre) : membre;
    }

    public byte[] image(Utilisateur membre) {
        return DessinCarte.png(new DonneesCarte(membre.getPrenom(), membre.getNom(), filiere(membre), membre.getNumeroMembre(),
                membreDepuis(membre.getDateAdhesion()), lien(membre)));
    }

    public EtatCarte etat(Utilisateur membre) {
        long suivies = seancesSuivies(membre);
        return new EtatCarte(membre.getNumeroMembre(), suivies, SEANCES_POUR_ETRE_ACTIF, suivies >= SEANCES_POUR_ETRE_ACTIF, JOURS_DES_SEANCES);
    }

    public long seancesSuivies(Utilisateur membre) {
        return presences.seancesSuivies(membre.getId());
    }

    /** Adresse encodée dans le QR code : le jeton seul, aucune donnée personnelle. */
    public String lien(Utilisateur membre) {
        return site.replaceAll("/+$", "") + "/c/" + membre.getCarteJeton();
    }

    static String filiere(Utilisateur membre) {
        String filiere = membre.getFiliere() == null ? "" : membre.getFiliere().trim();
        Integer annee = membre.getAnneeEtude();
        if (annee == null || annee < 1 || filiere.matches("(?i).*\\bann[ée]e\\b.*")) {
            return filiere;
        }
        String rang = annee == 1 ? "1re" : annee + "e";
        return filiere.isEmpty() ? rang + " année" : filiere + ", " + rang + " année";
    }

    static String membreDepuis(LocalDate adhesion) {
        String mois = MOIS.format(adhesion == null ? LocalDate.now() : adhesion);
        return mois.substring(0, 1).toUpperCase(Locale.FRENCH) + mois.substring(1);
    }

    private String nouveauJeton() {
        StringBuilder jeton = new StringBuilder(LONGUEUR_JETON);
        for (int i = 0; i < LONGUEUR_JETON; i++) {
            jeton.append(ALPHABET.charAt(hasard.nextInt(ALPHABET.length())));
        }
        return jeton.toString();
    }
}
