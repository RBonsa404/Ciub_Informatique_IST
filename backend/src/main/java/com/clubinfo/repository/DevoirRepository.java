package com.clubinfo.repository;

import com.clubinfo.entity.Devoir;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DevoirRepository extends JpaRepository<Devoir, Long> {
}
