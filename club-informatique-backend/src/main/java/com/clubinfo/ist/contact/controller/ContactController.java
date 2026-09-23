package com.clubinfo.ist.contact.controller;

import com.clubinfo.ist.contact.dto.MessageContactCreateDto;
import com.clubinfo.ist.contact.dto.MessageContactDto;
import com.clubinfo.ist.contact.service.ContactService;
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
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/contact")
@RequiredArgsConstructor
@Tag(name = "Formulaire de Contact", description = "Endpoints de soumission publique de messages et traitement par l'administration (UC-04)")
public class ContactController {

    private final ContactService contactService;

    @PostMapping
    @Operation(summary = "Envoyer un message de contact (public) (UC-04)")
    public ResponseEntity<MessageContactDto> envoyerMessage(@Valid @RequestBody MessageContactCreateDto dto) {
        MessageContactDto sent = contactService.envoyerMessage(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(sent);
    }

    @GetMapping("/admin")
    @PreAuthorize("hasAnyRole('RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Consulter les messages de contact reçus (UC-04)")
    public ResponseEntity<Page<MessageContactDto>> getAllMessages(
            @RequestParam(required = false) Boolean traite,
            @PageableDefault(size = 15) Pageable pageable) {
        Page<MessageContactDto> messages = contactService.getAllMessages(traite, pageable);
        return ResponseEntity.ok(messages);
    }

    @PutMapping("/admin/{id}/traite")
    @PreAuthorize("hasAnyRole('RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Marquer un message comme traité (UC-04)")
    public ResponseEntity<MessageContactDto> marquerCommeTraite(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        MessageContactDto updated = contactService.marquerCommeTraite(id, userDetails.getUsername());
        return ResponseEntity.ok(updated);
    }
}
