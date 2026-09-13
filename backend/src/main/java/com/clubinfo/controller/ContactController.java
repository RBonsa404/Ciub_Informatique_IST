package com.clubinfo.controller;

import com.clubinfo.dto.MessageContactDTO;
import com.clubinfo.service.MessageContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class ContactController {

    private final MessageContactService messageContactService;

    @PostMapping
    public ResponseEntity<MessageContactDTO> envoyerMessage(@Valid @RequestBody MessageContactDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(messageContactService.soumettreMessage(dto));
    }
}
