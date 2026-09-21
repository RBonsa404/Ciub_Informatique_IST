package com.clubinfo.service;

import com.clubinfo.entity.Devoir;
import com.clubinfo.repository.DevoirRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DevoirService {
    private final DevoirRepository repository;

    public List<Devoir> findAll() {
        return repository.findAll();
    }

    public Optional<Devoir> findById(Long id) {
        return repository.findById(id);
    }

    public Devoir save(Devoir entity) {
        return repository.save(entity);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
