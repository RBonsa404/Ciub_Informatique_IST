package com.clubinfo.service;
import com.clubinfo.entity.Inscription;
import com.clubinfo.entity.SessionFormation;
import com.clubinfo.repository.InscriptionRepository;
import com.clubinfo.repository.SessionFormationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InscriptionService {
    private final InscriptionRepository repository;
    private final SessionFormationRepository sessionRepository;

    public List<Inscription> findAll() { return repository.findAll(); }
    public Optional<Inscription> findById(Long id) { return repository.findById(id); }
    
    public Inscription save(Inscription inscription) {
        if (inscription.getSession() != null && inscription.getSession().getId() != null) {
            SessionFormation session = sessionRepository.findById(inscription.getSession().getId()).orElseThrow();
            long currentInscriptions = repository.findAll().stream()
                .filter(i -> i.getSession() != null && i.getSession().getId().equals(session.getId()) && com.clubinfo.entity.StatutInscription.ANNULE != i.getStatut())
                .count();
            if (currentInscriptions >= session.getCapaciteMax()) {
                throw new RuntimeException("Capacité maximale atteinte pour cette session");
            }
            
            boolean doublon = repository.findAll().stream()
                .anyMatch(i -> i.getSession() != null && i.getSession().getId().equals(session.getId()) 
                            && i.getMembreId().equals(inscription.getMembreId()));
            if (doublon && inscription.getId() == null) {
                throw new RuntimeException("L'utilisateur est déjà inscrit à cette session");
            }
        }
        return repository.save(inscription);
    }
    public void deleteById(Long id) { repository.deleteById(id); }
}