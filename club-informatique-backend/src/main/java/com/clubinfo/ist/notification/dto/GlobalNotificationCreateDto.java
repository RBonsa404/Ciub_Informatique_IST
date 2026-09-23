package com.clubinfo.ist.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GlobalNotificationCreateDto {

    @NotBlank(message = "Le titre de la notification est obligatoire")
    @Size(min = 3, max = 200)
    private String titre;

    @NotBlank(message = "Le message est obligatoire")
    private String message;

    @Size(max = 500)
    private String lien;
}
