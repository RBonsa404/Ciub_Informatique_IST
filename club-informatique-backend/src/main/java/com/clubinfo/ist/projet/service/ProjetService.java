package com.clubinfo.ist.projet.service;

import com.clubinfo.ist.projet.dto.ProjetCreateDto;
import com.clubinfo.ist.projet.dto.ProjetDto;
import com.clubinfo.ist.projet.dto.ProjetMembreDto;
import com.clubinfo.ist.projet.dto.ProjetSuiviDto;
import com.clubinfo.ist.projet.dto.ProjetValidationDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ProjetService {

    Page<ProjetDto> getPublishedProjets(Long categorieId, String search, Pageable pageable);

    Page<ProjetDto> getAllProjetsForAdmin(Pageable pageable);

    List<ProjetDto> getProjetsEnAttente();

    ProjetDto getProjetById(Long id);

    ProjetDto getProjetBySlug(String slug);

    ProjetDto proposerProjet(String userEmail, ProjetCreateDto dto);

    ProjetDto validerProjet(Long id, ProjetValidationDto dto);

    ProjetMembreDto rejoindreProjet(String userEmail, Long projetId);

    List<ProjetMembreDto> getMembres(Long projetId);

    ProjetDto updateSuiviFormateur(Long projetId, ProjetSuiviDto dto);

    void deleteProjet(Long id);
}
