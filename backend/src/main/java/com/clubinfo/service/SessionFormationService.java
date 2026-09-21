package com.clubinfo.service;

import com.clubinfo.entity.SessionFormation;
import com.clubinfo.repository.SessionFormationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SessionFormationService {
    private final SessionFormationRepository repository;

    public List<SessionFormation> findAll() {
        return repository.findAll();
    }

    public Optional<SessionFormation> findById(Long id) {
        return repository.findById(id);
    }

    public SessionFormation save(SessionFormation entity) {
        return repository.save(entity);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
