package com.clubinfo.ist.auth.repository;

import com.clubinfo.ist.auth.entity.JetonUsageUnique;
import com.clubinfo.ist.user.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface JetonUsageUniqueRepository extends JpaRepository<JetonUsageUnique, Long> {

    Optional<JetonUsageUnique> findByEmpreinte(String empreinte);

    /** Marque le jeton comme utilisé s'il est encore valable. Une seule requête : deux usages simultanés ne passent pas tous les deux. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE JetonUsageUnique j SET j.utiliseLe = :maintenant " +
           "WHERE j.empreinte = :empreinte AND j.type = :type AND j.utiliseLe IS NULL AND j.expireLe > :maintenant")
    int consommer(@Param("empreinte") String empreinte, @Param("type") JetonUsageUnique.Type type, @Param("maintenant") LocalDateTime maintenant);

    /** Un nouveau jeton remplace les précédents du même type. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM JetonUsageUnique j WHERE j.utilisateur = :utilisateur AND j.type = :type AND j.utiliseLe IS NULL")
    void retirerEnAttente(@Param("utilisateur") Utilisateur utilisateur, @Param("type") JetonUsageUnique.Type type);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM JetonUsageUnique j WHERE j.expireLe < :limite")
    int purgerExpires(@Param("limite") LocalDateTime limite);
}
