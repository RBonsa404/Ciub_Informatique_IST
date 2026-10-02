package com.clubinfo.ist.fichier;

import com.clubinfo.ist.common.amorcage.ComptesDeTestService;
import com.clubinfo.ist.support.IntegrationTest;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Dépôt et téléchargement de fichiers : types contrôlés par la signature binaire, noms aléatoires, accès vérifié. */
class FichiersIT extends IntegrationTest {

    private static final byte[] PDF = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n".getBytes(StandardCharsets.ISO_8859_1);
    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0x0D, 'I', 'H', 'D', 'R'};
    private static final byte[] EXECUTABLE = {'M', 'Z', (byte) 0x90, 0, 3, 0, 0, 0, 4, 0, 0, 0};

    @Autowired
    private ComptesDeTestService comptesDeTest;

    @Value("${app.storage.local.directory}")
    private String dossier;

    private static MockMultipartFile piece(String nom, String type, byte[] contenu) {
        return new MockMultipartFile("fichier", nom, type, contenu);
    }

    private JsonNode deposer(Utilisateur compte, MockMultipartFile piece) throws Exception {
        MvcResult resultat = mvc.perform(en(multipart("/fichiers").file(piece), compte)).andExpect(status().isCreated()).andReturn();
        return json.readTree(resultat.getResponse().getContentAsString());
    }

    @Test
    @DisplayName("Un formateur dépose un PDF : métadonnées renvoyées, contenu restitué à l'identique")
    void depotEtTelechargement() throws Exception {
        Utilisateur formateur = compte("FORMATEUR");

        JsonNode depose = deposer(formateur, piece("Support séance 1.pdf", "application/pdf", PDF));
        String id = depose.path("id").asText();
        assertThat(id).hasSize(36);
        assertThat(depose.path("url").asText()).isEqualTo("/api/v1/fichiers/" + id);
        assertThat(depose.path("nom").asText()).isEqualTo("Support séance 1.pdf");
        assertThat(depose.path("type").asText()).isEqualTo("application/pdf");
        assertThat(depose.path("tailleOctets").asLong()).isEqualTo(PDF.length);

        mvc.perform(en(get("/fichiers/" + id), formateur))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/pdf"))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.startsWith("attachment")))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(content().bytes(PDF));
    }

    @Test
    @DisplayName("Le fichier est conservé sous un nom aléatoire, hors de toute racine publique")
    void nomAleatoireSurLeDisque() throws Exception {
        JsonNode depose = deposer(compte("FORMATEUR"), piece("../../Consigne du devoir.pdf", "application/pdf", PDF));
        assertThat(depose.path("nom").asText()).isEqualTo("Consigne du devoir.pdf");

        Path racine = Path.of(dossier).toAbsolutePath().normalize();
        try (Stream<Path> fichiers = Files.walk(racine)) {
            List<Path> conserves = fichiers.filter(Files::isRegularFile).toList();
            assertThat(conserves).isNotEmpty().allSatisfy(chemin -> {
                assertThat(chemin.normalize().startsWith(racine)).isTrue();
                assertThat(chemin.getFileName().toString()).doesNotContain("Consigne").doesNotContain(".pdf");
            });
        }
    }

    @Test
    @DisplayName("Le type vient du contenu : une extension ou un type déclaré trompeurs sont refusés (415)")
    void signatureControlee() throws Exception {
        Utilisateur formateur = compte("FORMATEUR");
        mvc.perform(en(multipart("/fichiers").file(piece("support.pdf", "application/pdf", EXECUTABLE)), formateur))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("TYPE_REFUSE"));
        mvc.perform(en(multipart("/fichiers").file(piece("outil.exe", "application/octet-stream", EXECUTABLE)), formateur))
                .andExpect(status().isUnsupportedMediaType());
        mvc.perform(en(multipart("/fichiers").file(piece("image.pdf", "application/pdf", PNG)), formateur))
                .andExpect(status().isUnsupportedMediaType());
        mvc.perform(en(multipart("/fichiers").file(piece("page.html", "text/html", "<script>alert(1)</script>".getBytes(StandardCharsets.UTF_8))), formateur))
                .andExpect(status().isUnsupportedMediaType());
    }

    @Test
    @DisplayName("Un fichier vide ou trop volumineux est refusé")
    void tailleControlee() throws Exception {
        Utilisateur formateur = compte("FORMATEUR");
        mvc.perform(en(multipart("/fichiers").file(piece("vide.pdf", "application/pdf", new byte[0])), formateur))
                .andExpect(status().isBadRequest());

        byte[] volumineux = new byte[10 * 1024 * 1024 + 1];
        System.arraycopy(PDF, 0, volumineux, 0, PDF.length);
        mvc.perform(en(multipart("/fichiers").file(piece("volumineux.pdf", "application/pdf", volumineux)), formateur))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(jsonPath("$.code").value("FICHIER_TROP_VOLUMINEUX"));
    }

    @Test
    @DisplayName("Le dépôt est réservé aux formateurs et aux responsables")
    void depotReserve() throws Exception {
        mvc.perform(multipart("/fichiers").file(piece("support.pdf", "application/pdf", PDF))).andExpect(status().isUnauthorized());
        mvc.perform(en(multipart("/fichiers").file(piece("support.pdf", "application/pdf", PDF)), compte("MEMBRE")))
                .andExpect(status().isForbidden());
        deposer(compte("RESPONSABLE_CLUB"), piece("couverture.png", "image/png", PNG));
    }

    @Test
    @DisplayName("Un fichier qui n'est rattaché à rien n'est lisible que par son déposant et par l'administration")
    void accesAuFichierNonRattache() throws Exception {
        Utilisateur formateur = compte("FORMATEUR");
        String id = deposer(formateur, piece("support.pdf", "application/pdf", PDF)).path("id").asText();

        mvc.perform(get("/fichiers/" + id)).andExpect(status().isUnauthorized());
        mvc.perform(en(get("/fichiers/" + id), compte("MEMBRE"))).andExpect(status().isForbidden());
        mvc.perform(en(get("/fichiers/" + id), compte("FORMATEUR"))).andExpect(status().isForbidden());
        mvc.perform(en(get("/fichiers/" + id), compte("ADMIN"))).andExpect(status().isOk());
        mvc.perform(en(get("/fichiers/" + id), formateur)).andExpect(status().isOk());
    }

    @Test
    @DisplayName("8.9.4 : le retrait des comptes de test emporte les fichiers qu'ils ont déposés, contenu compris")
    void retraitAvecLesComptesDeTest() throws Exception {
        Utilisateur formateurDeTest = compte("FORMATEUR");
        formateurDeTest.setTest(true);
        utilisateurs.save(formateurDeTest);
        Utilisateur administrateur = compte("ADMIN");
        String id = deposer(formateurDeTest, piece("support.pdf", "application/pdf", PDF)).path("id").asText();
        String conserve = deposer(compte("FORMATEUR"), piece("support.pdf", "application/pdf", PDF)).path("id").asText();
        long avant = contenusConserves();

        comptesDeTest.purger();

        mvc.perform(en(get("/fichiers/" + id), administrateur)).andExpect(status().isNotFound());
        mvc.perform(en(get("/fichiers/" + conserve), administrateur)).andExpect(status().isOk());
        assertThat(contenusConserves()).isEqualTo(avant - 1);
    }

    private long contenusConserves() throws Exception {
        try (Stream<Path> fichiers = Files.walk(Path.of(dossier))) {
            return fichiers.filter(Files::isRegularFile).count();
        }
    }

    @Test
    @DisplayName("Une image s'affiche dans la page ; un identifiant inconnu renvoie 404")
    void imageEtInconnu() throws Exception {
        Utilisateur responsable = compte("RESPONSABLE_CLUB");
        String id = deposer(responsable, piece("couverture.png", "image/png", PNG)).path("id").asText();
        mvc.perform(en(get("/fichiers/" + id), responsable))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.startsWith("inline")));

        mvc.perform(en(get("/fichiers/00000000-0000-0000-0000-000000000000"), responsable))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("INTROUVABLE"));
        mvc.perform(en(get("/fichiers/..%2F..%2Fapplication.yml"), responsable)).andExpect(status().is4xxClientError());
    }
}
