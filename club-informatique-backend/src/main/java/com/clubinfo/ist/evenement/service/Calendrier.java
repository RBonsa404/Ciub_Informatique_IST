package com.clubinfo.ist.evenement.service;

import com.clubinfo.ist.evenement.entity.Evenement;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/** Événement au format iCalendar (RFC 5545) : horaires en UTC, texte échappé, lignes repliées à 75 octets. */
final class Calendrier {

    private static final DateTimeFormatter HORODATAGE = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'");
    private static final int LARGEUR = 75;
    private static final String FIN_DE_LIGNE = "\r\n";

    private Calendrier() {
    }

    static String de(Evenement evenement, String domaine, String adresse) {
        StringBuilder ics = new StringBuilder();
        ligne(ics, "BEGIN:VCALENDAR");
        ligne(ics, "VERSION:2.0");
        ligne(ics, "PRODID:-//Club Informatique IST//Evenements//FR");
        ligne(ics, "CALSCALE:GREGORIAN");
        ligne(ics, "METHOD:PUBLISH");
        ligne(ics, "BEGIN:VEVENT");
        ligne(ics, "UID:evenement-" + evenement.getId() + "@" + domaine);
        ligne(ics, "DTSTAMP:" + HORODATAGE.format(LocalDateTime.now()));
        ligne(ics, "DTSTART:" + HORODATAGE.format(evenement.getDateDebut()));
        ligne(ics, "DTEND:" + HORODATAGE.format(evenement.getDateFin()));
        ligne(ics, "SUMMARY:" + echappe(evenement.getTitre()));
        ligne(ics, "DESCRIPTION:" + echappe(evenement.getDescription()));
        ligne(ics, "LOCATION:" + echappe(evenement.getLieu()));
        if (adresse != null) {
            ligne(ics, "URL:" + adresse);
        }
        ligne(ics, "END:VEVENT");
        ligne(ics, "END:VCALENDAR");
        return ics.toString();
    }

    private static String echappe(String texte) {
        return (texte == null ? "" : texte)
                .replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,")
                .replace("\r\n", "\\n").replace("\n", "\\n").replace("\r", "\\n");
    }

    /** Une ligne ne dépasse pas 75 octets ; la suite commence par une espace. Un caractère n'est jamais coupé. */
    private static void ligne(StringBuilder ics, String contenu) {
        int octets = 0;
        for (int i = 0; i < contenu.length(); ) {
            int point = contenu.codePointAt(i);
            int taille = new String(Character.toChars(point)).getBytes(StandardCharsets.UTF_8).length;
            if (octets + taille > LARGEUR) {
                ics.append(FIN_DE_LIGNE).append(' ');
                octets = 1;
            }
            ics.appendCodePoint(point);
            octets += taille;
            i += Character.charCount(point);
        }
        ics.append(FIN_DE_LIGNE);
    }
}
