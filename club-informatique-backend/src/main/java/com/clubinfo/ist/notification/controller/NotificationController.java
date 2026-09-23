package com.clubinfo.ist.notification.controller;

import com.clubinfo.ist.notification.dto.GlobalNotificationCreateDto;
import com.clubinfo.ist.notification.dto.NotificationDto;
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
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Notifications", description = "Endpoints de réception, lecture et diffusion des notifications (UC-13, UC-22)")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Consulter ses notifications avec pagination (UC-13)")
    public ResponseEntity<Page<NotificationDto>> getMyNotifications(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 10) Pageable pageable) {
        Page<NotificationDto> notifications = notificationService.getMyNotifications(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/non-lues/count")
    @Operation(summary = "Compter le nombre de notifications non lues (badge) (UC-13)")
    public ResponseEntity<Map<String, Long>> countUnread(@AuthenticationPrincipal UserDetails userDetails) {
        long count = notificationService.countUnreadNotifications(userDetails.getUsername());
        return ResponseEntity.ok(Map.of("nonLues", count));
    }

    @PutMapping("/{id}/lue")
    @Operation(summary = "Marquer une notification comme lue (UC-13)")
    public ResponseEntity<Map<String, String>> markAsRead(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        notificationService.markAsRead(userDetails.getUsername(), id);
        return ResponseEntity.ok(Map.of("message", "Notification marquée comme lue"));
    }

    @PutMapping("/lire-toutes")
    @Operation(summary = "Marquer toutes ses notifications comme lues (UC-13)")
    public ResponseEntity<Map<String, String>> markAllAsRead(@AuthenticationPrincipal UserDetails userDetails) {
        notificationService.markAllAsRead(userDetails.getUsername());
        return ResponseEntity.ok(Map.of("message", "Toutes les notifications ont été marquées comme lues"));
    }

    @PostMapping("/globales")
    @PreAuthorize("hasAnyRole('RESPONSABLE_CLUB', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Diffuser une notification globale à tous les membres actifs (UC-22)")
    public ResponseEntity<Map<String, String>> broadcastNotification(@Valid @RequestBody GlobalNotificationCreateDto dto) {
        notificationService.broadcastNotification(dto);
        return ResponseEntity.ok(Map.of("message", "Notification globale diffusée avec succès"));
    }
}
