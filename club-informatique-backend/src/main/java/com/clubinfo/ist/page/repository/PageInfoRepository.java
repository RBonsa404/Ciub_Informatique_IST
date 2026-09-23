package com.clubinfo.ist.page.repository;

import com.clubinfo.ist.page.entity.PageInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PageInfoRepository extends JpaRepository<PageInfo, Long> {

    Optional<PageInfo> findBySlug(String slug);

    boolean existsBySlug(String slug);
}
