package com.clubinfo.ist.actualite.dto;

import com.clubinfo.ist.actualite.entity.Actualite;
import com.clubinfo.ist.actualite.entity.Visibilite;
import com.clubinfo.ist.common.validation.AdresseWebSure;
import com.clubinfo.ist.user.entity.Utilisateur;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/** Corps des requêtes et des réponses des actualités et des annonces. */
public final class ActualiteDtos {

    private ActualiteDtos() {
    }

    public record ActualiteDto(Long id, String titre, String slug, String contenu, String resume, String image, boolean publie,
                               Visibilite visibilite, LocalDateTime datePublication, String auteurNom, Long categorieId,
                               String categorieNom, LocalDateTime createdAt) {

        public static ActualiteDto de(Actualite actualite) {
            Utilisateur auteur = actualite.getAuteur();
            return new ActualiteDto(actualite.getId(), actualite.getTitre(), actualite.getSlug(), actualite.getContenu(), actualite.getResume(),
                    actualite.getImage(), Boolean.TRUE.equals(actualite.getPublie()), actualite.getVisibilite(), actualite.getDatePublication(),
                    auteur == null || auteur.isDeleted() ? null : auteur.getPrenom() + " " + auteur.getNom(),
                    actualite.getCategorie() == null ? null : actualite.getCategorie().getId(),
                    actualite.getCategorie() == null ? null : actualite.getCategorie().getNom(),
                    actualite.getCreatedAt());
        }
    }

    public record ActualiteSaisie(
            @NotBlank(message = "Le titre est obligatoire.") @Size(min = 3, max = 200, message = "Le titre doit compter de 3 à 200 caractères.") String titre,
            @NotBlank(message = "Le contenu est obligatoire.") @Size(max = 50_000, message = "Le contenu ne doit pas dépasser 50 000 caractères.") String contenu,
            @Size(max = 500, message = "Le résumé ne doit pas dépasser 500 caractères.") String resume,
            @AdresseWebSure @Size(max = 500, message = "L'adresse de l'image ne doit pas dépasser 500 caractères.") String image,
            Long categorieId,
            @NotNull(message = "L'état de publication est obligatoire.") Boolean publie,
            @NotNull(message = "La visibilité est obligatoire.") Visibilite visibilite) {
    }

    public record Publication(@NotNull(message = "L'état de publication est obligatoire.") Boolean publie) {
    }
}
