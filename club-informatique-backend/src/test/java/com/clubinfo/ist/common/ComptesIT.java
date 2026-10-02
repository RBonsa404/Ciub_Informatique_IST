package com.clubinfo.ist.common;

import com.clubinfo.ist.admin.repository.AuditLogRepository;
import com.clubinfo.ist.common.amorcage.ComptesDeTestService;
import com.clubinfo.ist.common.amorcage.SuperAdminAmorcage;
import com.clubinfo.ist.common.journal.JournalService;
import com.clubinfo.ist.support.IntegrationTest;
import com.clubinfo.ist.user.entity.StatutUtilisateur;
import com.clubinfo.ist.user.entity.Utilisateur;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Comptes techniques : compte amorcé par l'ancienne migration, premier Super Admin réel, comptes de test, journal. */
class ComptesIT extends IntegrationTest {

    private static final String ANCIEN_COMPTE = "admin@clubinfo-ist.ci";

    @Autowired
    private SuperAdminAmorcage amorcage;
    @Autowired
    private ComptesDeTestService comptesDeTest;
    @Autowired
    private JournalService journal;
    @Autowired
    private AuditLogRepository journalEntrees;
    @Autowired
    private JdbcTemplate jdbc;

    @Test
    @DisplayName("B-01, B-31 : le compte créé par la migration V2 n'existe plus comme compte utilisable")
    void compteAmorceNeutralise() throws Exception {
        assertThat(utilisateurs.findByEmail(ANCIEN_COMPTE)).isEmpty();
        Integer roles = jdbc.queryForObject(
                "select count(*) from utilisateur_role ur join utilisateur u on u.id = ur.utilisateur_id where u.email like ?", Integer.class, ANCIEN_COMPTE + "%");
        assertThat(roles).isZero();
        mvc.perform(corps(post("/auth/login"), Map.of("email", ANCIEN_COMPTE, "motDePasse", "Admin@IST2026!")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("8.7.9 : le premier Super Admin réel est créé une seule fois, avec changement de mot de passe imposé")
    void amorcageDuSuperAdmin() {
        jdbc.update("delete from utilisateur_role where role_id = (select id from role where nom = 'ROLE_SUPER_ADMIN')");

        assertThat(amorcage.amorcer("Premier.Admin@essai.invalid", "Initial@2026xy")).isTrue();
        Utilisateur cree = utilisateurs.findByEmail("premier.admin@essai.invalid").orElseThrow();
        assertThat(cree.getRoles()).extracting("nom").contains("ROLE_SUPER_ADMIN", "ROLE_ADMIN");
        assertThat(cree.getChangementMotDePasseRequis()).isTrue();
        assertThat(cree.getTest()).isFalse();
        assertThat(cree.getStatut()).isEqualTo(StatutUtilisateur.ACTIF);
        assertThat(passwordEncoder.matches("Initial@2026xy", cree.getMotDePasse())).isTrue();

        assertThat(amorcage.amorcer("second.admin@essai.invalid", "Initial@2026xy")).isFalse();
        assertThat(utilisateurs.findByEmail("second.admin@essai.invalid")).isEmpty();
    }

    @Test
    @DisplayName("8.7.9 : sans adresse ni mot de passe initial, aucun compte n'est créé")
    void amorcageSansConfiguration() {
        assertThat(amorcage.amorcer("", "")).isFalse();
        assertThat(amorcage.amorcer("admin@essai.invalid", "court")).isFalse();
    }

    @Test
    @DisplayName("8.9 : les comptes de test sont marqués, sur le domaine .invalid, et retirables en une commande")
    void comptesDeTest() {
        // D'autres tests ont pu laisser des comptes marqués « test » : on repart d'une base qui n'en a aucun.
        comptesDeTest.purger();
        int crees = comptesDeTest.creer("Recette@2026x");
        assertThat(crees).isEqualTo(6);
        assertThat(comptesDeTest.creer("Recette@2026x")).isZero();

        Optional<Utilisateur> membre = utilisateurs.findByEmail("aminata.sawadogo@recette.invalid");
        assertThat(membre).isPresent();
        assertThat(membre.get().getTest()).isTrue();
        Integer horsDomaine = jdbc.queryForObject("select count(*) from utilisateur where test and email not like '%.invalid'", Integer.class);
        assertThat(horsDomaine).isZero();

        Utilisateur reel = compte("MEMBRE");
        int retires = comptesDeTest.purger();
        assertThat(retires).isEqualTo(6);
        assertThat(jdbc.queryForObject("select count(*) from utilisateur where test", Integer.class)).isZero();
        assertThat(utilisateurs.findById(reel.getId())).isPresent();
    }

    @Test
    @DisplayName("B-23, B-26 : le journal est restitué par un DTO paginé, filtrable par compte et par résultat")
    void journalFiltrable() throws Exception {
        Utilisateur admin = compte("ADMIN");
        String marque = "essai-" + System.nanoTime();
        journal.enregistrer("ESSAI_JOURNAL", marque, marque + "@essai.invalid", JournalService.Resultat.SUCCES);
        journal.enregistrer("ESSAI_JOURNAL", marque, marque + "@essai.invalid", JournalService.Resultat.ECHEC);
        journal.enregistrer("ESSAI_JOURNAL", "autre compte", "autre@essai.invalid", JournalService.Resultat.ECHEC);

        mvc.perform(en(get("/admin/security/audit-logs").param("utilisateur", marque).param("statut", "ECHEC"), admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].action").value("ESSAI_JOURNAL"))
                .andExpect(jsonPath("$.content[0].statut").value("ECHEC"))
                .andExpect(jsonPath("$.content[0].utilisateurEmail").value(marque + "@essai.invalid"))
                .andExpect(jsonPath("$.content[0].dateAction").isString())
                .andExpect(jsonPath("$.content[0].entiteConcernee").doesNotExist());

        mvc.perform(en(get("/admin/security/audit-logs").param("utilisateur", marque), admin))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[*].utilisateurEmail", everyItem(is(marque + "@essai.invalid"))));
    }

    @Test
    @DisplayName("B-26 : la purge des comptes de test est journalisée")
    void purgeJournalisee() {
        comptesDeTest.creer("Recette@2026x");
        long avant = journalEntrees.count();
        comptesDeTest.purger();
        assertThat(journalEntrees.count()).isGreaterThan(avant);
        assertThat(journalEntrees.findAll()).extracting("action").contains("PURGE_COMPTES_DE_TEST");
    }

    @Test
    @DisplayName("Le journal de la DSI est réservé à la DSI et suit le même format")
    void journalDeLaDsi() throws Exception {
        journal.enregistrer("ESSAI_DSI", "entrée d'essai", "dsi@essai.invalid", JournalService.Resultat.SUCCES);
        mvc.perform(en(get("/dsi/conformite/logs"), compte("MEMBRE"))).andExpect(status().isForbidden());
        mvc.perform(en(get("/dsi/conformite/logs").param("size", "50"), compte("DSI")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].action", hasItem("ESSAI_DSI")));
    }
}
