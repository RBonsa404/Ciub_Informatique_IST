package com.clubinfo.ist.common.security;

import com.clubinfo.ist.user.entity.StatutUtilisateur;
import com.clubinfo.ist.user.entity.Utilisateur;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

/**
 * Implémentation Spring Security de UserDetails enveloppant notre entité Utilisateur.
 * Expose les rôles (ROLE_*) et les permissions comme GrantedAuthority.
 */
@Getter
public class UserDetailsImpl implements UserDetails {

    private final Long id;
    private final String email;
    private final String password;
    private final StatutUtilisateur statut;
    private final boolean accountNonLocked;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserDetailsImpl(Utilisateur utilisateur) {
        this.id = utilisateur.getId();
        this.email = utilisateur.getEmail();
        this.password = utilisateur.getMotDePasse();
        this.statut = utilisateur.getStatut();
        this.accountNonLocked = !utilisateur.estVerrouille() && utilisateur.getStatut() != StatutUtilisateur.SUSPENDU;

        Set<GrantedAuthority> auths = new HashSet<>();
        if (utilisateur.getRoles() != null) {
            utilisateur.getRoles().forEach(role -> {
                auths.add(new SimpleGrantedAuthority(role.getNom()));
                if (role.getPermissions() != null) {
                    role.getPermissions().forEach(perm ->
                            auths.add(new SimpleGrantedAuthority(perm.getNom()))
                    );
                }
            });
        }
        this.authorities = auths;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return accountNonLocked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return statut == StatutUtilisateur.ACTIF;
    }
}
