package com.clubinfo.service;

import com.clubinfo.dto.MessageContactDTO;
import com.clubinfo.entity.MessageContact;
import com.clubinfo.entity.Utilisateur;
import com.clubinfo.exception.ResourceNotFoundException;
import com.clubinfo.repository.MessageContactRepository;
import com.clubinfo.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MessageContactService {

    private final MessageContactRepository messageContactRepository;
    private final UtilisateurRepository utilisateurRepository;

    @Transactional
    public MessageContactDTO soumettreMessage(MessageContactDTO dto) {
        MessageContact msg = new MessageContact();
        msg.setNom(dto.getNom());
        msg.setEmail(dto.getEmail());
        msg.setSujet(dto.getSujet());
        msg.setMessage(dto.getMessage());
        msg.setTraite(false);

        return mapToDTO(messageContactRepository.save(msg));
    }

    @Transactional(readOnly = true)
    public Page<MessageContactDTO> getMessages(boolean seulementNonTraites, Pageable pageable) {
        if (seulementNonTraites) {
            return messageContactRepository.findByTraite(false, pageable).map(this::mapToDTO);
        }
        return messageContactRepository.findAll(pageable).map(this::mapToDTO);
    }

    @Transactional
    public MessageContactDTO marquerTraite(Long id, Long adminId) {
        MessageContact msg = messageContactRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Message non trouvé"));

        msg.setTraite(true);
        if (adminId != null) {
            Utilisateur admin = utilisateurRepository.findById(adminId).orElse(null);
            msg.setTraitePar(admin);
        }

        return mapToDTO(messageContactRepository.save(msg));
    }

    private MessageContactDTO mapToDTO(MessageContact msg) {
        MessageContactDTO dto = new MessageContactDTO();
        dto.setId(msg.getId());
        dto.setNom(msg.getNom());
        dto.setEmail(msg.getEmail());
        dto.setSujet(msg.getSujet());
        dto.setMessage(msg.getMessage());
        dto.setDateEnvoi(msg.getDateEnvoi());
        dto.setTraite(msg.isTraite());
        if (msg.getTraitePar() != null) {
            dto.setTraiteParId(msg.getTraitePar().getId());
            dto.setTraiteParNomComplet(msg.getTraitePar().getPrenom() + " " + msg.getTraitePar().getNom());
        }
        return dto;
    }
}
