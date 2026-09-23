package com.clubinfo.ist.actualite.service;

import com.clubinfo.ist.actualite.dto.ActualiteCreateDto;
import com.clubinfo.ist.actualite.dto.ActualiteDto;
import com.clubinfo.ist.actualite.dto.ActualiteUpdateDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ActualiteService {

    Page<ActualiteDto> getPublishedActualites(Long categorieId, String search, Pageable pageable);

    Page<ActualiteDto> getAllActualitesForAdmin(Pageable pageable);

    ActualiteDto getActualiteById(Long id);

    ActualiteDto getActualiteBySlug(String slug);

    ActualiteDto createActualite(String userEmail, ActualiteCreateDto dto);

    ActualiteDto updateActualite(Long id, ActualiteUpdateDto dto);

    ActualiteDto togglePublication(Long id);

    void deleteActualite(Long id);
}
