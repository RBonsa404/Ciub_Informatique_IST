package com.clubinfo.ist.contact.repository;

import com.clubinfo.ist.contact.entity.MessageContact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageContactRepository extends JpaRepository<MessageContact, Long> {

    @EntityGraph(attributePaths = "reponsePar")
    @Query("SELECT m FROM MessageContact m WHERE m.deletedAt IS NULL AND (:traite IS NULL OR m.traite = :traite)")
    Page<MessageContact> lister(@Param("traite") Boolean traite, Pageable pageable);

    long countByTraiteFalse();
}
