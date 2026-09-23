package com.clubinfo.ist.inscription.dto;

import com.clubinfo.ist.inscription.entity.StatutPresence;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresenceBulkRequestDto {

    @NotEmpty(message = "La liste des pointages ne peut pas être vide")
    private List<PresenceBulkItemDto> presences;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PresenceBulkItemDto {
        @NotNull(message = "L'ID de l'inscription est obligatoire")
        private Long inscriptionId;

        @NotNull(message = "Le statut de présence est obligatoire (PRESENT, ABSENT, EXCUSE)")
        private StatutPresence statut;

        private String remarque;
    }
}
