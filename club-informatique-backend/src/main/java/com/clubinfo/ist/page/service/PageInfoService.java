package com.clubinfo.ist.page.service;

import com.clubinfo.ist.page.dto.PageInfoDto;
import com.clubinfo.ist.page.dto.PageInfoUpdateDto;

public interface PageInfoService {

    PageInfoDto getPageBySlug(String slug);

    PageInfoDto updatePage(String slug, String userEmail, PageInfoUpdateDto dto);
}
