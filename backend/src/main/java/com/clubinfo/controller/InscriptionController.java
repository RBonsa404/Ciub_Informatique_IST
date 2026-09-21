package com.clubinfo.controller;

import com.clubinfo.entity.Inscription;
import com.clubinfo.service.InscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inscriptions")
@RequiredArgsConstructor
public class InscriptionController {
    private final InscriptionService service;

    @GetMapping
    public List<Inscription> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Inscription> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Inscription create(@RequestBody Inscription entity) {
        return service.save(entity);
    }
}
