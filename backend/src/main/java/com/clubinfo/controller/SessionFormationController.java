package com.clubinfo.controller;

import com.clubinfo.entity.SessionFormation;
import com.clubinfo.service.SessionFormationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/sessionformations")
@RequiredArgsConstructor
public class SessionFormationController {
    private final SessionFormationService service;

    @GetMapping
    public List<SessionFormation> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<SessionFormation> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public SessionFormation create(@RequestBody SessionFormation entity) {
        return service.save(entity);
    }
}
