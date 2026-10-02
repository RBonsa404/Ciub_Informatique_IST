package com.clubinfo.ist.contact.controller;

import com.clubinfo.ist.common.security.UserDetailsImpl;
import com.clubinfo.ist.contact.dto.ContactDtos.MessageContactDto;
import com.clubinfo.ist.contact.dto.ContactDtos.MessageContactSaisie;
import com.clubinfo.ist.contact.service.ContactService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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

@RestController
@RequiredArgsConstructor
@Tag(name = "Contact", description = "Formulaire de contact et traitement des messages reçus")
public class ContactController {

    private static final String GESTION = "hasAnyRole('RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')";

    private final ContactService contact;

    @PostMapping("/contact")
    @Operation(summary = "Envoyer un message au club (enregistré, notifié par courriel, accusé de réception)")
    public ResponseEntity<Void> envoyer(@Valid @RequestBody MessageContactSaisie saisie) {
        contact.recevoir(saisie);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/gestion/messages")
    @PreAuthorize(GESTION)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Messages de contact reçus")
    public Page<MessageContactDto> lister(@RequestParam(required = false) Boolean traite, @PageableDefault(size = 15) Pageable pageable) {
        return contact.lister(traite, pageable);
    }

    @PutMapping("/gestion/messages/{id}/traite")
    @PreAuthorize(GESTION)
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Marquer un message comme traité")
    public MessageContactDto marquerTraite(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl auteur) {
        return contact.marquerTraite(id, auteur.getId());
    }
}
