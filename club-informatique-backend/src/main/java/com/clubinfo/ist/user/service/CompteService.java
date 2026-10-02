package com.clubinfo.ist.user.service;

import com.clubinfo.ist.auth.service.CourrielsDeCompte;
import com.clubinfo.ist.auth.service.SessionService;
import com.clubinfo.ist.common.exception.BusinessException;
import com.clubinfo.ist.common.journal.JournalService;
import com.clubinfo.ist.common.journal.JournalService.Resultat;
import com.clubinfo.ist.common.security.UserDetailsImpl;
import com.clubinfo.ist.fichier.Fichier;
import com.clubinfo.ist.fichier.FichierService;
import com.clubinfo.ist.user.dto.CompteDtos.ChangementMotDePasse;
import com.clubinfo.ist.user.dto.CompteDtos.Preferences;
import com.clubinfo.ist.user.dto.CompteDtos.Profil;
import com.clubinfo.ist.user.dto.CompteDtos.ProfilMiseAJour;
import com.clubinfo.ist.user.entity.StatutUtilisateur;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;

/** Ce que le titulaire fait de son propre compte : profil, mot de passe, préférences, export, suppression. */
@Service
@RequiredArgsConstructor
public class CompteService {

    private static final String ROLE_SUPER_ADMIN = "ROLE_SUPER_ADMIN";

    private final UtilisateurRepository utilisateurs;
    private final PasswordEncoder passwordEncoder;
    private final SessionService sessions;
    private final CourrielsDeCompte courriels;
    private final JournalService journal;
    private final JdbcTemplate jdbc;
    private final FichierService fichiers;

    @Value("${server.servlet.context-path:}")
    private String prefixe;

    @Transactional(readOnly = true)
    public Profil profil(Long id) {
        return Profil.de(compte(id));
    }

    @Transactional
    public Profil modifier(Long id, ProfilMiseAJour modification) {
        Utilisateur compte = compte(id);
        compte.setNom(modification.nom().trim());
        compte.setPrenom(modification.prenom().trim());
        compte.setFiliere(modification.filiere().trim());
        compte.setBiographie(modification.biographie() == null || modification.biographie().isBlank() ? null : modification.biographie().trim());
        return Profil.de(compte);
    }

    /** Dépose la photo de profil (image, 2 Mo au plus) ; la photo précédente est retirée du stockage. */
    @Transactional
    public Profil deposerPhoto(UserDetailsImpl connecte, MultipartFile piece) {
        Utilisateur compte = compte(connecte.getId());
        String precedente = compte.getPhoto();
        Fichier fichier = fichiers.deposerPhoto(piece, connecte);
        compte.setPhoto(prefixe + "/fichiers/" + fichier.getId());
        fichiers.supprimer(identifiantDuFichier(precedente));
        return Profil.de(compte);
    }

    @Transactional
    public Profil retirerPhoto(Long id) {
        Utilisateur compte = compte(id);
        fichiers.supprimer(identifiantDuFichier(compte.getPhoto()));
        compte.setPhoto(null);
        return Profil.de(compte);
    }

    private static String identifiantDuFichier(String adresse) {
        return adresse == null ? null : adresse.substring(adresse.lastIndexOf('/') + 1);
    }

    /** Ferme les autres sessions et lève l'obligation de changement ; la session courante reçoit un nouveau cookie. */
    @Transactional
    public void changerMotDePasse(Long id, ChangementMotDePasse demande, HttpServletResponse reponse) {
        Utilisateur compte = compte(id);
        if (!passwordEncoder.matches(demande.ancienMotDePasse(), compte.getMotDePasse())) {
            journal.enregistrer("CHANGEMENT_MOT_DE_PASSE", "Mot de passe actuel incorrect", compte.getEmail(), Resultat.ECHEC);
            throw new BusinessException("Le mot de passe actuel est incorrect.", HttpStatus.BAD_REQUEST, "MOT_DE_PASSE_INCORRECT");
        }
        if (passwordEncoder.matches(demande.nouveauMotDePasse(), compte.getMotDePasse())) {
            throw new BusinessException("Le nouveau mot de passe doit être différent de l'actuel.", HttpStatus.BAD_REQUEST, "MOT_DE_PASSE_INCHANGE");
        }
        compte.setMotDePasse(passwordEncoder.encode(demande.nouveauMotDePasse()));
        compte.setChangementMotDePasseRequis(false);
        utilisateurs.saveAndFlush(compte);
        sessions.reouvrirSeule(compte, reponse);
        courriels.motDePasseModifie(compte);
        journal.enregistrer("CHANGEMENT_MOT_DE_PASSE", "Mot de passe modifié par le titulaire", compte.getEmail(), Resultat.SUCCES);
    }

    @Transactional(readOnly = true)
    public Preferences preferences(Long id) {
        return new Preferences(Boolean.TRUE.equals(compte(id).getNotificationsCourriel()));
    }

    @Transactional
    public Preferences modifierPreferences(Long id, Preferences preferences) {
        Utilisateur compte = compte(id);
        compte.setNotificationsCourriel(preferences.notificationsCourriel());
        return new Preferences(preferences.notificationsCourriel());
    }

