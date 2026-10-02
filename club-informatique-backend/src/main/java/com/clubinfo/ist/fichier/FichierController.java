package com.clubinfo.ist.fichier;

import com.clubinfo.ist.common.security.UserDetailsImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

@RestController
@RequestMapping("/fichiers")
@RequiredArgsConstructor
@Tag(name = "Fichiers", description = "Dépôt et téléchargement contrôlés des fichiers")
public class FichierController {

    private final FichierService fichiers;

    @Value("${server.servlet.context-path:}")
    private String prefixe;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('FORMATEUR', 'RESPONSABLE_CLUB')")
    @Operation(summary = "Déposer un fichier (taille, type et signature binaire contrôlés)")
    public ResponseEntity<FichierDto> deposer(@RequestPart("fichier") MultipartFile fichier,
                                              @AuthenticationPrincipal UserDetailsImpl deposant) {
        Fichier depose = fichiers.deposer(fichier, deposant);
        String url = prefixe + "/fichiers/" + depose.getId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new FichierDto(depose.getId(), url, depose.getNom(), depose.getTypeMime(), depose.getTailleOctets()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Télécharger un fichier, selon les droits de la ressource qui le porte")
    public ResponseEntity<InputStreamResource> telecharger(@PathVariable String id, @AuthenticationPrincipal UserDetailsImpl lecteur) {
        FichierService.Contenu contenu = fichiers.ouvrir(id, lecteur);
        Fichier fichier = contenu.fichier();
        boolean image = TypeDeFichier.deTypeMime(fichier.getTypeMime()).map(TypeDeFichier::estImage).orElse(false);
        boolean publicATous = fichier.getAcces() == Fichier.Acces.PUBLIC;
        CacheControl cache = CacheControl.maxAge(Duration.ofHours(1));
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(fichier.getTypeMime()))
                .contentLength(fichier.getTailleOctets())
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.builder(image ? "inline" : "attachment")
                        .filename(fichier.getNom(), StandardCharsets.UTF_8).build().toString())
                .cacheControl(publicATous ? cache.cachePublic() : cache.cachePrivate())
                .body(new InputStreamResource(contenu.flux()));
    }
}
