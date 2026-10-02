package com.clubinfo.ist.notification.repository;

import com.clubinfo.ist.notification.entity.Notification;
import com.clubinfo.ist.notification.entity.TypeNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("SELECT n FROM Notification n WHERE n.destinataire.id = :destinataireId AND n.deletedAt IS NULL " +
           "AND (:type IS NULL OR n.type = :type) AND (:lue IS NULL OR n.lue = :lue)")
    Page<Notification> lister(@Param("destinataireId") Long destinataireId, @Param("type") TypeNotification type,
                              @Param("lue") Boolean lue, Pageable pageable);

    Optional<Notification> findByIdAndDestinataireId(Long id, Long destinataireId);

    long countByDestinataireIdAndLueFalse(Long destinataireId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Notification n SET n.lue = true, n.dateLecture = :maintenant WHERE n.destinataire.id = :destinataireId AND n.lue = false")
    void marquerToutesLues(@Param("destinataireId") Long destinataireId, @Param("maintenant") LocalDateTime maintenant);
}
