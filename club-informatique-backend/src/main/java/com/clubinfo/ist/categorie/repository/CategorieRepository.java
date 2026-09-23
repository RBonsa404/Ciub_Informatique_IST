package com.clubinfo.ist.categorie.repository;

import com.clubinfo.ist.categorie.entity.Categorie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategorieRepository extends JpaRepository<Categorie, Long> {

    List<Categorie> findAllByDeletedAtIsNull();

    Optional<Categorie> findByIdAndDeletedAtIsNull(Long id);

    Optional<Categorie> findBySlugAndDeletedAtIsNull(String slug);

    boolean existsByNomAndDeletedAtIsNull(String nom);

    boolean existsBySlugAndDeletedAtIsNull(String slug);
}
