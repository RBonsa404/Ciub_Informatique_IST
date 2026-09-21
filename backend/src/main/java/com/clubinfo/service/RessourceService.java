package com.clubinfo.service;

import com.clubinfo.entity.Ressource;
import com.clubinfo.repository.RessourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RessourceService {
    private final RessourceRepository repository;

    public List<Ressource> findAll() {
        return repository.findAll();
    }

    public Optional<Ressource> findById(Long id) {
        return repository.findById(id);
    }

    public Ressource save(Ressource entity) {
        return repository.save(entity);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
