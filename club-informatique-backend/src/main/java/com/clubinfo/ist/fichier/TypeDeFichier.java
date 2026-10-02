package com.clubinfo.ist.fichier;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Types de fichiers acceptés. Le type est établi à partir des premiers octets du contenu ;
 * l'extension doit lui correspondre. Le type déclaré par le navigateur n'est jamais pris en compte.
 */
public enum TypeDeFichier {

    PDF("application/pdf", Signature.PDF, false, "pdf"),
    PNG("image/png", Signature.PNG, true, "png"),
    JPEG("image/jpeg", Signature.JPEG, true, "jpg", "jpeg"),
    WEBP("image/webp", Signature.WEBP, true, "webp"),
    ZIP("application/zip", Signature.ZIP, false, "zip"),
    DOCX("application/vnd.openxmlformats-officedocument.wordprocessingml.document", Signature.ZIP, false, "docx"),
    PPTX("application/vnd.openxmlformats-officedocument.presentationml.presentation", Signature.ZIP, false, "pptx"),
    XLSX("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", Signature.ZIP, false, "xlsx");

    /** Nombre d'octets nécessaires à la reconnaissance. */
    public static final int LONGUEUR_ENTETE = 12;

    private enum Signature {
        PDF, PNG, JPEG, WEBP, ZIP;

        static Optional<Signature> de(byte[] entete) {
            if (commence(entete, 0, '%', 'P', 'D', 'F', '-')) {
                return Optional.of(PDF);
            }
            if (commence(entete, 0, 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A)) {
                return Optional.of(PNG);
            }
            if (commence(entete, 0, 0xFF, 0xD8, 0xFF)) {
                return Optional.of(JPEG);
            }
            if (commence(entete, 0, 'R', 'I', 'F', 'F') && commence(entete, 8, 'W', 'E', 'B', 'P')) {
                return Optional.of(WEBP);
            }
            if (commence(entete, 0, 'P', 'K', 0x03, 0x04)) {
                return Optional.of(ZIP);
            }
            return Optional.empty();
        }

        private static boolean commence(byte[] entete, int position, int... attendus) {
            if (entete.length < position + attendus.length) {
                return false;
            }
            for (int i = 0; i < attendus.length; i++) {
                if ((entete[position + i] & 0xFF) != attendus[i]) {
                    return false;
                }
            }
            return true;
        }
    }

    private final String typeMime;
    private final Signature signature;
    private final boolean image;
    private final List<String> extensions;

    TypeDeFichier(String typeMime, Signature signature, boolean image, String... extensions) {
        this.typeMime = typeMime;
        this.signature = signature;
        this.image = image;
        this.extensions = List.of(extensions);
    }

    public String typeMime() {
        return typeMime;
    }

    /** Une image peut s'afficher dans la page ; tout autre fichier est proposé au téléchargement. */
    public boolean estImage() {
        return image;
    }

    public static Optional<TypeDeFichier> deTypeMime(String typeMime) {
        return Arrays.stream(values()).filter(type -> type.typeMime.equals(typeMime)).findFirst();
    }

    /** Type du fichier, ou vide si le contenu n'est pas reconnu ou si l'extension ne lui correspond pas. */
    public static Optional<TypeDeFichier> reconnaitre(byte[] entete, String nom) {
        int point = nom == null ? -1 : nom.lastIndexOf('.');
        if (point < 0) {
            return Optional.empty();
        }
        String extension = nom.substring(point + 1).toLowerCase(Locale.ROOT);
        return Signature.de(entete).flatMap(signature -> Arrays.stream(values())
                .filter(type -> type.signature == signature && type.extensions.contains(extension))
                .findFirst());
    }
}
