package com.clubinfo.ist.page.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageInfoDto {

    private Long id;
    private String slug;
    private String titre;
    private String contenu;
    private Long modifieParId;
    private String modifieParNom;
    private LocalDateTime updatedAt;
}
