package com.clubinfo.ist.evenement.service;

import com.clubinfo.ist.evenement.dto.EvenementCreateDto;
import com.clubinfo.ist.evenement.dto.EvenementDto;
import com.clubinfo.ist.evenement.dto.EvenementUpdateDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface EvenementService {

    Page<EvenementDto> getPublishedEvenements(Boolean aVenir, Long categorieId, String search, Pageable pageable);

    Page<EvenementDto> getAllEvenementsForAdmin(Pageable pageable);

    EvenementDto getEvenementById(Long id);

    EvenementDto getEvenementBySlug(String slug);

    EvenementDto createEvenement(String userEmail, EvenementCreateDto dto);

    EvenementDto updateEvenement(Long id, EvenementUpdateDto dto);

    EvenementDto togglePublication(Long id);

    void deleteEvenement(Long id);
}
