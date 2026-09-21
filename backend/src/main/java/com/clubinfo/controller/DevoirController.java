package com.clubinfo.controller;

import com.clubinfo.entity.Devoir;
import com.clubinfo.service.DevoirService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/devoirs")
@RequiredArgsConstructor
public class DevoirController {
    private final DevoirService service;

    @GetMapping
    public List<Devoir> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Devoir> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Devoir create(@RequestBody Devoir entity) {
        return service.save(entity);
    }
}
