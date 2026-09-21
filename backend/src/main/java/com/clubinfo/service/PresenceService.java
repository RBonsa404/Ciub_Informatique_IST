package com.clubinfo.service;

import com.clubinfo.entity.Presence;
import com.clubinfo.repository.PresenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PresenceService {
    private final PresenceRepository repository;

    public List<Presence> findAll() {
        return repository.findAll();
    }

    public Optional<Presence> findById(Long id) {
        return repository.findById(id);
    }

    public Presence save(Presence entity) {
        return repository.save(entity);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
