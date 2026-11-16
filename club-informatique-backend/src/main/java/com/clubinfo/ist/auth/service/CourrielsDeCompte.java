package com.clubinfo.ist.auth.service;

import com.clubinfo.ist.common.courriel.Courriel;
import com.clubinfo.ist.common.courriel.Courriel.PieceJointe;
import com.clubinfo.ist.common.courriel.CourrielService;
import com.clubinfo.ist.user.entity.Utilisateur;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Courriels liés à la vie du compte. Les liens pointent vers le frontend, qui présente le jeton à l'API. */
@Component
@RequiredArgsConstructor
public class CourrielsDeCompte {

    private final CourrielService courriels;

    @Value("${app.frontend-url}")
    private String frontend;

    public void verification(Utilisateur utilisateur, String jeton, long heuresDeValidite) {
        envoyer(utilisateur, "Confirmez votre adresse électronique", """
                Bonjour %s,

                Votre compte du Club Informatique de l'IST est presque prêt. Pour l'activer, confirmez votre adresse électronique en ouvrant ce lien :

                %s/verification-adresse?jeton=%s

                Ce lien est valable %d heures et ne peut servir qu'une fois.

                Si vous n'êtes pas à l'origine de cette inscription, ignorez ce message : aucun compte ne sera activé.
                """.formatted(utilisateur.getPrenom(), base(), jeton, heuresDeValidite));
    }

    /** Bienvenue après validation du compte, avec la carte de membre affichée dans le message et jointe. */
    public void carteDeMembre(Utilisateur utilisateur, byte[] carte) {
        String numero = utilisateur.getNumeroMembre();
        courriels.envoyer(new Courriel(utilisateur.getEmail(), "Bienvenue au Club Informatique de l'IST : votre carte de membre", """
                Bonjour %s,

                Bienvenue au Club Informatique de l'IST ! Votre compte est activé et voici votre carte de membre :

                [[image:carte-membre]]

                Votre numéro de membre : %s

                Présentez le QR code de votre carte à chaque séance de formation : il sert à enregistrer votre présence. Les séances de formation ont lieu chaque jeudi et chaque samedi.

                Vous êtes pour l'instant membre passif. Vous deviendrez membre actif du club dès que votre carte aura été scannée lors de 5 séances de formation. Les événements du club ne comptent pas dans ce décompte.

                Votre carte est jointe à ce message : enregistrez-la sur votre téléphone pour l'avoir toujours sur vous. Elle reste aussi disponible à tout moment dans votre profil :

                %s/espace/profil

                À très bientôt en séance !
                """.formatted(utilisateur.getPrenom(), numero, base()), null,
                List.of(new PieceJointe("carte-membre-" + numero + ".png", "image/png", carte, "carte-membre"))));
    }

    public void compteDejaExistant(Utilisateur utilisateur) {
        envoyer(utilisateur, "Vous avez déjà un compte", """
                Bonjour %s,

                Une inscription vient d'être demandée avec votre adresse électronique, alors qu'un compte existe déjà.

                Pour vous connecter : %s/connexion
                Si vous ne retrouvez plus votre mot de passe, utilisez « mot de passe oublié » : %s/mot-de-passe-oublie

                Si vous n'êtes pas à l'origine de cette demande, vous n'avez rien à faire : votre compte n'a pas été modifié.
                """.formatted(utilisateur.getPrenom(), base(), base()));
    }

    public void reinitialisation(Utilisateur utilisateur, String jeton, long minutesDeValidite) {
        envoyer(utilisateur, "Réinitialisation de votre mot de passe", """
                Bonjour %s,

                Vous avez demandé à choisir un nouveau mot de passe. Ouvrez ce lien pour le définir :

                %s/reinitialisation?jeton=%s

                Ce lien est valable %d minutes et ne peut servir qu'une fois.

                Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe reste inchangé.
                """.formatted(utilisateur.getPrenom(), base(), jeton, minutesDeValidite));
    }

    public void invitation(Utilisateur utilisateur, String jeton, long heuresDeValidite) {
        envoyer(utilisateur, "Invitation à rejoindre la plateforme du Club Informatique de l'IST", """
                Bonjour %s,

                Un compte vient d'être créé pour vous sur la plateforme du Club Informatique de l'IST. Pour l'activer, choisissez votre mot de passe en ouvrant ce lien :

                %s/reinitialisation?jeton=%s

                Ce lien est valable %d heures et ne peut servir qu'une fois. Passé ce délai, utilisez « mot de passe oublié » avec cette adresse.
                """.formatted(utilisateur.getPrenom(), base(), jeton, heuresDeValidite));
    }

    public void motDePasseModifie(Utilisateur utilisateur) {
        envoyer(utilisateur, "Votre mot de passe a été modifié", """
                Bonjour %s,

                Le mot de passe de votre compte vient d'être modifié. Les sessions ouvertes sur vos autres appareils ont été fermées.

                Si vous n'êtes pas à l'origine de ce changement, réinitialisez votre mot de passe sans attendre : %s/mot-de-passe-oublie
                """.formatted(utilisateur.getPrenom(), base()));
    }

    public void compteSupprime(String adresse, String prenom) {
        courriels.envoyer(new Courriel(adresse, "Votre compte a été supprimé", """
                Bonjour %s,

                Votre compte du Club Informatique de l'IST a été supprimé à votre demande. Vos données personnelles ont été effacées.

                Vous pouvez créer un nouveau compte à tout moment : %s/inscription
                """.formatted(prenom, base())));
    }

    private void envoyer(Utilisateur utilisateur, String objet, String texte) {
        courriels.envoyer(new Courriel(utilisateur.getEmail(), objet, texte));
    }

    private String base() {
        return frontend.endsWith("/") ? frontend.substring(0, frontend.length() - 1) : frontend;
    }
}
