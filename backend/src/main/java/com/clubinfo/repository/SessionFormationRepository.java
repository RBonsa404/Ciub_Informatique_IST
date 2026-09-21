package com.clubinfo.repository;

import com.clubinfo.entity.SessionFormation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SessionFormationRepository extends JpaRepository<SessionFormation, Long> {
}
