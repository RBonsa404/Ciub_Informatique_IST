package com.clubinfo.ist.contact.mapper;

import com.clubinfo.ist.contact.dto.MessageContactDto;
import com.clubinfo.ist.contact.entity.MessageContact;
import org.springframework.stereotype.Component;

@Component
public class MessageContactMapper {

    public MessageContactDto toDto(MessageContact message) {
        if (message == null) return null;

        return MessageContactDto.builder()
                .id(message.getId())
                .nom(message.getNom())
                .email(message.getEmail())
                .sujet(message.getSujet())
                .message(message.getMessage())
                .traite(message.getTraite())
                .dateReponse(message.getDateReponse())
                .reponseParId(message.getReponsePar() != null ? message.getReponsePar().getId() : null)
                .reponseParNom(message.getReponsePar() != null ?
                        message.getReponsePar().getPrenom() + " " + message.getReponsePar().getNom() : null)
                .createdAt(message.getCreatedAt())
                .build();
    }
}
