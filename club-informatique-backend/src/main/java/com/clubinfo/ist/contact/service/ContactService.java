package com.clubinfo.ist.contact.service;

import com.clubinfo.ist.contact.dto.MessageContactCreateDto;
import com.clubinfo.ist.contact.dto.MessageContactDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ContactService {

    MessageContactDto envoyerMessage(MessageContactCreateDto dto);

    Page<MessageContactDto> getAllMessages(Boolean traite, Pageable pageable);

    MessageContactDto marquerCommeTraite(Long id, String repondeurEmail);
}
