package com.clubinfo.ist.inscription.service;

import com.clubinfo.ist.inscription.repository.InscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Nombre d'inscrits confirmés, toujours compté en base ; une seule requête pour une liste entière. */
@Component
@RequiredArgsConstructor
public class Effectifs {

    private final InscriptionRepository inscriptions;

    public long evenement(Long id) {
        return inscriptions.confirmeesDeLEvenement(id);
    }

    public long seance(Long id) {
        return inscriptions.confirmeesDeLaSeance(id);
    }

    public Map<Long, Long> evenements(Collection<Long> ids) {
        return ids.isEmpty() ? Map.of() : parIdentifiant(inscriptions.confirmeesParEvenement(ids));
    }

    public Map<Long, Long> seances(Collection<Long> ids) {
        return ids.isEmpty() ? Map.of() : parIdentifiant(inscriptions.confirmeesParSeance(ids));
    }

    private static Map<Long, Long> parIdentifiant(List<Object[]> lignes) {
        Map<Long, Long> effectifs = new HashMap<>();
        for (Object[] ligne : lignes) {
            effectifs.put((Long) ligne[0], (Long) ligne[1]);
        }
        return effectifs;
    }
}
