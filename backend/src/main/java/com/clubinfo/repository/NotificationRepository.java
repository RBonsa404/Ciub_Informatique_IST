package com.clubinfo.repository;

import com.clubinfo.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByDestinataireIdOrderByDateEnvoiDesc(Long destinataireId);
    List<Notification> findByDestinataireIdAndLuFalseOrderByDateEnvoiDesc(Long destinataireId);
    long countByDestinataireIdAndLuFalse(Long destinataireId);
}
