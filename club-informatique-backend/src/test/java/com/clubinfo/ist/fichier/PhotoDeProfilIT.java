package com.clubinfo.ist.fichier;

import com.clubinfo.ist.support.IntegrationTest;
import com.clubinfo.ist.user.entity.Utilisateur;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Photo de profil : image de taille modeste, déposée par le titulaire, visible des seuls utilisateurs connectés. */
class PhotoDeProfilIT extends IntegrationTest {

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0x0D, 'I', 'H', 'D', 'R'};
    private static final byte[] PDF = "%PDF-1.4\n%%EOF\n".getBytes(StandardCharsets.ISO_8859_1);

    private static MockMultipartFile piece(String nom, String type, byte[] contenu) {
        return new MockMultipartFile("fichier", nom, type, contenu);
    }

    private String deposer(Utilisateur compte, String nom) throws Exception {
        String reponse = mvc.perform(en(multipart("/users/me/photo").file(piece(nom, "image/png", PNG)), compte))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String photo = json.readTree(reponse).path("photo").asText();
        assertThat(photo).matches("/api/v1/fichiers/[0-9a-f-]{36}");
        return photo.substring("/api/v1".length());
    }

    @Test
    @DisplayName("12.3 : un membre dépose sa photo ; le profil la désigne, un autre membre la voit, un visiteur non")
    void depotEtLecture() throws Exception {
        Utilisateur membre = compte("MEMBRE");
        mvc.perform(en(get("/users/me"), membre)).andExpect(status().isOk()).andExpect(jsonPath("$.photo").doesNotExist());

        String photo = deposer(membre, "portrait.png");

        mvc.perform(en(get("/users/me"), membre)).andExpect(jsonPath("$.photo").value("/api/v1" + photo));
        mvc.perform(en(get(photo), membre)).andExpect(status().isOk()).andExpect(content().contentType("image/png")).andExpect(content().bytes(PNG));
        mvc.perform(en(get(photo), compte("MEMBRE"))).andExpect(status().isOk());
        mvc.perform(get(photo)).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Une nouvelle photo remplace la précédente, qui disparaît du stockage ; le retrait efface la photo")
    void remplacementEtRetrait() throws Exception {
        Utilisateur membre = compte("MEMBRE");
        String premiere = deposer(membre, "premiere.png");
        String seconde = deposer(membre, "seconde.png");
        assertThat(seconde).isNotEqualTo(premiere);

        mvc.perform(en(get(premiere), membre)).andExpect(status().isNotFound());
        mvc.perform(en(get(seconde), membre)).andExpect(status().isOk());

        mvc.perform(en(delete("/users/me/photo"), membre)).andExpect(status().isOk()).andExpect(jsonPath("$.photo").doesNotExist());
        mvc.perform(en(get(seconde), membre)).andExpect(status().isNotFound());
        mvc.perform(en(get("/users/me"), membre)).andExpect(jsonPath("$.photo").doesNotExist());
    }

    @Test
    @DisplayName("Seule une image de 2 Mo au plus est acceptée ; le dépôt exige une session")
    void controles() throws Exception {
        Utilisateur membre = compte("MEMBRE");
        mvc.perform(en(multipart("/users/me/photo").file(piece("document.pdf", "application/pdf", PDF)), membre))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.code").value("TYPE_REFUSE"));
        mvc.perform(en(multipart("/users/me/photo").file(piece("portrait.png", "image/png", PDF)), membre))
                .andExpect(status().isUnsupportedMediaType());

        byte[] volumineuse = new byte[2 * 1024 * 1024 + 1];
        System.arraycopy(PNG, 0, volumineuse, 0, PNG.length);
        mvc.perform(en(multipart("/users/me/photo").file(piece("portrait.png", "image/png", volumineuse)), membre))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(jsonPath("$.code").value("FICHIER_TROP_VOLUMINEUX"));

        mvc.perform(multipart("/users/me/photo").file(piece("portrait.png", "image/png", PNG))).andExpect(status().isUnauthorized());
        mvc.perform(en(get("/users/me"), membre)).andExpect(jsonPath("$.photo").doesNotExist());
    }
}
