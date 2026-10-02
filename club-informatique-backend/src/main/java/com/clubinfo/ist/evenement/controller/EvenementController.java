package com.clubinfo.ist.evenement.controller;

import com.clubinfo.ist.common.security.UserDetailsImpl;
import com.clubinfo.ist.evenement.dto.EvenementDtos.EvenementDto;
import com.clubinfo.ist.evenement.dto.EvenementDtos.EvenementSaisie;
import com.clubinfo.ist.evenement.service.EvenementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

@RestController
@RequiredArgsConstructor
@Tag(name = "Événements", description = "Événements publiés, export iCalendar et gestion par le Responsable du Club")
public class EvenementController {

    private static final String GESTION = "hasRole('RESPONSABLE_CLUB')";
    private static final MediaType CALENDRIER = new MediaType("text", "calendar", StandardCharsets.UTF_8);

    private final EvenementService evenements;

    @GetMapping("/evenements")
    @Operation(summary = "Événements publiés")
    public Page<EvenementDto> publies(@RequestParam(required = false) Boolean aVenir, @RequestParam(required = false) Long categorieId,
                                      @RequestParam(required = false) String search, @PageableDefault(size = 10) Pageable pageable) {
        return evenements.publies(Boolean.TRUE.equals(aVenir), categorieId, search, pageable);
    }

    @GetMapping("/evenements/slug/{slug}")
    @Operation(summary = "Événement publié")
    public EvenementDto publie(@PathVariable String slug) {
        return evenements.publie(slug);
    }

    @GetMapping("/evenements/{id}/calendrier")
    @Operation(summary = "Événement au format iCalendar")
    public ResponseEntity<String> calendrier(@PathVariable Long id) {
        return ResponseEntity.ok()
                .contentType(CALENDRIER)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(evenements.nomDuFichier(id)).build().toString())
                .body(evenements.calendrier(id));
    }

    @GetMapping("/gestion/evenements")
    @PreAuthorize(GESTION)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Tous les événements, publiés ou non")
    public Page<EvenementDto> geres(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate du,
                                    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate au,
                                    @PageableDefault(size = 10) Pageable pageable) {
        return evenements.geres(du, au, pageable);
    }

    @PostMapping("/evenements")
    @PreAuthorize(GESTION)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Créer un événement")
    public ResponseEntity<EvenementDto> creer(@AuthenticationPrincipal UserDetailsImpl organisateur, @Valid @RequestBody EvenementSaisie saisie) {
        return ResponseEntity.status(HttpStatus.CREATED).body(evenements.creer(organisateur.getId(), saisie));
    }

    @PutMapping("/evenements/{id}")
    @PreAuthorize(GESTION)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Modifier un événement")
    public EvenementDto modifier(@PathVariable Long id, @Valid @RequestBody EvenementSaisie saisie) {
        return evenements.modifier(id, saisie);
    }

    @DeleteMapping("/evenements/{id}")
    @PreAuthorize(GESTION)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Supprimer un événement")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        evenements.supprimer(id);
        return ResponseEntity.noContent().build();
    }
}
