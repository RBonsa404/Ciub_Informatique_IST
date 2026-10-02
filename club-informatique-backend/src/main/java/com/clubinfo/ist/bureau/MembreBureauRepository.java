package com.clubinfo.ist.bureau;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MembreBureauRepository extends JpaRepository<MembreBureau, Long> {

    List<MembreBureau> findAllByOrderByOrdreAscIdAsc();
}
