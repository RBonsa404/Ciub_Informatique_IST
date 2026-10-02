package com.clubinfo.ist.contenu;

import com.clubinfo.ist.support.IntegrationTest;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Pages d'information, bureau, catégories, actualités et annonces, ressources publiques. */
class ContenusPublicsIT extends IntegrationTest {

    @Autowired
    private JdbcTemplate jdbc;

    private static String unique(String base) {
        return base + " " + System.nanoTime();
    }

    private Map<String, Object> actualite(String titre, boolean publie, String visibilite) {
        Map<String, Object> corps = new HashMap<>();
        corps.put("titre", titre);
        corps.put("contenu", "Le club ouvre les inscriptions de la rentrée.");
        corps.put("resume", "Inscriptions ouvertes.");
        corps.put("publie", publie);
        corps.put("visibilite", visibilite);
        return corps;
    }

    private JsonNode creer(Utilisateur responsable, Map<String, Object> corps) throws Exception {
        MvcResult resultat = mvc.perform(en(corps(post("/actualites"), corps), responsable)).andExpect(status().isCreated()).andReturn();
        return json.readTree(resultat.getResponse().getContentAsString());
    }

    // ---------------------------------------------------------------- Données de référence

    @Test
    @DisplayName("B-38 : sur une base neuve, ni page ni catégorie inventée ; libellés des permissions accentués")
    void referenceNettoyee() throws Exception {
        assertThat(jdbc.queryForObject("select count(*) from page_info where slug = 'bureau'", Integer.class)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from page_info where contenu like '%vocation de promouvoir%'", Integer.class)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from categorie where nom like 'Developpement%' or nom like 'Cybersecurite%'", Integer.class)).isZero();
        assertThat(jdbc.queryForList("select libelle from permission", String.class))
                .contains("Créer une formation", "Consulter les événements", "Gérer les comptes utilisateurs")
                .noneMatch(libelle -> libelle.contains("Creer") || libelle.contains("evenement") || libelle.contains("Gerer"));
        assertThat(jdbc.queryForList("select description from role", String.class))
                .noneMatch(description -> description.contains(" d ateliers") || description.contains("executif") || description.contains("acces"));
    }

    @Test
    @DisplayName("B-19 : le point d'accès des statistiques publiques n'existe plus")
    void statistiquesPubliquesRetirees() throws Exception {
        mvc.perform(get("/statistiques/publiques")).andExpect(status().is4xxClientError());
        mvc.perform(en(get("/statistiques/publiques"), compte("ADMIN"))).andExpect(status().isNotFound());
    }

    // ---------------------------------------------------------------- Pages

    @Test
    @DisplayName("Pages d'information : absentes tant que le club ne les a pas rédigées, puis lues telles qu'enregistrées")
    void pagesDInformation() throws Exception {
        String slug = "presentation";
        jdbc.update("delete from page_info where slug = ?", slug);
        mvc.perform(get("/pages/" + slug)).andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("INTROUVABLE"));

        Map<String, Object> page = Map.of("titre", "Présentation du club", "contenu", "Texte rédigé par le bureau.");
        mvc.perform(corps(put("/pages/" + slug), page)).andExpect(status().isUnauthorized());
        mvc.perform(en(corps(put("/pages/" + slug), page), compte("MEMBRE"))).andExpect(status().isForbidden());
        mvc.perform(en(corps(put("/pages/page-libre"), page), compte("ADMIN"))).andExpect(status().isNotFound());
        mvc.perform(en(corps(put("/pages/" + slug), page), compte("ADMIN"))).andExpect(status().isOk());

        mvc.perform(get("/pages/" + slug))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug").value(slug))
                .andExpect(jsonPath("$.titre").value("Présentation du club"))
                .andExpect(jsonPath("$.contenu").value("Texte rédigé par le bureau."))
                .andExpect(jsonPath("$.updatedAt").isString())
                .andExpect(jsonPath("$.modifieParId").doesNotExist())
                .andExpect(jsonPath("$.modifieParNom").doesNotExist());
    }

    // ---------------------------------------------------------------- Bureau

    @Test
    @DisplayName("Bureau : composition tenue par le Responsable, publiée dans l'ordre d'affichage, sans photo")
    void bureau() throws Exception {
        jdbc.update("delete from membre_bureau");
        mvc.perform(get("/bureau")).andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());

        Utilisateur responsable = compte("RESPONSABLE_CLUB");
        Map<String, Object> secretaire = Map.of("nom", "Ouédraogo", "prenom", "Issouf", "fonction", "Secrétaire général", "filiere", "Génie logiciel", "ordre", 2);
        Map<String, Object> presidente = Map.of("nom", "Sawadogo", "prenom", "Aminata", "fonction", "Présidente", "ordre", 1);
        mvc.perform(corps(post("/bureau"), presidente)).andExpect(status().isUnauthorized());
        mvc.perform(en(corps(post("/bureau"), presidente), compte("MEMBRE"))).andExpect(status().isForbidden());
        long idSecretaire = json.readTree(mvc.perform(en(corps(post("/bureau"), secretaire), responsable))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).path("id").asLong();
        mvc.perform(en(corps(post("/bureau"), presidente), responsable)).andExpect(status().isCreated());
        mvc.perform(en(corps(post("/bureau"), Map.of("nom", "", "prenom", "Awa", "fonction", "Trésorière", "ordre", 3)), responsable))
                .andExpect(status().isBadRequest());

        mvc.perform(get("/bureau"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].fonction").value("Présidente"))
                .andExpect(jsonPath("$[0].filiere").doesNotExist())
                .andExpect(jsonPath("$[1].nom").value("Ouédraogo"))
                .andExpect(jsonPath("$[1].filiere").value("Génie logiciel"))
                .andExpect(jsonPath("$[0].photo").doesNotExist());

        mvc.perform(en(corps(put("/bureau/" + idSecretaire), Map.of("nom", "Ouédraogo", "prenom", "Issouf", "fonction", "Vice-président", "ordre", 0)), responsable))
                .andExpect(status().isOk()).andExpect(jsonPath("$.fonction").value("Vice-président"));
        mvc.perform(get("/bureau")).andExpect(jsonPath("$[0].fonction").value("Vice-président"));

        mvc.perform(en(delete("/bureau/" + idSecretaire), responsable)).andExpect(status().isNoContent());
        mvc.perform(en(delete("/bureau/" + idSecretaire), responsable)).andExpect(status().isNotFound());
        mvc.perform(get("/bureau")).andExpect(jsonPath("$.length()").value(1));
    }

    // ---------------------------------------------------------------- Catégories

    @Test
    @DisplayName("B-24 : catégories gérées par l'administration ; identifiant d'adresse stable ; suppression refusée si la catégorie sert")
    void categories() throws Exception {
        Utilisateur admin = compte("ADMIN");
        String nom = unique("Réseaux & systèmes");
        mvc.perform(en(corps(post("/categories"), Map.of("nom", nom)), compte("RESPONSABLE_CLUB"))).andExpect(status().isForbidden());
        JsonNode creee = json.readTree(mvc.perform(en(corps(post("/categories"), Map.of("nom", nom, "couleur", "#2563EB")), admin))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        assertThat(creee.path("slug").asText()).matches("reseaux-systemes-\\d+");
        mvc.perform(en(corps(post("/categories"), Map.of("nom", nom)), admin)).andExpect(status().isConflict());

        // Deux noms distincts qui donnent le même identifiant d'adresse : le second reçoit un suffixe, sans recours à l'horloge.
        JsonNode seconde = json.readTree(mvc.perform(en(corps(post("/categories"), Map.of("nom", nom.replace("&", "/"))), admin))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        assertThat(seconde.path("slug").asText()).isEqualTo(creee.path("slug").asText() + "-2");

        mvc.perform(get("/categories")).andExpect(status().isOk()).andExpect(jsonPath("$[*].nom", hasItem(nom)));

        Map<String, Object> rattachee = actualite(unique("Actualité classée"), true, "PUBLIC");
        rattachee.put("categorieId", creee.path("id").asLong());
        creer(compte("RESPONSABLE_CLUB"), rattachee);
        mvc.perform(en(delete("/categories/" + creee.path("id").asLong()), admin))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("CATEGORIE_UTILISEE"));
        mvc.perform(en(delete("/categories/" + seconde.path("id").asLong()), admin)).andExpect(status().isNoContent());
        mvc.perform(get("/categories")).andExpect(jsonPath("$[*].id", not(hasItem(seconde.path("id").asInt()))));
    }

    // ---------------------------------------------------------------- Actualités

    @Test
    @DisplayName("B-08 : un brouillon n'est lisible ni dans la liste, ni par son adresse, ni par son identifiant sans droit de gestion")
    void brouillonNonPublic() throws Exception {
        Utilisateur responsable = compte("RESPONSABLE_CLUB");
        String titre = unique("Brouillon de rentrée");
        JsonNode brouillon = creer(responsable, actualite(titre, false, "PUBLIC"));
        assertThat(brouillon.path("publie").asBoolean()).isFalse();
        assertThat(brouillon.path("datePublication").isMissingNode() || brouillon.path("datePublication").isNull()).isTrue();
        String slug = brouillon.path("slug").asText();
        long id = brouillon.path("id").asLong();

        mvc.perform(get("/actualites").param("search", titre)).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/actualites/slug/" + slug)).andExpect(status().isNotFound());
        mvc.perform(get("/actualites/" + id)).andExpect(status().isUnauthorized());
        mvc.perform(en(get("/actualites/" + id), compte("MEMBRE"))).andExpect(status().isForbidden());
        mvc.perform(en(get("/actualites/" + id), responsable)).andExpect(status().isOk()).andExpect(jsonPath("$.titre").value(titre));
        mvc.perform(en(get("/gestion/actualites").param("publie", "false").param("size", "200"), responsable))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].id", hasItem((int) id)))
                .andExpect(jsonPath("$.content[*].publie", everyItem(is(false))));
        mvc.perform(en(get("/gestion/actualites"), compte("MEMBRE"))).andExpect(status().isForbidden());
        mvc.perform(get("/actualites/admin/all")).andExpect(status().is4xxClientError());

        mvc.perform(en(corps(patch("/actualites/" + id + "/publication"), Map.of("publie", true)), responsable))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publie").value(true))
                .andExpect(jsonPath("$.datePublication").isString());
        mvc.perform(en(corps(patch("/actualites/" + id + "/publication"), Map.of("publie", true)), responsable))
                .andExpect(jsonPath("$.publie").value(true));
        mvc.perform(get("/actualites/slug/" + slug))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.visibilite").value("PUBLIC"))
                .andExpect(jsonPath("$.auteurNom").isString())
                .andExpect(jsonPath("$.auteurId").doesNotExist());

        mvc.perform(en(delete("/actualites/" + id), responsable)).andExpect(status().isNoContent());
        mvc.perform(get("/actualites/slug/" + slug)).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Une annonce réservée aux membres n'apparaît jamais dans les contenus publics")
    void annonceReserveeAuxMembres() throws Exception {
        Utilisateur responsable = compte("RESPONSABLE_CLUB");
        String titre = unique("Annonce interne");
        String slug = creer(responsable, actualite(titre, true, "MEMBRES")).path("slug").asText();
        String titrePublic = unique("Actualité ouverte");
        String slugPublic = creer(responsable, actualite(titrePublic, true, "PUBLIC")).path("slug").asText();

        mvc.perform(get("/actualites").param("search", titre)).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/actualites/slug/" + slug)).andExpect(status().isNotFound());
        mvc.perform(get("/publications")).andExpect(status().isUnauthorized());

        Utilisateur membre = compte("MEMBRE");
        mvc.perform(en(get("/publications").param("size", "200"), membre))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].titre", hasItem(titre)))
                .andExpect(jsonPath("$.content[*].titre", not(hasItem(titrePublic))))
                .andExpect(jsonPath("$.content[*].visibilite", everyItem(is("MEMBRES"))));
        mvc.perform(en(get("/publications/slug/" + slug), membre)).andExpect(status().isOk()).andExpect(jsonPath("$.titre").value(titre));
        mvc.perform(en(get("/publications/slug/" + slugPublic), membre)).andExpect(status().isNotFound());
        mvc.perform(get("/actualites").param("search", titrePublic)).andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("Saisie d'une actualité : champs obligatoires, visibilité connue, adresse d'image sûre, titres homonymes distingués")
    void saisieDActualite() throws Exception {
        Utilisateur responsable = compte("RESPONSABLE_CLUB");
        mvc.perform(en(corps(post("/actualites"), actualite("", true, "PUBLIC")), responsable))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[*].field", hasItem("titre")));
        mvc.perform(en(corps(post("/actualites"), actualite(unique("Titre"), true, "SECRET")), responsable)).andExpect(status().isBadRequest());
        Map<String, Object> imageDangereuse = actualite(unique("Titre"), true, "PUBLIC");
        imageDangereuse.put("image", "javascript:alert(1)");
        mvc.perform(en(corps(post("/actualites"), imageDangereuse), responsable))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[*].field", hasItem("image")));
        mvc.perform(en(corps(post("/actualites"), actualite(unique("Titre"), true, "PUBLIC")), compte("FORMATEUR"))).andExpect(status().isForbidden());

        String titre = unique("Hackathon de novembre");
        String premier = creer(responsable, actualite(titre, true, "PUBLIC")).path("slug").asText();
        String second = creer(responsable, actualite(titre, true, "PUBLIC")).path("slug").asText();
        assertThat(second).isEqualTo(premier + "-2");

        long id = creer(responsable, actualite(unique("À modifier"), false, "PUBLIC")).path("id").asLong();
        Map<String, Object> modification = actualite(unique("Modifiée"), false, "MEMBRES");
        mvc.perform(en(corps(put("/actualites/" + id), modification), responsable))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.visibilite").value("MEMBRES"))
                .andExpect(jsonPath("$.titre").value(modification.get("titre")));
    }

    @Test
    @DisplayName("L'image d'une actualité publiée devient lisible par ses lecteurs")
    void imageOuverteALaPublication() throws Exception {
        Utilisateur responsable = compte("RESPONSABLE_CLUB");
        byte[] png = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0x0D, 'I', 'H', 'D', 'R'};
        String url = json.readTree(mvc.perform(en(multipart("/fichiers").file(new MockMultipartFile("fichier", "couverture.png", "image/png", png)), responsable))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).path("url").asText();
        String chemin = url.replaceFirst("^/api/v1", "");
        mvc.perform(get(chemin)).andExpect(status().isUnauthorized());

        Map<String, Object> corps = actualite(unique("Avec couverture"), false, "PUBLIC");
        corps.put("image", url);
        long id = creer(responsable, corps).path("id").asLong();
        mvc.perform(get(chemin)).andExpect(status().isUnauthorized());

        mvc.perform(en(corps(patch("/actualites/" + id + "/publication"), Map.of("publie", true)), responsable)).andExpect(status().isOk());
        mvc.perform(get(chemin)).andExpect(status().isOk());
    }

    @Test
    @DisplayName("8.7.6 : les contenus publics portent un ETag et répondent 304 quand rien n'a changé")
    void cacheConditionnel() throws Exception {
        creer(compte("RESPONSABLE_CLUB"), actualite(unique("Pour le cache"), true, "PUBLIC"));
        MvcResult premiere = mvc.perform(get("/actualites").param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(header().exists("ETag"))
                .andExpect(header().string("Cache-Control", "no-cache"))
                .andReturn();
        String etag = premiere.getResponse().getHeader("ETag");

        mvc.perform(get("/actualites").param("size", "5").header("If-None-Match", etag)).andExpect(status().isNotModified());
        creer(compte("RESPONSABLE_CLUB"), actualite(unique("Plus récente"), true, "PUBLIC"));
        mvc.perform(get("/actualites").param("size", "5").header("If-None-Match", etag)).andExpect(status().isOk());
        mvc.perform(get("/categories")).andExpect(header().exists("ETag"));
        mvc.perform(get("/bureau")).andExpect(header().exists("ETag"));
    }

    // ---------------------------------------------------------------- Ressources

    @Test
    @DisplayName("Ressources publiques : seules les ressources publiques sont listées, avec filtre par type")
    void ressourcesPubliques() throws Exception {
        Utilisateur formateur = compte("FORMATEUR");
        String titre = unique("Mémo Git");
        Map<String, Object> publique = new HashMap<>(Map.of("titre", titre, "type", "LIEN_EXTERNE", "urlFichier", "https://git-scm.com/book/fr/v2", "estPublique", true));
        Map<String, Object> reservee = new HashMap<>(Map.of("titre", titre + " (réservé)", "type", "DOCUMENT_PDF", "urlFichier", "https://exemple.test/interne.pdf", "estPublique", false));
        mvc.perform(en(corps(post("/ressources"), publique), formateur)).andExpect(status().isCreated());
        mvc.perform(en(corps(post("/ressources"), reservee), formateur)).andExpect(status().isCreated());

        mvc.perform(get("/ressources/publiques").param("search", titre))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].titre").value(titre))
                .andExpect(jsonPath("$.content[0].auteurId").doesNotExist());
        mvc.perform(get("/ressources/publiques").param("search", titre).param("type", "VIDEO")).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/ressources/publiques").param("type", "INCONNU")).andExpect(status().isBadRequest());

        Map<String, Object> dangereuse = new HashMap<>(publique);
        dangereuse.put("urlFichier", "javascript:alert(1)");
        mvc.perform(en(corps(post("/ressources"), dangereuse), formateur)).andExpect(status().isBadRequest());
    }
}
