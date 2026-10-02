package com.clubinfo.ist.projet.controller;

import com.clubinfo.ist.common.security.UserDetailsImpl;
import com.clubinfo.ist.projet.dto.ProjetDtos.CompteursProjets;
import com.clubinfo.ist.projet.dto.ProjetDtos.DecisionProjet;
import com.clubinfo.ist.projet.dto.ProjetDtos.ProjetDto;
import com.clubinfo.ist.projet.dto.ProjetDtos.ProjetSaisie;
import com.clubinfo.ist.projet.dto.ProjetDtos.SuiviProjet;
import com.clubinfo.ist.projet.entity.StatutProjet;
import com.clubinfo.ist.projet.service.ProjetService;
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
@Tag(name = "Projets", description = "Projets validés, propositions des membres, décision du Responsable et suivi des formateurs")
public class ProjetController {

    private static final String MEMBRE = "hasRole('MEMBRE')";
    private static final String FORMATEUR = "hasRole('FORMATEUR')";
    private static final String GESTION = "hasRole('RESPONSABLE_CLUB')";

    private final ProjetService projets;

    // ---- Lecture publique

    @GetMapping("/projets")
    @Operation(summary = "Projets validés, en cours ou terminés")
    public Page<ProjetDto> publies(@RequestParam(required = false) Long categorieId, @RequestParam(required = false) String search,
                                   @PageableDefault(size = 10) Pageable pageable) {
        return projets.publies(categorieId, search, pageable);
    }

    @GetMapping("/projets/slug/{slug}")
    @Operation(summary = "Projet validé")
    public ProjetDto publie(@PathVariable String slug) {
        return projets.publie(slug);
    }

    // ---- Membre

    @PostMapping("/projets")
    @PreAuthorize(MEMBRE)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Proposer un projet (statut « proposé »)")
    public ResponseEntity<ProjetDto> proposer(@AuthenticationPrincipal UserDetailsImpl membre, @Valid @RequestBody ProjetSaisie saisie) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projets.proposer(membre.getId(), saisie));
    }

    @GetMapping("/projets/mes-projets")
    @PreAuthorize(MEMBRE)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Projets proposés par l'utilisateur, tous statuts")
    public Page<ProjetDto> mesProjets(@AuthenticationPrincipal UserDetailsImpl membre, @RequestParam(required = false) StatutProjet statut,
                                      @RequestParam(required = false) Long categorieId, @PageableDefault(size = 10) Pageable pageable) {
        return projets.duPorteur(membre.getId(), statut, categorieId, pageable);
    }

    @GetMapping("/projets/{id}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Projet par identifiant ; un projet non publié est réservé à son porteur, aux formateurs et à la gestion")
    public ProjetDto lire(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl lecteur) {
        return projets.lire(id, lecteur);
    }

    // ---- Formateur

    @PutMapping("/projets/{id}/suivi")
    @PreAuthorize(FORMATEUR)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Enregistrer le suivi d'un formateur (note et avancement)")
    public ProjetDto suivre(@PathVariable Long id, @Valid @RequestBody SuiviProjet suivi) {
        return projets.suivre(id, suivi);
    }

    // ---- Gestion

    @GetMapping("/projets/en-attente")
    @PreAuthorize(GESTION)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Propositions en attente de décision")
    public List<ProjetDto> enAttente() {
        return projets.enAttente();
    }

    @GetMapping("/gestion/projets")
    @PreAuthorize(GESTION)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Tous les projets, tous statuts")
    public Page<ProjetDto> geres(@RequestParam(required = false) StatutProjet statut, @PageableDefault(size = 10) Pageable pageable) {
        return projets.geres(statut, pageable);
    }

    @GetMapping("/gestion/projets/compteurs")
    @PreAuthorize(GESTION)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Décompte des projets par décision")
    public CompteursProjets compteurs() {
        return projets.compteurs();
    }

    @PutMapping("/projets/{id}/validation")
    @PreAuthorize(GESTION)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Approuver ou rejeter une proposition ; notifie le porteur")
    public ProjetDto decider(@PathVariable Long id, @Valid @RequestBody DecisionProjet decision) {
        return projets.decider(id, decision);
    }
}
