package com.clubinfo.ist.auth.service;

import com.clubinfo.ist.auth.entity.JetonUsageUnique;
import com.clubinfo.ist.auth.repository.JetonUsageUniqueRepository;
import com.clubinfo.ist.common.security.Jetons;
import com.clubinfo.ist.user.entity.Utilisateur;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

/** Émission et consommation des jetons à usage unique envoyés par courriel. */
@Service
@RequiredArgsConstructor
public class JetonService {

    private final JetonUsageUniqueRepository jetons;

    /** @return le jeton en clair, à placer dans le lien du courriel ; il n'est conservé nulle part. */
    @Transactional
    public String emettre(Utilisateur utilisateur, JetonUsageUnique.Type type, Duration validite) {
        jetons.retirerEnAttente(utilisateur, type);
        String jeton = Jetons.aleatoire();
        LocalDateTime maintenant = LocalDateTime.now();
        jetons.save(JetonUsageUnique.builder()
                .utilisateur(utilisateur)
                .type(type)
                .empreinte(Jetons.empreinte(jeton))
                .expireLe(maintenant.plus(validite))
                .createdAt(maintenant)
                .build());
        return jeton;
    }

    /** @return l'identifiant du compte si le jeton était valable ; il ne l'est plus ensuite. */
    @Transactional
    public Optional<Long> consommer(String jeton, JetonUsageUnique.Type type) {
        if (jeton == null || jeton.isBlank()) {
            return Optional.empty();
        }
        String empreinte = Jetons.empreinte(jeton);
        if (jetons.consommer(empreinte, type, LocalDateTime.now()) != 1) {
            return Optional.empty();
        }
        return jetons.findByEmpreinte(empreinte).map(trouve -> trouve.getUtilisateur().getId());
    }
}
