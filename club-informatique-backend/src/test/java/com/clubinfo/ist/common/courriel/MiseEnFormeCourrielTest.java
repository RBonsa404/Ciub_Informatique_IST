package com.clubinfo.ist.common.courriel;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MiseEnFormeCourrielTest {

    private static final String TEXTE = """
            Bonjour Awa,

            Pour activer votre compte, ouvrez ce lien :

            https://informatique.ist-club.bf/verification-adresse?jeton=abc-123

            Pour vous connecter : https://informatique.ist-club.bf/connexion.

            -- \nClub Informatique de l'IST
            contact@informatique.ist-club.bf
            """;

    @Test
    @DisplayName("Une adresse seule sur sa ligne devient un bouton au libellé adapté, l'adresse restant affichée")
    void bouton() {
        String html = MiseEnFormeCourriel.html(TEXTE, "Club Informatique de l'IST");
        assertThat(html).contains("href=\"https://informatique.ist-club.bf/verification-adresse?jeton=abc-123\"")
                .contains(">Confirmer mon adresse</a>")
                .contains("copiez cette adresse");
    }

    @Test
    @DisplayName("Une adresse dans une phrase devient un lien, sans emporter la ponctuation finale")
    void lienDansLeTexte() {
        String html = MiseEnFormeCourriel.html(TEXTE, "Club");
        assertThat(html).contains("<a href=\"https://informatique.ist-club.bf/connexion\"");
    }

    @Test
    @DisplayName("Le texte est échappé : aucune balise ne peut être injectée par un contenu")
    void echappement() {
        String html = MiseEnFormeCourriel.html("Message : <script>alert(1)</script> & \"guillemets\"", "Club <b>");
        assertThat(html).doesNotContain("<script>").doesNotContain("Club <b>")
                .contains("&lt;script&gt;").contains("&amp;").contains("&quot;guillemets&quot;");
    }
}
