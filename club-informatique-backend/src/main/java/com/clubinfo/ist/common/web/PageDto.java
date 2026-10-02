package com.clubinfo.ist.common.web;

import org.springframework.data.domain.Page;

import java.util.List;

/** Enveloppe de pagination uniforme de l'API. */
public record PageDto<T>(List<T> content, int page, int size, long totalElements, int totalPages) {

    public static <T> PageDto<T> de(Page<T> page) {
        return new PageDto<>(page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }
}
