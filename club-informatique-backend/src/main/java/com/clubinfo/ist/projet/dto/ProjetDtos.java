package com.clubinfo.ist.projet.dto;

import com.clubinfo.ist.common.validation.AdresseWebSure;
import com.clubinfo.ist.projet.entity.Projet;
import com.clubinfo.ist.projet.entity.ProjetMembre;
import com.clubinfo.ist.projet.entity.RoleProjetMembre;
import com.clubinfo.ist.projet.entity.StatutProjet;
import com.clubinfo.ist.user.entity.Utilisateur;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

/** Corps des requêtes et des réponses des projets. */
public final class ProjetDtos {

    private ProjetDtos() {
    }

    /** Un membre de projet est désigné par son nom ; son adresse n'est jamais communiquée. */
    public record MembreProjetDto(Long id, String utilisateurNom, RoleProjetMembre role) {

        static MembreProjetDto de(ProjetMembre membre) {
            return new MembreProjetDto(membre.getId(), nom(membre.getUtilisateur()), membre.getRole());
        }
    }

    /** « motifDecision » et « suiviFormateur » ne sont renseignés que pour le porteur, les formateurs et la gestion. */
    public record ProjetDto(Long id, String titre, String slug, String description, String objectifs, String technologies, String depotGit,
                            String documentationUrl, StatutProjet statut, Long porteurId, String porteurNom, String porteurFiliere,
                            String motifDecision, String suiviFormateur, int avancementPourcentage, Long categorieId, String categorieNom,
                            List<MembreProjetDto> membres, LocalDateTime createdAt) {

        public static ProjetDto de(Projet projet, boolean avecNotesInternes) {
            Utilisateur porteur = projet.getPorteur();
            return new ProjetDto(projet.getId(), projet.getTitre(), projet.getSlug(), projet.getDescription(), projet.getObjectifs(),
                    projet.getTechnologies(), projet.getDepotGit(), projet.getDocumentationUrl(), projet.getStatut(), porteur.getId(), nom(porteur),
                    porteur.isDeleted() ? null : porteur.getFiliere(),
                    avecNotesInternes ? projet.getMotifDecision() : null,
                    avecNotesInternes ? projet.getSuiviFormateur() : null,
                    projet.getAvancementPourcentage() == null ? 0 : projet.getAvancementPourcentage(),
                    projet.getCategorie() == null ? null : projet.getCategorie().getId(),
                    projet.getCategorie() == null ? null : projet.getCategorie().getNom(),
                    projet.getMembres().stream().filter(membre -> !membre.isDeleted()).map(MembreProjetDto::de).toList(),
                    projet.getCreatedAt());
        }
    }

    public record ProjetSaisie(
            @NotBlank(message = "Le titre est obligatoire.") @Size(min = 3, max = 200, message = "Le titre doit compter de 3 à 200 caractères.") String titre,
            @NotBlank(message = "La description est obligatoire.") @Size(max = 20_000, message = "La description ne doit pas dépasser 20 000 caractères.") String description,
            @Size(max = 5000, message = "Les objectifs ne doivent pas dépasser 5 000 caractères.") String objectifs,
            @NotBlank(message = "Les technologies sont obligatoires.") @Size(max = 500, message = "Les technologies ne doivent pas dépasser 500 caractères.") String technologies,
            @AdresseWebSure @Size(max = 500, message = "L'adresse du dépôt ne doit pas dépasser 500 caractères.") String depotGit,
            Long categorieId) {
    }

    public record SuiviProjet(
            @Size(max = 5000, message = "La note de suivi ne doit pas dépasser 5 000 caractères.") String suiviFormateur,
            @NotNull(message = "L'avancement est obligatoire.") @Min(value = 0, message = "L'avancement ne peut pas être inférieur à 0.")
            @Max(value = 100, message = "L'avancement ne peut pas dépasser 100.") Integer avancementPourcentage) {
    }

    /** Décision du Responsable sur une proposition. */
    public enum Decision { VALIDE, REJETE }

    public record DecisionProjet(
            @NotNull(message = "La décision est obligatoire.") Decision statut,
            @Size(max = 1000, message = "Le motif ne doit pas dépasser 1 000 caractères.") String motif) {
    }

    public record CompteursProjets(long enAttente, long valides, long rejetes) {
    }

    private static String nom(Utilisateur utilisateur) {
        return utilisateur.getPrenom() + " " + utilisateur.getNom();
    }
}
