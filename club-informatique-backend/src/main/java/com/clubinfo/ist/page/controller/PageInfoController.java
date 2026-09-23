package com.clubinfo.ist.page.controller;

import com.clubinfo.ist.page.dto.PageInfoDto;
import com.clubinfo.ist.page.dto.PageInfoUpdateDto;
import com.clubinfo.ist.page.service.PageInfoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/pages")
@RequiredArgsConstructor
@Tag(name = "Pages d'Information", description = "Endpoints de consultation publique des pages statiques (accueil, présentation, bureau) et mise à jour CMS (UC-01, UC-25)")
public class PageInfoController {

    private final PageInfoService pageInfoService;

    @GetMapping("/{slug}")
    @Operation(summary = "Consulter le contenu d'une page informative par son slug (accueil, presentation, bureau) (public) (UC-01)")
    public ResponseEntity<PageInfoDto> getPageBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(pageInfoService.getPageBySlug(slug));
    }

    @PutMapping("/{slug}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Modifier le contenu d'une page informative (UC-25)")
    public ResponseEntity<PageInfoDto> updatePage(
            @PathVariable String slug,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PageInfoUpdateDto dto) {
        PageInfoDto updated = pageInfoService.updatePage(slug, userDetails.getUsername(), dto);
        return ResponseEntity.ok(updated);
    }
}
