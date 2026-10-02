package com.clubinfo.ist.admin.controller;

import com.clubinfo.ist.admin.dto.AdminDtos.Alerte;
import com.clubinfo.ist.admin.dto.AdminDtos.Configuration;
import com.clubinfo.ist.admin.dto.AdminDtos.Conformite;
import com.clubinfo.ist.admin.dto.AdminDtos.Indicateurs;
import com.clubinfo.ist.admin.dto.AdminDtos.Sauvegarde;
import com.clubinfo.ist.admin.dto.AdminDtos.Statistiques;
import com.clubinfo.ist.admin.service.ParametresService;
import com.clubinfo.ist.admin.service.ParametresService.Reglages;
import com.clubinfo.ist.admin.service.TableauxDeBordService;
import com.clubinfo.ist.common.journal.EntreeJournalDto;
import com.clubinfo.ist.common.journal.JournalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Administration", description = "Statistiques, sécurité, réglages, sauvegardes et conformité")
public class AdministrationController {

    private static final String ADMIN = "hasAnyRole('ADMIN', 'SUPER_ADMIN')";
    private static final String SUPER_ADMIN = "hasRole('SUPER_ADMIN')";
    private static final String DSI = "hasRole('DSI')";

    private final TableauxDeBordService tableaux;
    private final ParametresService parametres;
    private final JournalService journal;

    // ---- Chiffres

    @GetMapping("/admin/statistiques")
    @PreAuthorize(ADMIN)
    @Operation(summary = "Totaux et répartitions")
    public Statistiques statistiques() {
        return tableaux.statistiques();
    }

    @GetMapping("/gestion/indicateurs")
    @PreAuthorize("hasRole('RESPONSABLE_CLUB')")
    @Operation(summary = "Effectif actif et fréquentation mensuelle")
    public Indicateurs indicateurs() {
        return tableaux.indicateurs();
    }

    // ---- Sécurité

    @GetMapping("/admin/security/alerts")
    @PreAuthorize(ADMIN)
    @Operation(summary = "Comptes signalés (verrouillages, suspensions, échecs répétés)")
    public List<Alerte> alertes() {
        return tableaux.alertes();
    }

    @GetMapping("/admin/security/audit-logs")
    @PreAuthorize(ADMIN)
    @Operation(summary = "Journal d'audit")
    public Page<EntreeJournalDto> journalDAudit(@RequestParam(required = false) String utilisateur,
                                                @RequestParam(required = false) JournalService.Resultat statut,
                                                @PageableDefault(size = 20) Pageable pageable) {
        return journal.consulter(utilisateur, statut == null ? null : statut.name(), pageable);
    }

    // ---- Système

    @GetMapping("/admin/system/config")
    @PreAuthorize(SUPER_ADMIN)
    @Operation(summary = "Réglages persistants de la plateforme")
    public Configuration reglages() {
        return decrire(parametres.reglages());
    }

    @PutMapping("/admin/system/config")
    @PreAuthorize(SUPER_ADMIN)
    @Operation(summary = "Modifier les réglages")
    public Configuration modifierReglages(@Valid @RequestBody Configuration saisie) {
        return decrire(parametres.enregistrer(new Reglages(saisie.nomPlateforme().trim(), saisie.maintenanceMode(), saisie.inscriptionsOuvertes(),
                saisie.maxLoginAttempts(), saisie.lockoutDurationMinutes())));
    }

    @GetMapping("/admin/system/sauvegardes")
    @PreAuthorize(SUPER_ADMIN)
    @Operation(summary = "Dernières sauvegardes enregistrées par la tâche planifiée")
    public List<Sauvegarde> sauvegardes() {
        return tableaux.sauvegardes();
    }

    // ---- Conformité

    @GetMapping("/dsi/conformite")
    @PreAuthorize(DSI)
    @Operation(summary = "Contrôles de conformité calculés")
    public Conformite conformite() {
        return tableaux.conformite();
    }

    @GetMapping("/dsi/conformite/logs")
    @PreAuthorize(DSI)
    @Operation(summary = "Journal d'audit en consultation")
    public Page<EntreeJournalDto> journalPourLaDsi(@RequestParam(required = false) String utilisateur,
                                                   @RequestParam(required = false) JournalService.Resultat statut,
                                                   @PageableDefault(size = 20) Pageable pageable) {
        return journal.consulter(utilisateur, statut == null ? null : statut.name(), pageable);
    }

    private Configuration decrire(Reglages reglages) {
        return new Configuration(reglages.nomPlateforme(), tableaux.version(), reglages.maintenanceMode(), reglages.inscriptionsOuvertes(),
                reglages.maxLoginAttempts(), reglages.lockoutDurationMinutes());
    }
}
