package com.clubinfo.ist.formation.service;

import com.clubinfo.ist.formation.dto.DevoirCreateDto;
import com.clubinfo.ist.formation.dto.DevoirDto;
import com.clubinfo.ist.formation.dto.FormationCreateDto;
import com.clubinfo.ist.formation.dto.FormationDto;
import com.clubinfo.ist.formation.dto.FormationUpdateDto;
import com.clubinfo.ist.formation.dto.SessionFormationCreateDto;
import com.clubinfo.ist.formation.dto.SessionFormationDto;
import com.clubinfo.ist.formation.entity.NiveauFormation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface FormationService {

    Page<FormationDto> getPublishedFormations(Long categorieId, NiveauFormation niveau, String search, Pageable pageable);

    Page<FormationDto> getAllFormationsForAdmin(Pageable pageable);

    FormationDto getFormationById(Long id);

    FormationDto getFormationBySlug(String slug);

    FormationDto createFormation(String formateurEmail, FormationCreateDto dto);

    FormationDto updateFormation(Long id, FormationUpdateDto dto);

    FormationDto togglePublication(Long id);

    void deleteFormation(Long id);

    List<SessionFormationDto> getSessions(Long formationId);

    SessionFormationDto addSession(Long formationId, SessionFormationCreateDto dto);

    SessionFormationDto updateSession(Long formationId, Long sessionId, SessionFormationCreateDto dto);

    void deleteSession(Long formationId, Long sessionId);

    List<DevoirDto> getDevoirs(Long formationId);

    DevoirDto addDevoir(Long formationId, DevoirCreateDto dto);

    void deleteDevoir(Long formationId, Long devoirId);
}
