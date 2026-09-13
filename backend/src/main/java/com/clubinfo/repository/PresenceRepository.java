package com.clubinfo.repository;

import com.clubinfo.entity.Presence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PresenceRepository extends JpaRepository<Presence, Long> {
    List<Presence> findBySessionId(Long sessionId);
    List<Presence> findByInscriptionId(Long inscriptionId);
}
