package com.clubinfo.ist.carte;

import com.clubinfo.ist.common.exception.BusinessException;
import com.clubinfo.ist.common.security.UserDetailsImpl;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Tag(name = "Carte de membre", description = "Carte de membre du connecté et vérification d'une carte scannée")
public class CarteController {

    private final CarteService cartes;
    private final UtilisateurRepository utilisateurs;

    /** Ce qu'affiche le scan d'une carte par une personne quelconque : le minimum pour la reconnaître. */
    public record CarteVerifiee(String prenom, String initialeNom, long seancesSuivies, int seuil, boolean actif) {
    }

    @GetMapping("/users/me/carte")
    @Operation(summary = "État de ma carte de membre : numéro, séances suivies, statut actif ou passif")
    public CarteService.EtatCarte maCarte(@AuthenticationPrincipal UserDetailsImpl connecte) {
        return cartes.etat(cartes.preparer(compte(connecte)));
    }

    @GetMapping(value = "/users/me/carte.png", produces = MediaType.IMAGE_PNG_VALUE)
    @Operation(summary = "Image de ma carte de membre")
    public ResponseEntity<byte[]> imageDeMaCarte(@AuthenticationPrincipal UserDetailsImpl connecte) {
        Utilisateur membre = cartes.preparer(compte(connecte));
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline()
                        .filename("carte-membre-" + membre.getNumeroMembre() + ".png").build().toString())
                .body(cartes.image(membre));
    }

    @GetMapping("/cartes/{jeton}")
    @Operation(summary = "Vérifier une carte scannée (accès libre : prénom, initiale du nom et statut seulement)")
    public CarteVerifiee verifier(@PathVariable String jeton) {
        Utilisateur membre = utilisateurs.findByCarteJetonAndDeletedAtIsNull(jeton)
                .orElseThrow(() -> new BusinessException("Carte inconnue.", HttpStatus.NOT_FOUND, "CARTE_INCONNUE"));
        CarteService.EtatCarte etat = cartes.etat(membre);
        String initiale = membre.getNom() == null || membre.getNom().isBlank() ? "" : membre.getNom().substring(0, 1).toUpperCase() + ".";
        return new CarteVerifiee(membre.getPrenom(), initiale, etat.seancesSuivies(), etat.seuil(), etat.actif());
    }

    private Utilisateur compte(UserDetailsImpl connecte) {
        return utilisateurs.findByIdAndDeletedAtIsNull(connecte.getId())
                .orElseThrow(() -> new BusinessException("Compte introuvable.", HttpStatus.NOT_FOUND));
    }
}
