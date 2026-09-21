package com.clubinfo.controller;

import com.clubinfo.entity.Presence;
import com.clubinfo.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/presences")
@RequiredArgsConstructor
public class PresenceController {
    private final PresenceService service;

    @GetMapping
    public List<Presence> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Presence> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Presence create(@RequestBody Presence entity) {
        return service.save(entity);
    }
}
