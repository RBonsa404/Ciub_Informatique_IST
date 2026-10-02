package com.clubinfo.ist.common.amorcage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Opérations de démarrage sur les comptes techniques, toutes pilotées par l'environnement :
 * retrait des comptes de test, création des comptes de test, création du premier Super Admin réel.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AmorcageAuDemarrage implements ApplicationRunner {

    private final SuperAdminAmorcage superAdmin;
    private final ComptesDeTestService comptesDeTest;

    @Value("${app.bootstrap.admin-email:}")
    private String adresseAdmin;
    @Value("${app.bootstrap.admin-password:}")
    private String motDePasseAdmin;
    @Value("${app.test-accounts.seed:false}")
    private boolean creerComptesDeTest;
    @Value("${app.test-accounts.purge:false}")
    private boolean retirerComptesDeTest;
    @Value("${app.test-accounts.password:}")
    private String motDePasseDeTest;

    @Override
    public void run(ApplicationArguments arguments) {
        if (retirerComptesDeTest) {
            comptesDeTest.purger();
        } else if (creerComptesDeTest) {
            if (motDePasseDeTest.isBlank()) {
                log.error("Comptes de test non créés : APP_TEST_ACCOUNTS_PASSWORD est vide.");
            } else {
                comptesDeTest.creer(motDePasseDeTest);
            }
        }
        superAdmin.amorcer(adresseAdmin, motDePasseAdmin);
    }
}
