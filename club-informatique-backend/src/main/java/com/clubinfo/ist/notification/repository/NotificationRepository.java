package com.clubinfo.ist.notification.repository;

import com.clubinfo.ist.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findAllByDestinataireIdOrderByCreatedAtDesc(Long destinataireId, Pageable pageable);

    long countByDestinataireIdAndLueFalse(Long destinataireId);

    @Modifying
    @Query("UPDATE Notification n SET n.lue = true, n.dateLecture = :now WHERE n.destinataire.id = :destinataireId AND n.lue = false")
    void markAllAsRead(@Param("destinataireId") Long destinataireId, @Param("now") LocalDateTime now);
}
