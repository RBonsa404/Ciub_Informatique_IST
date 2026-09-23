package com.clubinfo.ist.ressource.service;

import com.clubinfo.ist.ressource.dto.RessourceCreateDto;
import com.clubinfo.ist.ressource.dto.RessourceDto;
import com.clubinfo.ist.ressource.entity.TypeRessource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface RessourceService {

    Page<RessourceDto> getPublicRessources(Long categorieId, TypeRessource type, String search, Pageable pageable);

    Page<RessourceDto> getAllRessourcesForAdmin(Pageable pageable);

    RessourceDto getRessourceById(Long id);

    List<RessourceDto> getRessourcesByFormation(Long formationId);

    RessourceDto createRessource(String userEmail, RessourceCreateDto dto);

    RessourceDto updateRessource(Long id, RessourceCreateDto dto);

    void deleteRessource(Long id);
}
