package com.clubinfo.ist.common.journal;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;

/**
 * Durées de conservation annoncées dans la politique de confidentialité : chaque nuit, les messages reçus par le
 * formulaire de contact et les entrées du journal de sécurité de plus de douze mois sont supprimés.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PurgeDesDonneesAnciennes {

    static final int MOIS_DE_CONSERVATION = 12;

    private final JdbcTemplate jdbc;

    @Scheduled(cron = "${app.purge.donnees-cron:0 45 2 * * *}")
    @Transactional
    public int purger() {
        Timestamp limite = Timestamp.valueOf(LocalDateTime.now().minusMonths(MOIS_DE_CONSERVATION));
        int messages = jdbc.update("DELETE FROM message_contact WHERE created_at < ?", limite);
        int journal = jdbc.update("DELETE FROM audit_log WHERE date_action < ?", limite);
        if (messages + journal > 0) {
            log.info("Conservation : {} message(s) de contact et {} entrée(s) de journal de plus de {} mois supprimés",
                    messages, journal, MOIS_DE_CONSERVATION);
        }
        return messages + journal;
    }
}
