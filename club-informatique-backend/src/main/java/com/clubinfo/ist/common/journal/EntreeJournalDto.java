package com.clubinfo.ist.common.journal;

import com.clubinfo.ist.admin.entity.AuditLog;

import java.time.LocalDateTime;

/** Entrée du journal telle que l'API la restitue. */
public record EntreeJournalDto(Long id, String action, String description, String utilisateurEmail, String ipAddress,
                               LocalDateTime dateAction, String statut) {

    public static EntreeJournalDto de(AuditLog entree) {
        return new EntreeJournalDto(entree.getId(), entree.getAction(), entree.getDescription(), entree.getUtilisateurEmail(),
                entree.getIpAddress(), entree.getDateAction(), entree.getStatut());
    }
}
