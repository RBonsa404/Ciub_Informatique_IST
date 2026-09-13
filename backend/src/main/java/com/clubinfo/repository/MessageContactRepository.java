package com.clubinfo.repository;

import com.clubinfo.entity.MessageContact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageContactRepository extends JpaRepository<MessageContact, Long> {
    Page<MessageContact> findByTraite(boolean traite, Pageable pageable);
}
