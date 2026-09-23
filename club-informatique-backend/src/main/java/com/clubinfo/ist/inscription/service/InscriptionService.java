package com.clubinfo.ist.inscription.service;

import com.clubinfo.ist.inscription.dto.InscriptionDto;
import com.clubinfo.ist.inscription.dto.InscriptionStatutUpdateDto;
import com.clubinfo.ist.inscription.dto.PresenceBulkRequestDto;
import com.clubinfo.ist.inscription.dto.PresenceDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface InscriptionService {

    InscriptionDto inscrireEvenement(String userEmail, Long evenementId);

    InscriptionDto inscrireSessionFormation(String userEmail, Long sessionId);

    Page<InscriptionDto> getMyInscriptions(String userEmail, Pageable pageable);

    InscriptionDto annulerInscription(String userEmail, Long inscriptionId, String motif);

    List<InscriptionDto> getInscriptionsByEvenement(Long evenementId);

    List<InscriptionDto> getInscriptionsBySession(Long sessionId);

    InscriptionDto updateStatutInscription(Long inscriptionId, InscriptionStatutUpdateDto dto);

    List<PresenceDto> getPresencesBySession(Long sessionId);

    List<PresenceDto> enregistrerPresencesBulk(Long sessionId, PresenceBulkRequestDto dto);
}
