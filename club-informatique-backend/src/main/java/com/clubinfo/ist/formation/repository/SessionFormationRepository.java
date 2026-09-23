package com.clubinfo.ist.formation.repository;

import com.clubinfo.ist.formation.entity.SessionFormation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SessionFormationRepository extends JpaRepository<SessionFormation, Long> {

    Optional<SessionFormation> findByIdAndDeletedAtIsNull(Long id);

    List<SessionFormation> findAllByFormationIdAndDeletedAtIsNullOrderByDateDebutAsc(Long formationId);
}
