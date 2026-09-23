package com.clubinfo.ist.page.mapper;

import com.clubinfo.ist.page.dto.PageInfoDto;
import com.clubinfo.ist.page.entity.PageInfo;
import org.springframework.stereotype.Component;

@Component
public class PageInfoMapper {

    public PageInfoDto toDto(PageInfo page) {
        if (page == null) return null;

        return PageInfoDto.builder()
                .id(page.getId())
                .slug(page.getSlug())
                .titre(page.getTitre())
                .contenu(page.getContenu())
                .modifieParId(page.getModifiePar() != null ? page.getModifiePar().getId() : null)
                .modifieParNom(page.getModifiePar() != null ?
                        page.getModifiePar().getPrenom() + " " + page.getModifiePar().getNom() : null)
                .updatedAt(page.getUpdatedAt() != null ? page.getUpdatedAt() : page.getCreatedAt())
                .build();
    }
}
