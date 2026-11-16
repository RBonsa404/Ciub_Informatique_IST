package com.clubinfo.ist.common.courriel;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Version HTML d'un courriel rédigé en texte brut, jointe au texte dans le même message : chaque adresse web devient
 * un lien cliquable, une adresse seule sur sa ligne devient un bouton (l'adresse reste affichée dessous, en secours).
 * Aucune ressource externe (image, police, feuille de style) : le message s'affiche tel quel dans toutes les messageries.
 */
public final class MiseEnFormeCourriel {

    private static final Pattern ADRESSE_WEB = Pattern.compile("https?://[^\\s<>\"]+[^\\s<>\".,;:!?)]");
    private static final String BLEU_NUIT = "#0B1E3F";
    private static final String BLEU = "#1D4ED8";

    /** Libellé du bouton selon la page visée ; à défaut, « Ouvrir le lien ». */
    private static final List<Map.Entry<String, String>> LIBELLES = List.of(
            Map.entry("/verification-adresse", "Confirmer mon adresse"),
            Map.entry("/reinitialisation", "Choisir mon mot de passe"),
            Map.entry("/mot-de-passe-oublie", "Réinitialiser mon mot de passe"),
            Map.entry("/connexion", "Me connecter"));

    /** Ligne réservant l'emplacement d'une image jointe affichée dans le corps HTML. */
    private static final Pattern IMAGE = Pattern.compile("\\[\\[image:([A-Za-z0-9-]+)]]");

    private MiseEnFormeCourriel() {
    }

    /** Version texte : les emplacements d'image disparaissent (l'image reste jointe au message). */
    public static String texteBrut(String texte) {
        return texte.replaceAll("(?m)^[ \\t]*\\[\\[image:[A-Za-z0-9-]+]][ \\t]*\\R(?:[ \\t]*\\R)?", "");
    }

    public static String html(String texte, String nomExpediteur) {
        StringBuilder corps = new StringBuilder();
        boolean signature = false;
        for (String bloc : texte.strip().split("\\R\\s*\\R")) {
            String contenu = bloc.strip();
            if (contenu.isEmpty()) {
                continue;
            }
            if (contenu.startsWith("--")) {
                signature = true;
                corps.append("<hr style=\"border:none;border-top:1px solid #E2E8F0;margin:28px 0 16px\">");
                contenu = contenu.replaceFirst("^--\\s*", "");
            }
            Matcher image = IMAGE.matcher(contenu);
            if (image.matches()) {
                corps.append("<img src=\"cid:").append(image.group(1))
                        .append("\" alt=\"\" width=\"544\" style=\"display:block;width:100%;max-width:544px;height:auto;border-radius:14px;margin:6px 0 22px\">");
                continue;
            }
            if (!signature && ADRESSE_WEB.matcher(contenu).matches()) {
                corps.append(bouton(contenu));
                continue;
            }
            String style = signature
                    ? "margin:0 0 6px;font-size:13px;line-height:1.6;color:#64748B"
                    : "margin:0 0 16px;font-size:15px;line-height:1.65;color:#1E293B";
            corps.append("<p style=\"").append(style).append("\">").append(enLigne(contenu)).append("</p>");
        }
        return """
                <!DOCTYPE html>
                <html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
                <body style="margin:0;padding:0;background:#F1F5F9">
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:24px 12px">
                <tr><td align="center">
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:12px;overflow:hidden;font-family:Arial,Helvetica,sans-serif">
                <tr><td style="background:%s;padding:20px 28px;color:#FFFFFF;font-size:17px;font-weight:bold">%s</td></tr>
                <tr><td style="padding:28px">%s</td></tr>
                </table>
                </td></tr>
                </table>
                </body></html>
                """.formatted(BLEU_NUIT, echapper(nomExpediteur), corps);
    }

    private static String bouton(String adresse) {
        String lien = echapper(adresse);
        return """
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 12px"><tr>\
                <td style="border-radius:8px;background:%s"><a href="%s" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:bold;color:#FFFFFF;text-decoration:none;border-radius:8px">%s</a></td>\
                </tr></table>\
                <p style="margin:0 0 18px;font-size:12px;line-height:1.5;color:#64748B">Si le bouton ne fonctionne pas, copiez cette adresse dans votre navigateur :<br>\
                <a href="%s" style="color:%s;word-break:break-all">%s</a></p>""".formatted(BLEU, lien, echapper(libelle(adresse)), lien, BLEU, lien);
    }

    private static String libelle(String adresse) {
        return LIBELLES.stream().filter(e -> adresse.contains(e.getKey())).map(Map.Entry::getValue).findFirst().orElse("Ouvrir le lien");
    }

    /** Texte échappé, adresses web en liens, retours à la ligne conservés. */
    private static String enLigne(String texte) {
        StringBuilder resultat = new StringBuilder();
        Matcher adresses = ADRESSE_WEB.matcher(texte);
        int debut = 0;
        while (adresses.find()) {
            resultat.append(echapper(texte.substring(debut, adresses.start())));
            String lien = echapper(adresses.group());
            resultat.append("<a href=\"").append(lien).append("\" style=\"color:").append(BLEU).append("\">").append(lien).append("</a>");
            debut = adresses.end();
        }
        resultat.append(echapper(texte.substring(debut)));
        return resultat.toString().replaceAll("\\R", "<br>");
    }

    static String echapper(String texte) {
        return texte.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
