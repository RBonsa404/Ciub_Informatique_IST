package com.example.api.security;

import com.example.api.model.Permission;
import com.example.api.model.Role;
import com.example.api.model.Utilisateur;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

@Getter
public class CustomUserDetails implements UserDetails {

    private final Utilisateur utilisateur;
    private final Set<GrantedAuthority> authorities;

    public CustomUserDetails(Utilisateur utilisateur) {
        this.utilisateur = utilisateur;
        this.authorities = new HashSet<>();

        if (utilisateur.getRoles() != null) {
            for (Role role : utilisateur.getRoles()) {
                // Rôle Spring Security (ex: ROLE_MEMBRE, ROLE_ADMINISTRATEUR)
                String roleName = role.getNom().startsWith("ROLE_") ? role.getNom() : "ROLE_" + role.getNom();
                this.authorities.add(new SimpleGrantedAuthority(roleName));

                // Permissions associées
                if (role.getPermissions() != null) {
                    for (Permission perm : role.getPermissions()) {
                        this.authorities.add(new SimpleGrantedAuthority(perm.getCode()));
                    }
                }
            }
        }
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return utilisateur.getMotDePasse();
    }

    @Override
    public String getUsername() {
        return utilisateur.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !"SUSPENDU".equalsIgnoreCase(utilisateur.getStatut());
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return "ACTIF".equalsIgnoreCase(utilisateur.getStatut());
    }
}
