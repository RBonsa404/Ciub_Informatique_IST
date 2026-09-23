package com.clubinfo.ist.contact.service;

import com.clubinfo.ist.common.exception.ResourceNotFoundException;
import com.clubinfo.ist.contact.dto.MessageContactCreateDto;
import com.clubinfo.ist.contact.dto.MessageContactDto;
import com.clubinfo.ist.contact.entity.MessageContact;
import com.clubinfo.ist.contact.mapper.MessageContactMapper;
import com.clubinfo.ist.contact.repository.MessageContactRepository;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContactServiceImpl implements ContactService {

    private final MessageContactRepository messageContactRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final MessageContactMapper messageContactMapper;

    @Override
    @Transactional
    public MessageContactDto envoyerMessage(MessageContactCreateDto dto) {
        MessageContact message = MessageContact.builder()
                .nom(dto.getNom())
                .email(dto.getEmail().toLowerCase().trim())
                .sujet(dto.getSujet())
                .message(dto.getMessage())
                .traite(false)
                .build();

        message = messageContactRepository.save(message);
        log.info("Message de contact reçu de {} ({}) : '{}'", dto.getNom(), dto.getEmail(), dto.getSujet());
        return messageContactMapper.toDto(message);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MessageContactDto> getAllMessages(Boolean traite, Pageable pageable) {
        if (traite != null) {
            return messageContactRepository.findAllByTraiteOrderByCreatedAtDesc(traite, pageable)
                    .map(messageContactMapper::toDto);
        }
        return messageContactRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(messageContactMapper::toDto);
    }

    @Override
    @Transactional
    public MessageContactDto marquerCommeTraite(Long id, String repondeurEmail) {
        MessageContact message = messageContactRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MessageContact", "id", id));

        Utilisateur repondeur = utilisateurRepository.findByEmail(repondeurEmail).orElse(null);

        message.setTraite(true);
        message.setDateReponse(LocalDateTime.now());
        message.setReponsePar(repondeur);

        message = messageContactRepository.save(message);
        log.info("Message de contact ID {} marqué comme traité par {}", id, repondeurEmail);
        return messageContactMapper.toDto(message);
    }
}
