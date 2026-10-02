package com.clubinfo.ist.fichier;

import com.clubinfo.ist.common.exception.BusinessException;
import com.clubinfo.ist.common.security.UserDetailsImpl;
import com.clubinfo.ist.common.stockage.StockageConfig;
import com.clubinfo.ist.common.stockage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

/** Dépôt contrôlé des fichiers et lecture selon les droits. */
@Service
@RequiredArgsConstructor
@Slf4j
public class FichierService {

    private static final Pattern IDENTIFIANT = Pattern.compile("[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}");
    private static final Set<String> ROLES_D_ADMINISTRATION = Set.of("ROLE_ADMIN", "ROLE_SUPER_ADMIN");
    private static final int LONGUEUR_MAXIMALE_DU_NOM = 200;
    /** Une photo de profil est une image de taille modeste. */
    public static final long TAILLE_MAXIMALE_PHOTO = 2L * 1024 * 1024;

    private final FichierRepository fichiers;
    private final StorageService stockage;
    private final StockageConfig.Proprietes proprietes;

    /** Contenu ouvert d'un fichier ; le flux est à fermer par l'appelant. */
    public record Contenu(Fichier fichier, InputStream flux) {
    }

    @Transactional
    public Fichier deposer(MultipartFile piece, UserDetailsImpl deposant) {
        return deposer(piece, deposant, proprietes.maxSizeBytes(), false, Fichier.Acces.PRIVE);
    }

    /** Photo de profil : une image, visible des seuls utilisateurs connectés. */
    @Transactional
    public Fichier deposerPhoto(MultipartFile piece, UserDetailsImpl deposant) {
        return deposer(piece, deposant, Math.min(TAILLE_MAXIMALE_PHOTO, proprietes.maxSizeBytes()), true, Fichier.Acces.MEMBRES);
    }

    private Fichier deposer(MultipartFile piece, UserDetailsImpl deposant, long tailleMaximale, boolean imageSeulement, Fichier.Acces acces) {
        if (piece == null || piece.isEmpty()) {
            throw new BusinessException("Le fichier est vide.", HttpStatus.BAD_REQUEST, "FICHIER_VIDE");
        }
        if (piece.getSize() > tailleMaximale) {
            throw new BusinessException("Le fichier dépasse la taille autorisée.", HttpStatus.PAYLOAD_TOO_LARGE);
        }
        String nom = nomPropre(piece.getOriginalFilename());
        TypeDeFichier type = TypeDeFichier.reconnaitre(entete(piece), nom)
                .filter(reconnu -> !imageSeulement || reconnu.estImage())
                .orElseThrow(() -> new BusinessException(imageSeulement
                        ? "Type de fichier refusé. Formats acceptés : PNG, JPEG, WebP."
                        : "Type de fichier refusé. Formats acceptés : PDF, PNG, JPEG, WebP, ZIP, DOCX, PPTX, XLSX.", HttpStatus.UNSUPPORTED_MEDIA_TYPE));

        String id = UUID.randomUUID().toString();
        LocalDate jour = LocalDate.now();
        String cle = "%d/%02d/%s".formatted(jour.getYear(), jour.getMonthValue(), UUID.randomUUID());
        try (InputStream contenu = piece.getInputStream()) {
            stockage.enregistrer(cle, contenu, piece.getSize(), type.typeMime());
        } catch (IOException erreur) {
            log.error("Dépôt de fichier impossible", erreur);
            throw new BusinessException("Le fichier n'a pas pu être enregistré.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return fichiers.save(Fichier.builder()
                .id(id)
                .cle(cle)
                .nom(nom)
                .typeMime(type.typeMime())
                .tailleOctets(piece.getSize())
                .deposantId(deposant.getId())
                .acces(acces)
                .createdAt(LocalDateTime.now())
                .build());
    }

    @Transactional(readOnly = true)
    public Contenu ouvrir(String id, UserDetailsImpl lecteur) {
        Fichier fichier = (id != null && IDENTIFIANT.matcher(id).matches() ? fichiers.findById(id) : java.util.Optional.<Fichier>empty())
                .orElseThrow(() -> new BusinessException("Fichier introuvable.", HttpStatus.NOT_FOUND));
        if (!lisible(fichier, lecteur)) {
            throw new AccessDeniedException("Fichier non accessible");
        }
        try {
            return new Contenu(fichier, stockage.lire(fichier.getCle()));
        } catch (IOException erreur) {
            log.error("Fichier {} présent en base mais absent du stockage", fichier.getId());
            throw new BusinessException("Fichier introuvable.", HttpStatus.NOT_FOUND);
        }
    }

    /** Ouvre le fichier à une catégorie de lecteurs, quand le contenu qui le porte devient visible. */
    @Transactional
    public void ouvrirA(String id, Fichier.Acces acces) {
        fichiers.findById(id).ifPresent(fichier -> fichier.setAcces(acces));
    }

    /** Retire un fichier, contenu compris. Un identifiant inconnu est ignoré. */
    @Transactional
    public void supprimer(String id) {
        if (id == null || !IDENTIFIANT.matcher(id).matches()) {
            return;
        }
        fichiers.findById(id).ifPresent(fichier -> {
            try {
                stockage.supprimer(fichier.getCle());
            } catch (IOException erreur) {
                log.warn("Contenu du fichier {} non supprimé du stockage", fichier.getId());
            }
            fichiers.delete(fichier);
        });
    }

    /** Retire les fichiers déposés par les comptes de test, contenu compris. */
    @Transactional
    public int supprimerDepotsDesComptesDeTest() {
        List<Fichier> depots = fichiers.deposesParComptesDeTest();
        for (Fichier fichier : depots) {
            try {
                stockage.supprimer(fichier.getCle());
            } catch (IOException erreur) {
                log.warn("Contenu du fichier {} non supprimé du stockage", fichier.getId());
            }
        }
        fichiers.deleteAll(depots);
        return depots.size();
    }

    private static boolean lisible(Fichier fichier, UserDetailsImpl lecteur) {
        if (fichier.getAcces() == Fichier.Acces.PUBLIC) {
            return true;
        }
        if (lecteur == null) {
            return false;
        }
        if (fichier.getAcces() == Fichier.Acces.MEMBRES || lecteur.getId().equals(fichier.getDeposantId())) {
            return true;
        }
        return lecteur.getAuthorities().stream().anyMatch(droit -> ROLES_D_ADMINISTRATION.contains(droit.getAuthority()));
    }

    private static byte[] entete(MultipartFile piece) {
        try (InputStream contenu = piece.getInputStream()) {
            return contenu.readNBytes(TypeDeFichier.LONGUEUR_ENTETE);
        } catch (IOException erreur) {
            throw new BusinessException("Le fichier n'a pas pu être lu.", HttpStatus.BAD_REQUEST, "FICHIER_ILLISIBLE");
        }
    }

    /** Nom affiché : dernier segment du nom transmis, sans caractère de contrôle. Il ne sert jamais de chemin. */
    private static String nomPropre(String transmis) {
        String nom = transmis == null ? "" : transmis.replace('\\', '/');
        nom = nom.substring(nom.lastIndexOf('/') + 1).replaceAll("\\p{Cntrl}", "").trim();
        if (nom.length() > LONGUEUR_MAXIMALE_DU_NOM) {
            nom = nom.substring(nom.length() - LONGUEUR_MAXIMALE_DU_NOM);
        }
        return nom.isBlank() ? "fichier" : nom;
    }
}
