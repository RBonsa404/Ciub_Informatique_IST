package com.clubinfo.ist.inscription.controller;

import com.clubinfo.ist.common.security.UserDetailsImpl;
import com.clubinfo.ist.inscription.dto.InscriptionDtos.InscriptionDto;
import com.clubinfo.ist.inscription.dto.InscriptionDtos.Pointages;
import com.clubinfo.ist.inscription.dto.InscriptionDtos.PresenceDto;
import com.clubinfo.ist.inscription.dto.InscriptionDtos.StatutInscriptionSaisie;
import com.clubinfo.ist.inscription.entity.StatutInscription;
import com.clubinfo.ist.inscription.service.InscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Inscriptions", description = "Inscriptions aux événements et aux séances, gestion et émargement")
public class InscriptionController {

    /** Cible d'une inscription, pour le filtre de « mes inscriptions ». */
    public enum TypeCible { EVENEMENT, FORMATION }

    private static final String MEMBRE = "hasRole('MEMBRE')";
    private static final String GESTION = "hasRole('RESPONSABLE_CLUB')";
    private static final String EQUIPE = "hasAnyRole('FORMATEUR', 'RESPONSABLE_CLUB')";

    private final InscriptionService inscriptions;

    // ---- Membre

    @PostMapping("/inscriptions/evenements/{evenementId}")
    @PreAuthorize(MEMBRE)
    @Operation(summary = "S'inscrire à un événement ; liste d'attente si la capacité est atteinte")
    public ResponseEntity<InscriptionDto> inscrireAEvenement(@AuthenticationPrincipal UserDetailsImpl membre, @PathVariable Long evenementId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inscriptions.inscrireAEvenement(membre.getId(), evenementId));
    }

    @PostMapping("/inscriptions/formations/{sessionId}")
    @PreAuthorize(MEMBRE)
    @Operation(summary = "S'inscrire à une séance de formation")
    public ResponseEntity<InscriptionDto> inscrireASeance(@AuthenticationPrincipal UserDetailsImpl membre, @PathVariable Long sessionId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inscriptions.inscrireASeance(membre.getId(), sessionId));
    }

    @GetMapping("/inscriptions/me")
    @PreAuthorize(MEMBRE)
    @Operation(summary = "Inscriptions de l'utilisateur")
    public Page<InscriptionDto> mesInscriptions(@AuthenticationPrincipal UserDetailsImpl membre,
                                                @RequestParam(required = false) TypeCible type,
                                                @RequestParam(required = false) StatutInscription statut,
                                                @PageableDefault(size = 10) Pageable pageable) {
        return inscriptions.duMembre(membre.getId(), type == null ? null : type.name(), statut, pageable);
    }

    @DeleteMapping("/inscriptions/{id}")
    @PreAuthorize(MEMBRE)
    @Operation(summary = "Annuler son inscription ; promeut le premier membre en liste d'attente")
    public ResponseEntity<Void> annuler(@AuthenticationPrincipal UserDetailsImpl membre, @PathVariable Long id) {
        inscriptions.annuler(membre.getId(), id);
        return ResponseEntity.noContent().build();
    }

    // ---- Gestion

    @GetMapping("/inscriptions/evenements/{evenementId}")
    @PreAuthorize(GESTION)
    @Operation(summary = "Inscrits d'un événement")
    public List<InscriptionDto> deLEvenement(@PathVariable Long evenementId) {
        return inscriptions.deLEvenement(evenementId);
    }

    @GetMapping("/inscriptions/formations/{sessionId}")
    @PreAuthorize(EQUIPE)
    @Operation(summary = "Inscrits d'une séance")
    public List<InscriptionDto> deLaSeance(@PathVariable Long sessionId, @AuthenticationPrincipal UserDetailsImpl lecteur) {
        return inscriptions.deLaSeance(sessionId, lecteur);
    }

    @PutMapping("/inscriptions/{id}/statut")
    @PreAuthorize(GESTION)
    @Operation(summary = "Changer le statut d'une inscription (promotion depuis la liste d'attente)")
    public InscriptionDto changerStatut(@PathVariable Long id, @Valid @RequestBody StatutInscriptionSaisie saisie) {
        return inscriptions.changerStatut(id, saisie.statut(), saisie.motif());
    }

    // ---- Émargement

    @GetMapping("/presences/sessions/{sessionId}")
    @PreAuthorize(EQUIPE)
    @Operation(summary = "Feuille d'émargement d'une séance")
    public List<PresenceDto> feuilleDEmargement(@PathVariable Long sessionId, @AuthenticationPrincipal UserDetailsImpl lecteur) {
        return inscriptions.feuilleDEmargement(sessionId, lecteur);
    }

    @PostMapping("/presences/sessions/{sessionId}")
    @PreAuthorize(EQUIPE)
    @Operation(summary = "Enregistrer des pointages")
    public List<PresenceDto> pointer(@PathVariable Long sessionId, @Valid @RequestBody Pointages pointages,
                                     @AuthenticationPrincipal UserDetailsImpl formateur) {
        return inscriptions.pointer(sessionId, pointages.presences(), formateur);
    }
}