    /** Copie des données personnelles détenues sur le titulaire (droit d'accès). Le mot de passe n'y figure sous aucune forme. */
    @Transactional(readOnly = true)
    public Map<String, Object> exporter(Long id) {
        Utilisateur compte = compte(id);
        Map<String, Object> profil = new LinkedHashMap<>();
        profil.put("nom", compte.getNom());
        profil.put("prenom", compte.getPrenom());
        profil.put("email", compte.getEmail());
        profil.put("filiere", compte.getFiliere());
        profil.put("biographie", compte.getBiographie());
        profil.put("photo", compte.getPhoto());
        profil.put("numeroMembre", compte.getNumeroMembre());
        profil.put("dateAdhesion", compte.getDateAdhesion());
        profil.put("statut", compte.getStatut());
        profil.put("roles", compte.getRoles().stream().map(role -> role.getNom().replaceFirst("^ROLE_", "")).sorted().toList());
        profil.put("compteCreeLe", compte.getCreatedAt());
        profil.put("adresseVerifieeLe", compte.getEmailVerifieLe());
        profil.put("consentementLe", compte.getConsentementLe());

        Map<String, Object> export = new LinkedHashMap<>();
        export.put("profil", profil);
        export.put("preferences", new Preferences(Boolean.TRUE.equals(compte.getNotificationsCourriel())));
        export.put("inscriptions", jdbc.queryForList("""
                SELECT i.date_inscription AS "dateInscription", i.statut, e.titre AS evenement, f.titre AS formation
                FROM inscription i
                LEFT JOIN evenement e ON e.id = i.evenement_id
                LEFT JOIN session_formation s ON s.id = i.session_formation_id
                LEFT JOIN formation f ON f.id = s.formation_id
                WHERE i.utilisateur_id = ? AND i.deleted_at IS NULL
                ORDER BY i.date_inscription""", id));
        export.put("projets", jdbc.queryForList("""
                SELECT p.titre, p.statut, 'PORTEUR' AS role, p.created_at AS depuis
                FROM projet p WHERE p.porteur_id = ? AND p.deleted_at IS NULL
                UNION ALL
                SELECT p.titre, p.statut, m.role, m.date_rejoint
                FROM projet_membre m JOIN projet p ON p.id = m.projet_id
                WHERE m.utilisateur_id = ? AND m.deleted_at IS NULL AND p.deleted_at IS NULL
                ORDER BY depuis""", id, id));
        export.put("notifications", jdbc.queryForList("""
                SELECT n.titre, n.message, n.type, n.lue, n.created_at AS "recueLe"
                FROM notification n WHERE n.destinataire_id = ? AND n.deleted_at IS NULL
                ORDER BY n.created_at""", id));
        journal.enregistrer("EXPORT_DONNEES", "Export des données personnelles", compte.getEmail(), Resultat.SUCCES);
        return export;
    }

    /**
     * Suppression à la demande du titulaire : les données personnelles sont effacées, les inscriptions, participations
     * et notifications retirées. La ligne anonymisée subsiste pour les contenus publiés qu'elle porte ;
     * l'adresse redevient disponible.
     */
    @Transactional
    public void supprimer(Long id, String motDePasse) {
        Utilisateur compte = compte(id);
        if (!passwordEncoder.matches(motDePasse, compte.getMotDePasse())) {
            throw new BusinessException("Le mot de passe est incorrect.", HttpStatus.BAD_REQUEST, "MOT_DE_PASSE_INCORRECT");
        }
        boolean superAdmin = compte.getRoles().stream().anyMatch(role -> ROLE_SUPER_ADMIN.equals(role.getNom()));
        if (superAdmin && !Boolean.TRUE.equals(compte.getTest()) && utilisateurs.compterReelsAvecRole(ROLE_SUPER_ADMIN) <= 1) {
            throw new BusinessException("Ce compte est le dernier Super Admin : désignez-en un autre avant de le supprimer.",
                    HttpStatus.CONFLICT, "DERNIER_SUPER_ADMIN");
        }
        String adresse = compte.getEmail();
        String prenom = compte.getPrenom();

        compte.setNom("Compte");
        compte.setPrenom("supprimé");
        compte.setEmail("supprime-" + compte.getId() + "@compte.invalid");
        compte.setMotDePasse("!");
        compte.setDateNaissance(null);
        compte.setFiliere(null);
        compte.setAnneeEtude(null);
        fichiers.supprimer(identifiantDuFichier(compte.getPhoto()));
        compte.setPhoto(null);
        compte.setBiographie(null);
        compte.setSpecialite(null);
        compte.setFonction(null);
        compte.setNumeroMembre(null);
        compte.setStatut(StatutUtilisateur.INACTIF);
        compte.setRoles(new HashSet<>());
        compte.softDelete();
        utilisateurs.saveAndFlush(compte);

        jdbc.update("DELETE FROM inscription WHERE utilisateur_id = ?", id);
        jdbc.update("DELETE FROM projet_membre WHERE utilisateur_id = ?", id);
        jdbc.update("DELETE FROM notification WHERE destinataire_id = ?", id);
        jdbc.update("DELETE FROM jeton_usage_unique WHERE utilisateur_id = ?", id);
        sessions.fermerToutes(compte);
        jdbc.update("DELETE FROM refresh_token WHERE utilisateur_id = ?", id);

        courriels.compteSupprime(adresse, prenom);
        journal.enregistrer("SUPPRESSION_COMPTE", "Compte supprimé à la demande de son titulaire", "compte n° " + id, Resultat.SUCCES);
    }

    private Utilisateur compte(Long id) {
        return utilisateurs.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException("Compte introuvable.", HttpStatus.NOT_FOUND));
    }
}
