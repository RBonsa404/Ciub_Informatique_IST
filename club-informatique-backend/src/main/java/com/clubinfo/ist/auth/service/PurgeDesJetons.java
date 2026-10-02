package com.clubinfo.ist.auth.service;

import com.clubinfo.ist.auth.repository.JetonUsageUniqueRepository;
import com.clubinfo.ist.auth.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/** Retire chaque nuit les sessions et les jetons expirés depuis plus d'une semaine : les tables ne grossissent pas sans fin. */
@Component
@RequiredArgsConstructor
@Slf4j
public class PurgeDesJetons {

    private static final int JOURS_DE_CONSERVATION = 7;

    private final RefreshTokenRepository sessions;
    private final JetonUsageUniqueRepository jetons;

    @Scheduled(cron = "${app.purge.cron:0 30 2 * * *}")
    @Transactional
    public int purger() {
        LocalDateTime limite = LocalDateTime.now().minusDays(JOURS_DE_CONSERVATION);
        int retires = sessions.purgerExpirees(limite) + jetons.purgerExpires(limite);
        if (retires > 0) {
            log.info("{} session(s) et jeton(s) expirés retirés", retires);
        }
        return retires;
    }
}
