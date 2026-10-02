package com.clubinfo.ist.page.controller;

import com.clubinfo.ist.common.exception.BusinessException;
import com.clubinfo.ist.common.journal.JournalService;
import com.clubinfo.ist.common.security.UserDetailsImpl;
import com.clubinfo.ist.page.entity.PageInfo;
import com.clubinfo.ist.page.repository.PageInfoRepository;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * Pages d'information rédigées par le club (accueil, présentation). Une page que personne n'a rédigée n'existe pas :
 * le site affiche alors un état vide, jamais un texte de remplissage.
 */
@RestController
@RequestMapping("/pages")
@RequiredArgsConstructor
@Tag(name = "Contenus publics", description = "Pages d'information")
public class PageInfoController {

    private static final Set<String> PAGES = Set.of("accueil", "presentation");

    private final PageInfoRepository pages;
    private final UtilisateurRepository utilisateurs;
    private final JournalService journal;

    public record PageInformation(String slug, String titre, String contenu, LocalDateTime updatedAt) {

        static PageInformation de(PageInfo page) {
            return new PageInformation(page.getSlug(), page.getTitre(), page.getContenu(),
                    page.getUpdatedAt() != null ? page.getUpdatedAt() : page.getCreatedAt());
        }
    }

    public record PageSaisie(
            @NotBlank(message = "Le titre est obligatoire.") @Size(min = 2, max = 200, message = "Le titre doit compter de 2 à 200 caractères.") String titre,
            @NotBlank(message = "Le contenu est obligatoire.") @Size(max = 20_000, message = "Le contenu ne doit pas dépasser 20 000 caractères.") String contenu) {
    }

    @GetMapping("/{slug}")
    @Transactional(readOnly = true)
    @Operation(summary = "Page d'information (accueil, présentation)")
    public ResponseEntity<PageInformation> lire(@PathVariable String slug) {
        return pages.findBySlug(slug).filter(page -> PAGES.contains(page.getSlug()))
                .map(page -> ResponseEntity.ok(PageInformation.de(page)))
                .orElseThrow(PageInfoController::introuvable);
    }

    @PutMapping("/{slug}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Transactional
    @Operation(summary = "Rédiger ou modifier une page d'information")
    public ResponseEntity<PageInformation> rediger(@PathVariable String slug, @AuthenticationPrincipal UserDetailsImpl redacteur,
                                                  @Valid @RequestBody PageSaisie saisie) {
        if (!PAGES.contains(slug)) {
            throw introuvable();
        }
        PageInfo page = pages.findBySlug(slug).orElseGet(() -> PageInfo.builder().slug(slug).build());
        page.setTitre(saisie.titre().trim());
        page.setContenu(saisie.contenu());
        page.setModifiePar(utilisateurs.getReferenceById(redacteur.getId()));
        page = pages.saveAndFlush(page);
        journal.enregistrer("PAGE_MODIFIEE", "Page « " + slug + " » rédigée", JournalService.Resultat.SUCCES);
        return ResponseEntity.ok(PageInformation.de(page));
    }

    private static BusinessException introuvable() {
        return new BusinessException("Page introuvable.", HttpStatus.NOT_FOUND);
    }
}
