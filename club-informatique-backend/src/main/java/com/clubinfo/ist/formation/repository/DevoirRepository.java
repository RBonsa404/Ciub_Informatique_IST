package com.clubinfo.ist.formation.repository;

import com.clubinfo.ist.formation.entity.Devoir;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DevoirRepository extends JpaRepository<Devoir, Long> {

    Optional<Devoir> findByIdAndDeletedAtIsNull(Long id);

    List<Devoir> findAllByFormationIdAndDeletedAtIsNullOrderByDateLimiteAsc(Long formationId);
}
