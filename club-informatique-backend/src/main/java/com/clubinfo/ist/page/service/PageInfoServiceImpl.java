package com.clubinfo.ist.page.service;

import com.clubinfo.ist.common.exception.ResourceNotFoundException;
import com.clubinfo.ist.page.dto.PageInfoDto;
import com.clubinfo.ist.page.dto.PageInfoUpdateDto;
import com.clubinfo.ist.page.entity.PageInfo;
import com.clubinfo.ist.page.mapper.PageInfoMapper;
import com.clubinfo.ist.page.repository.PageInfoRepository;
import com.clubinfo.ist.user.entity.Utilisateur;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PageInfoServiceImpl implements PageInfoService {

    private final PageInfoRepository pageInfoRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final PageInfoMapper pageInfoMapper;

    @Override
    @Transactional(readOnly = true)
    public PageInfoDto getPageBySlug(String slug) {
        PageInfo page = pageInfoRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("PageInfo", "slug", slug));
        return pageInfoMapper.toDto(page);
    }

    @Override
    @Transactional
    public PageInfoDto updatePage(String slug, String userEmail, PageInfoUpdateDto dto) {
        Utilisateur modificateur = utilisateurRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "email", userEmail));

        PageInfo page = pageInfoRepository.findBySlug(slug)
                .orElseGet(() -> PageInfo.builder().slug(slug).build());

        page.setTitre(dto.getTitre());
        page.setContenu(dto.getContenu());
        page.setModifiePar(modificateur);

        page = pageInfoRepository.save(page);
        log.info("Page informative '{}' mise à jour par {}", slug, userEmail);
        return pageInfoMapper.toDto(page);
    }
}
