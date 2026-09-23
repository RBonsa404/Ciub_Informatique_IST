package com.clubinfo.ist.contact.repository;

import com.clubinfo.ist.contact.entity.MessageContact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageContactRepository extends JpaRepository<MessageContact, Long> {

    Page<MessageContact> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<MessageContact> findAllByTraiteOrderByCreatedAtDesc(Boolean traite, Pageable pageable);

    long countByTraiteFalse();
}
