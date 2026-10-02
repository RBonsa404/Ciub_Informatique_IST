package com.clubinfo.ist.auth.service;

import com.clubinfo.ist.admin.service.ParametresService;
import com.clubinfo.ist.auth.dto.AuthDtos.Identifiants;
import com.clubinfo.ist.auth.dto.AuthDtos.InscriptionCompte;
import com.clubinfo.ist.auth.dto.AuthDtos.Reinitialisation;
import com.clubinfo.ist.auth.dto.AuthDtos.Session;
import com.clubinfo.ist.auth.entity.JetonUsageUnique;
import com.clubinfo.ist.common.exception.BusinessException;
import com.clubinfo.ist.common.journal.JournalService;
import com.clubinfo.ist.common.journal.JournalService.Resultat;
import com.clubinfo.ist.user.entity.Role;
import com.clubinfo.ist.user.entity.StatutUtilisateur;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.clubinfo.ist.user.repository.RoleRepository;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

/**
 * Inscription, vérification d'adresse, connexion et réinitialisation du mot de passe.
 * Aucune réponse ne révèle si une adresse correspond à un compte.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private static final Duration VALIDITE_VERIFICATION = Duration.ofHours(24);
    private static final Duration VALIDITE_REINITIALISATION = Duration.ofMinutes(60);
    private static final String REFUS = "Adresse électronique ou mot de passe incorrect.";

    private final UtilisateurRepository utilisateurs;
    private final RoleRepository roles;
    private final PasswordEncoder passwordEncoder;
    private final JetonService jetons;
    private final SessionService sessions;
    private final CourrielsDeCompte courriels;
    private final JournalService journal;
    private final ParametresService parametres;

    /** Empreinte sans compte : vérifiée quand l'adresse est inconnue, pour que le refus prenne le même temps. */
    private String empreinteFactice;

    @Transactional
    public void inscrire(InscriptionCompte demande) {
        if (!parametres.reglages().inscriptionsOuvertes()) {
            throw new BusinessException("Les inscriptions sont fermées pour le moment.", HttpStatus.FORBIDDEN, "INSCRIPTIONS_FERMEES");
        }
        String email = normaliser(demande.email());
        String empreinte = passwordEncoder.encode(demande.motDePasse());
        Optional<Utilisateur> existant = utilisateurs.findByEmail(email);
        if (existant.isPresent()) {
            Utilisateur compte = existant.get();
            if (compte.getStatut() == StatutUtilisateur.EN_ATTENTE_ACTIVATION) {
                courriels.verification(compte, jetons.emettre(compte, JetonUsageUnique.Type.VERIFICATION, VALIDITE_VERIFICATION), VALIDITE_VERIFICATION.toHours());
            } else {
                courriels.compteDejaExistant(compte);
            }
            return;
        }
        Set<Role> attribues = new HashSet<>();
        attribues.add(roles.findByNom("ROLE_MEMBRE").orElseThrow(() -> new IllegalStateException("Rôle absent de la base : ROLE_MEMBRE")));
        Utilisateur compte = utilisateurs.save(Utilisateur.builder()
                .nom(demande.nom().trim())
                .prenom(demande.prenom().trim())
                .email(email)
                .motDePasse(empreinte)
                .filiere(demande.filiere().trim())
                .statut(StatutUtilisateur.EN_ATTENTE_ACTIVATION)
                .numeroMembre(prochainNumeroDeMembre())
                .dateAdhesion(LocalDate.now())
                .consentementLe(LocalDateTime.now())
                .roles(attribues)
                .build());
        courriels.verification(compte, jetons.emettre(compte, JetonUsageUnique.Type.VERIFICATION, VALIDITE_VERIFICATION), VALIDITE_VERIFICATION.toHours());
        journal.enregistrer("INSCRIPTION", "Compte créé, en attente de vérification de l'adresse", email, Resultat.SUCCES);
    }

    @Transactional
    public void verifier(String jeton) {
        Utilisateur compte = jetons.consommer(jeton, JetonUsageUnique.Type.VERIFICATION)
                .flatMap(utilisateurs::findByIdAndDeletedAtIsNull)
                .orElseThrow(AuthService::jetonInvalide);
        compte.setEmailVerifieLe(LocalDateTime.now());
        if (compte.getStatut() == StatutUtilisateur.EN_ATTENTE_ACTIVATION) {
            compte.setStatut(StatutUtilisateur.ACTIF);
        }
        journal.enregistrer("VERIFICATION_ADRESSE", "Adresse électronique vérifiée", compte.getEmail(), Resultat.SUCCES);
    }

    /** Les refus sont enregistrés : le compteur d'échecs doit survivre à l'exception qui les signale. */
    @Transactional(noRollbackFor = BusinessException.class)
    public Session connecter(Identifiants identifiants, HttpServletResponse reponse) {
        String email = normaliser(identifiants.email());
        Utilisateur compte = utilisateurs.findByEmail(email).orElse(null);
        if (compte == null) {
            passwordEncoder.matches(identifiants.motDePasse(), empreinteFactice());
            journal.enregistrer("CONNEXION", "Connexion refusée", email, Resultat.ECHEC);
            throw refus();
        }
        if (compte.getVerrouilleJusqua() != null && !compte.estVerrouille()) {
            compte.reinitialiserTentativesConnexion();
        }
        if (!passwordEncoder.matches(identifiants.motDePasse(), compte.getMotDePasse())) {
            if (!compte.estVerrouille()) {
                compte.incrementerTentativesConnexion();
                ParametresService.Reglages reglages = parametres.reglages();
                if (compte.getTentativesConnexion() >= reglages.maxLoginAttempts()) {
                    compte.setVerrouilleJusqua(LocalDateTime.now().plusMinutes(reglages.lockoutDurationMinutes()));
                    journal.enregistrer("VERROUILLAGE_COMPTE", "Compte verrouillé après " + reglages.maxLoginAttempts() + " échecs de connexion", email, Resultat.ECHEC);
                }
            }
            journal.enregistrer("CONNEXION", "Connexion refusée", email, Resultat.ECHEC);
            throw refus();
        }
        // Le mot de passe est juste : l'état du compte peut être dit à son titulaire.
        if (compte.estVerrouille()) {
            throw new BusinessException("Ce compte est temporairement verrouillé après plusieurs tentatives. Réessayez plus tard.", HttpStatus.LOCKED);
        }
        switch (compte.getStatut()) {
            case EN_ATTENTE_ACTIVATION -> throw new BusinessException(
                    "Votre adresse électronique n'est pas encore vérifiée. Ouvrez le lien reçu par courriel.", HttpStatus.FORBIDDEN, "ADRESSE_NON_VERIFIEE");
            case SUSPENDU -> throw new BusinessException("Ce compte est suspendu. Contactez le club.", HttpStatus.FORBIDDEN, "COMPTE_SUSPENDU");
            case INACTIF -> throw new BusinessException("Ce compte n'est pas actif. Contactez le club.", HttpStatus.FORBIDDEN, "COMPTE_INACTIF");
            case ACTIF -> compte.reinitialiserTentativesConnexion();
        }
        journal.enregistrer("CONNEXION", "Connexion réussie", email, Resultat.SUCCES);
        return sessions.ouvrir(compte, Boolean.TRUE.equals(identifiants.seSouvenir()), reponse);
    }

    @Transactional
    public void demanderReinitialisation(String adresse) {
        utilisateurs.findByEmail(normaliser(adresse))
                .filter(compte -> compte.getStatut() == StatutUtilisateur.ACTIF || compte.getStatut() == StatutUtilisateur.EN_ATTENTE_ACTIVATION)
                .ifPresent(compte -> {
                    String jeton = jetons.emettre(compte, JetonUsageUnique.Type.REINITIALISATION, VALIDITE_REINITIALISATION);
                    courriels.reinitialisation(compte, jeton, VALIDITE_REINITIALISATION.toMinutes());
                    journal.enregistrer("DEMANDE_REINITIALISATION", "Lien de réinitialisation envoyé", compte.getEmail(), Resultat.SUCCES);
                });
    }

    @Transactional
    public void reinitialiser(Reinitialisation demande) {
        // Le lien d'une invitation sert au même usage : choisir son mot de passe.
        Utilisateur compte = jetons.consommer(demande.token(), JetonUsageUnique.Type.REINITIALISATION)
                .or(() -> jetons.consommer(demande.token(), JetonUsageUnique.Type.INVITATION))
                .flatMap(utilisateurs::findByIdAndDeletedAtIsNull)
                .orElseThrow(AuthService::jetonInvalide);
        compte.setMotDePasse(passwordEncoder.encode(demande.nouveauMotDePasse()));
        compte.setChangementMotDePasseRequis(false);
        compte.reinitialiserTentativesConnexion();
        // Le lien est parvenu à l'adresse : elle est donc vérifiée.
        if (compte.getStatut() == StatutUtilisateur.EN_ATTENTE_ACTIVATION) {
            compte.setStatut(StatutUtilisateur.ACTIF);
            compte.setEmailVerifieLe(LocalDateTime.now());
        }
        utilisateurs.saveAndFlush(compte);
        sessions.fermerToutes(compte);
        courriels.motDePasseModifie(compte);
        journal.enregistrer("REINITIALISATION_MOT_DE_PASSE", "Mot de passe réinitialisé par lien", compte.getEmail(), Resultat.SUCCES);
    }

    private String prochainNumeroDeMembre() {
        return "IST-%d-%04d".formatted(LocalDate.now().getYear(), utilisateurs.prochainNumeroDeMembre());
    }

    private String empreinteFactice() {
        if (empreinteFactice == null) {
            empreinteFactice = passwordEncoder.encode("compte-inexistant");
        }
        return empreinteFactice;
    }

    private static String normaliser(String adresse) {
        return adresse.trim().toLowerCase(Locale.ROOT);
    }

    private static BusinessException refus() {
        return new BusinessException(REFUS, HttpStatus.UNAUTHORIZED, "IDENTIFIANTS_REFUSES");
    }

    private static BusinessException jetonInvalide() {
        return new BusinessException("Ce lien n'est plus valable. Demandez-en un nouveau.", HttpStatus.BAD_REQUEST, "JETON_INVALIDE");
    }
}
