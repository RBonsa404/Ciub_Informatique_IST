package com.clubinfo.ist.bureau;

import com.clubinfo.ist.common.exception.BusinessException;
import com.clubinfo.ist.common.journal.JournalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Composition du bureau : lue par tous, tenue par le Responsable du Club. */
@RestController
@RequestMapping("/bureau")
@RequiredArgsConstructor
@Tag(name = "Contenus publics", description = "Bureau du club")
public class BureauController {

    private final MembreBureauRepository membres;
    private final JournalService journal;

    public record MembreBureauDto(Long id, String nom, String prenom, String fonction, String filiere, int ordre) {

        static MembreBureauDto de(MembreBureau membre) {
            return new MembreBureauDto(membre.getId(), membre.getNom(), membre.getPrenom(), membre.getFonction(), membre.getFiliere(), membre.getOrdre());
        }
    }

    public record MembreBureauSaisie(
            @NotBlank(message = "Le nom est obligatoire.") @Size(max = 100, message = "Le nom ne doit pas dépasser 100 caractères.") String nom,
            @NotBlank(message = "Le prénom est obligatoire.") @Size(max = 100, message = "Le prénom ne doit pas dépasser 100 caractères.") String prenom,
            @NotBlank(message = "La fonction est obligatoire.") @Size(max = 100, message = "La fonction ne doit pas dépasser 100 caractères.") String fonction,
            @Size(max = 100, message = "La filière ne doit pas dépasser 100 caractères.") String filiere,
            @NotNull(message = "L'ordre d'affichage est obligatoire.") @Min(value = 0, message = "L'ordre ne peut pas être négatif.")
            @Max(value = 999, message = "L'ordre ne doit pas dépasser 999.") Integer ordre) {
    }

    @GetMapping
    @Transactional(readOnly = true)
    @Operation(summary = "Composition du bureau, par ordre d'affichage")
    public List<MembreBureauDto> composition() {
        return membres.findAllByOrderByOrdreAscIdAsc().stream().map(MembreBureauDto::de).toList();
    }

    @PostMapping
    @PreAuthorize("hasRole('RESPONSABLE_CLUB')")
    @SecurityRequirement(name = "BearerAuth")
    @Transactional
    @Operation(summary = "Ajouter un membre du bureau")
    public ResponseEntity<MembreBureauDto> ajouter(@Valid @RequestBody MembreBureauSaisie saisie) {
        MembreBureau membre = membres.save(appliquer(new MembreBureau(), saisie));
        journal.enregistrer("BUREAU_AJOUT", "Membre du bureau ajouté : " + membre.getFonction(), JournalService.Resultat.SUCCES);
        return ResponseEntity.status(HttpStatus.CREATED).body(MembreBureauDto.de(membre));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('RESPONSABLE_CLUB')")
    @SecurityRequirement(name = "BearerAuth")
    @Transactional
    @Operation(summary = "Modifier un membre du bureau")
    public MembreBureauDto modifier(@PathVariable Long id, @Valid @RequestBody MembreBureauSaisie saisie) {
        MembreBureau membre = membres.findById(id).orElseThrow(BureauController::introuvable);
        return MembreBureauDto.de(appliquer(membre, saisie));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('RESPONSABLE_CLUB')")
    @SecurityRequirement(name = "BearerAuth")
    @Transactional
    @Operation(summary = "Retirer un membre du bureau")
    public ResponseEntity<Void> retirer(@PathVariable Long id) {
        MembreBureau membre = membres.findById(id).orElseThrow(BureauController::introuvable);
        membres.delete(membre);
        journal.enregistrer("BUREAU_RETRAIT", "Membre du bureau retiré : " + membre.getFonction(), JournalService.Resultat.SUCCES);
        return ResponseEntity.noContent().build();
    }

    private static MembreBureau appliquer(MembreBureau membre, MembreBureauSaisie saisie) {
        membre.setNom(saisie.nom().trim());
        membre.setPrenom(saisie.prenom().trim());
        membre.setFonction(saisie.fonction().trim());
        membre.setFiliere(saisie.filiere() == null || saisie.filiere().isBlank() ? null : saisie.filiere().trim());
        membre.setOrdre(saisie.ordre());
        return membre;
    }

    private static BusinessException introuvable() {
        return new BusinessException("Membre du bureau introuvable.", HttpStatus.NOT_FOUND);
    }
}
