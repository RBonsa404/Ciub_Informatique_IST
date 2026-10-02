package com.clubinfo.ist.admin.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** Corps des requêtes et des réponses des tableaux de bord, des réglages et de la conformité. */
public final class AdminDtos {

    private AdminDtos() {
    }

    /** Agrégations calculées en base, hors comptes de test et éléments supprimés. */
    public record Statistiques(long totalMembres, long membresActifs, long totalEvenements, long totalFormations, long totalProjets,
                               long totalRessources, long totalMessagesNonTraites, Map<String, Long> repartitionMembresParRole,
                               Map<String, Long> repartitionProjetsParStatut) {
    }

    public record Indicateurs(long membresActifs, List<PointFrequentation> frequentation) {
    }

    /** Inscriptions confirmées d'un mois (« AAAA-MM »). */
    public record PointFrequentation(String mois, long inscriptions) {
    }

    public record Alerte(String typeAlerte, String description, String utilisateurCible, Long utilisateurId, String gravite) {
    }

    public record Configuration(
            @NotBlank(message = "Le nom de la plateforme est obligatoire.") @Size(max = 100, message = "Le nom ne doit pas dépasser 100 caractères.") String nomPlateforme,
            String version,
            @NotNull(message = "Le mode maintenance est obligatoire.") Boolean maintenanceMode,
            @NotNull(message = "L'ouverture des inscriptions est obligatoire.") Boolean inscriptionsOuvertes,
            @NotNull(message = "Le nombre d'échecs est obligatoire.") @Min(value = 3, message = "Trois échecs au moins avant verrouillage.")
            @Max(value = 20, message = "Vingt échecs au plus avant verrouillage.") Integer maxLoginAttempts,
            @NotNull(message = "La durée de verrouillage est obligatoire.") @Min(value = 1, message = "Une minute au moins.")
            @Max(value = 1440, message = "Vingt-quatre heures au plus.") Integer lockoutDurationMinutes) {
    }

    public record Sauvegarde(Long id, LocalDateTime date, Long tailleOctets, String statut) {
    }

    public record Conformite(String statut, String versionBackend, String versionJava, long comptesActifs, long tentativesEchouees,
                             List<Verification> verifications) {
    }

    /** Contrôle calculé à partir de l'état réel de l'installation. */
    public record Verification(String code, String libelle, boolean conforme) {
    }
}
