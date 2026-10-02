package com.clubinfo.ist.user.controller;

import com.clubinfo.ist.common.security.UserDetailsImpl;
import com.clubinfo.ist.user.dto.GestionDesComptesDtos.Compte;
import com.clubinfo.ist.user.dto.GestionDesComptesDtos.CompteMiseAJour;
import com.clubinfo.ist.user.dto.GestionDesComptesDtos.DefinitionRole;
import com.clubinfo.ist.user.dto.GestionDesComptesDtos.Invitation;
import com.clubinfo.ist.user.dto.GestionDesComptesDtos.Permission;
import com.clubinfo.ist.user.dto.GestionDesComptesDtos.RoleDuCompte;
import com.clubinfo.ist.user.dto.GestionDesComptesDtos.RolesSaisie;
import com.clubinfo.ist.user.dto.GestionDesComptesDtos.StatutCompteSaisie;
import com.clubinfo.ist.user.entity.StatutUtilisateur;
import com.clubinfo.ist.user.service.GestionDesComptesService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Administration", description = "Comptes, rôles et invitations")
public class AdminUserController {

    private final GestionDesComptesService comptes;

    @GetMapping("/users")
    @Operation(summary = "Comptes non supprimés")
    public Page<Compte> lister(@RequestParam(required = false) String search, @RequestParam(required = false) RoleDuCompte role,
                               @RequestParam(required = false) StatutUtilisateur statut, @PageableDefault(size = 20) Pageable pageable) {
        return comptes.lister(search, role, statut, pageable);
    }

    @GetMapping("/users/{id}")
    @Operation(summary = "Compte")
    public Compte lire(@PathVariable Long id) {
        return comptes.lire(id);
    }

    @PutMapping("/users/{id}")
    @Operation(summary = "Modifier l'identité d'un compte")
    public Compte modifierIdentite(@PathVariable Long id, @Valid @RequestBody CompteMiseAJour saisie) {
        return comptes.modifierIdentite(id, saisie);
    }

    @PutMapping("/users/{id}/roles")
    @Operation(summary = "Attribuer les rôles ; refuse d'élever un compte au-dessus du sien et de modifier ses propres rôles")
    public Compte attribuerRoles(@PathVariable Long id, @Valid @RequestBody RolesSaisie saisie, @AuthenticationPrincipal UserDetailsImpl acteur) {
        return comptes.attribuerRoles(id, saisie.roles(), acteur);
    }

    @PatchMapping("/users/{id}/status")
    @Operation(summary = "Suspendre ou réactiver un compte ; refusé sur soi-même et sur le dernier Super Admin")
    public Compte changerStatut(@PathVariable Long id, @Valid @RequestBody StatutCompteSaisie saisie, @AuthenticationPrincipal UserDetailsImpl acteur) {
        return comptes.changerStatut(id, saisie.statut(), acteur);
    }

    @PostMapping("/users/{id}/deverrouillage")
    @Operation(summary = "Lever le verrouillage posé après des échecs de connexion")
    public ResponseEntity<Void> deverrouiller(@PathVariable Long id) {
        comptes.deverrouiller(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/invitations")
    @Operation(summary = "Inviter une personne : elle choisit son mot de passe par un lien à usage unique")
    public ResponseEntity<Void> inviter(@Valid @RequestBody Invitation invitation, @AuthenticationPrincipal UserDetailsImpl acteur) {
        comptes.inviter(invitation, acteur);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/roles")
    @Operation(summary = "Rôles et permissions effectives")
    public List<DefinitionRole> roles() {
        return comptes.definitionsDesRoles();
    }

    @GetMapping("/permissions")
    @Operation(summary = "Permissions")
    public List<Permission> permissions() {
        return comptes.listeDesPermissions();
    }
}
