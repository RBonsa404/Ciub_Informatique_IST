package com.clubinfo.ist.formation.service;

import com.clubinfo.ist.common.security.UserDetailsImpl;
import com.clubinfo.ist.formation.entity.Formation;
import org.springframework.security.access.AccessDeniedException;

/** Qui gère une formation : son formateur et le Responsable du Club. Le rôle seul ne suffit pas. */
public final class EquipePedagogique {

    private static final String RESPONSABLE = "ROLE_RESPONSABLE_CLUB";

    private EquipePedagogique() {
    }

    public static boolean gere(Formation formation, UserDetailsImpl compte) {
        if (compte == null) {
            return false;
        }
        return estResponsable(compte) || (formation.getFormateur() != null && formation.getFormateur().getId().equals(compte.getId()));
    }

    public static void exiger(Formation formation, UserDetailsImpl compte) {
        if (!gere(formation, compte)) {
            throw new AccessDeniedException("Formation d'un autre formateur");
        }
    }

    public static boolean estResponsable(UserDetailsImpl compte) {
        return aRole(compte, RESPONSABLE);
    }

    public static boolean aRole(UserDetailsImpl compte, String role) {
        return compte != null && compte.getAuthorities().stream().anyMatch(droit -> role.equals(droit.getAuthority()));
    }
}
