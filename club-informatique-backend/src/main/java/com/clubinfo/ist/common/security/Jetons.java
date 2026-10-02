package com.clubinfo.ist.common.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Jetons opaques remis au client (cookie de session, liens des courriels).
 * La base ne conserve que leur empreinte : une copie de la base ne permet d'ouvrir aucune session.
 */
public final class Jetons {

    private static final SecureRandom ALEA = new SecureRandom();

    private Jetons() {
    }

    /** Jeton aléatoire de 256 bits, utilisable dans une adresse web. */
    public static String aleatoire() {
        byte[] octets = new byte[32];
        ALEA.nextBytes(octets);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(octets);
    }

    /** Empreinte SHA-256 en hexadécimal. */
    public static String empreinte(String jeton) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(jeton.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException absent) {
            throw new IllegalStateException(absent);
        }
    }
}
