package com.clubinfo.repository;

import com.clubinfo.entity.Ressource;
import com.clubinfo.entity.Visibilite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RessourceRepository extends JpaRepository<Ressource, Long> {
    Page<Ressource> findByVisibilite(Visibilite visibilite, Pageable pageable);
    List<Ressource> findByFormationId(Long formationId);
}
