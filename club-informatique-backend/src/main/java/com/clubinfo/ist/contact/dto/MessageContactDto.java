package com.clubinfo.ist.contact.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageContactDto {

    private Long id;
    private String nom;
    private String email;
    private String sujet;
    private String message;
    private Boolean traite;
    private LocalDateTime dateReponse;
    private Long reponseParId;
    private String reponseParNom;
    private LocalDateTime createdAt;
}
