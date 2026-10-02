package com.clubinfo.ist.notification.controller;

import com.clubinfo.ist.common.security.UserDetailsImpl;
import com.clubinfo.ist.notification.dto.NotificationDtos.CompteurNonLues;
import com.clubinfo.ist.notification.dto.NotificationDtos.NotificationDto;
import com.clubinfo.ist.notification.dto.NotificationDtos.NotificationGlobale;
import com.clubinfo.ist.notification.entity.TypeNotification;
import com.clubinfo.ist.notification.service.NotificationService;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Notifications", description = "Notifications de l'utilisateur et annonces du Responsable du Club")
public class NotificationController {

    private final NotificationService notifications;

    @GetMapping
    @Operation(summary = "Notifications de l'utilisateur")
    public Page<NotificationDto> lister(@AuthenticationPrincipal UserDetailsImpl connecte,
                                        @RequestParam(required = false) TypeNotification type,
                                        @RequestParam(required = false) Boolean lue,
                                        @PageableDefault(size = 10) Pageable pageable) {
        return notifications.lister(connecte.getId(), type, lue, pageable);
    }

    @GetMapping("/non-lues/count")
    @Operation(summary = "Nombre de notifications non lues")
    public CompteurNonLues nonLues(@AuthenticationPrincipal UserDetailsImpl connecte) {
        return new CompteurNonLues(notifications.nonLues(connecte.getId()));
    }

    @PutMapping("/{id}/lue")
    @Operation(summary = "Marquer une notification comme lue")
    public ResponseEntity<Void> marquerLue(@AuthenticationPrincipal UserDetailsImpl connecte, @PathVariable Long id) {
        notifications.marquerLue(connecte.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/lire-toutes")
    @Operation(summary = "Marquer toutes ses notifications comme lues")
    public ResponseEntity<Void> marquerToutesLues(@AuthenticationPrincipal UserDetailsImpl connecte) {
        notifications.marquerToutesLues(connecte.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/globales")
    @PreAuthorize("hasRole('RESPONSABLE_CLUB')")
    @Operation(summary = "Diffuser une notification à tous les membres actifs")
    public ResponseEntity<Void> diffuser(@Valid @RequestBody NotificationGlobale annonce) {
        String lien = annonce.lien() == null || annonce.lien().isBlank() ? null : annonce.lien();
        notifications.diffuser(annonce.titre().trim(), annonce.message().trim(), lien);
        return ResponseEntity.noContent().build();
    }
}
