package com.clubinfo.ist.categorie.service;

import com.clubinfo.ist.categorie.dto.CategorieDto;
import com.clubinfo.ist.categorie.dto.CategorieRequestDto;

import java.util.List;

public interface CategorieService {

    List<CategorieDto> getAllCategories();

    CategorieDto getCategorieById(Long id);

    CategorieDto getCategorieBySlug(String slug);

    CategorieDto createCategorie(CategorieRequestDto dto);

    CategorieDto updateCategorie(Long id, CategorieRequestDto dto);

    void deleteCategorie(Long id);
}
