package com.clubinfo.service;

import com.clubinfo.dto.ProjetDTO;
import com.clubinfo.entity.Projet;
import com.clubinfo.entity.StatutProjet;
import com.clubinfo.entity.Utilisateur;
import com.clubinfo.exception.ResourceNotFoundException;
import com.clubinfo.repository.ProjetRepository;
import com.clubinfo.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjetService {

    private final ProjetRepository projetRepository;
    private final UtilisateurRepository utilisateurRepository;

    @Transactional(readOnly = true)
    public Page<ProjetDTO> getProjetsByStatut(StatutProjet statut, Pageable pageable) {
        return (statut != null ? projetRepository.findByStatut(statut, pageable) : projetRepository.findAll(pageable))
                .map(this::mapToDTO);
    }

    @Transactional(readOnly = true)
    public ProjetDTO getProjetById(Long id) {
        Projet p = projetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));
        return mapToDTO(p);
    }

    @Transactional
    public ProjetDTO soumettreProjet(ProjetDTO dto, Long soumetteurId) {
        Utilisateur s = utilisateurRepository.findById(soumetteurId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        Projet p = new Projet();
        p.setTitre(dto.getTitre());
        p.setDescription(dto.getDescription());
        p.setLienDepot(dto.getLienDepot());
        p.setImageUrl(dto.getImageUrl());
        p.setStatut(StatutProjet.EN_ATTENTE);
        p.setSoumetteur(s);

        return mapToDTO(projetRepository.save(p));
    }

    @Transactional
    public ProjetDTO changerStatut(Long id, StatutProjet statut, Long encadrantId) {
        Projet p = projetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));

        p.setStatut(statut);
        if (encadrantId != null) {
            Utilisateur e = utilisateurRepository.findById(encadrantId).orElse(null);
            p.setEncadrant(e);
        }

        return mapToDTO(projetRepository.save(p));
    }

    private ProjetDTO mapToDTO(Projet p) {
        ProjetDTO dto = new ProjetDTO();
        dto.setId(p.getId());
        dto.setTitre(p.getTitre());
        dto.setDescription(p.getDescription());
        dto.setDateSoumission(p.getDateSoumission());
        dto.setStatut(p.getStatut());
        dto.setLienDepot(p.getLienDepot());
        dto.setImageUrl(p.getImageUrl());
        if (p.getSoumetteur() != null) {
            dto.setSoumetteurId(p.getSoumetteur().getId());
            dto.setSoumetteurNomComplet(p.getSoumetteur().getPrenom() + " " + p.getSoumetteur().getNom());
        }
        if (p.getEncadrant() != null) {
            dto.setEncadrantId(p.getEncadrant().getId());
            dto.setEncadrantNomComplet(p.getEncadrant().getPrenom() + " " + p.getEncadrant().getNom());
        }
        dto.setMembreIds(p.getMembres().stream().map(Utilisateur::getId).collect(Collectors.toList()));
        return dto;
    }
}
