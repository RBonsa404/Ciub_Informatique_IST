package com.clubinfo.ist.inscription.repository;

import com.clubinfo.ist.inscription.entity.Presence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PresenceRepository extends JpaRepository<Presence, Long> {

    List<Presence> findAllBySessionFormationId(Long sessionId);

    Optional<Presence> findByInscriptionIdAndSessionFormationId(Long inscriptionId, Long sessionId);
}
