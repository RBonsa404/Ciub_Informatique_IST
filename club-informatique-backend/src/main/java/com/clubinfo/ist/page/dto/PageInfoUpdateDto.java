package com.clubinfo.ist.page.dto;

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
public class PageInfoUpdateDto {

    @NotBlank(message = "Le titre est obligatoire")
    @Size(min = 2, max = 200)
    private String titre;

    @NotBlank(message = "Le contenu est obligatoire")
    private String contenu;
}
