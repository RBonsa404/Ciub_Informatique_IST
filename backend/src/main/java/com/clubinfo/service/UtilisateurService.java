package com.clubinfo.service;

import com.clubinfo.dto.UserDTO;
import com.clubinfo.entity.*;
import com.clubinfo.exception.ResourceNotFoundException;
import com.clubinfo.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;

    @Transactional(readOnly = true)
    public Page<UserDTO> getAllUsers(Pageable pageable) {
        return utilisateurRepository.findAll(pageable).map(UtilisateurService::mapToDTO);
    }

    @Transactional(readOnly = true)
    public UserDTO getUserById(Long id) {
        Utilisateur u = utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé avec l'id : " + id));
        return mapToDTO(u);
    }

    @Transactional
    public UserDTO updateStatut(Long id, StatutUtilisateur statut) {
        Utilisateur u = utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé avec l'id : " + id));
        u.setStatut(statut);
        return mapToDTO(utilisateurRepository.save(u));
    }

    public static UserDTO mapToDTO(Utilisateur u) {
        UserDTO.UserDTOBuilder builder = UserDTO.builder()
                .id(u.getId())
                .nom(u.getNom())
                .prenom(u.getPrenom())
                .email(u.getEmail())
                .dtype(u.getClass().getSimpleName())
                .statut(u.getStatut())
                .photo(u.getPhoto())
                .consentementRgpd(u.isConsentementRgpd())
                .totpEnabled(u.isTotpEnabled())
                .dateCreation(u.getDateCreation())
                .derniereConnexion(u.getDerniereConnexion())
                .roles(u.getRoles().stream().map(Role::getNom).collect(Collectors.toList()));

        if (u instanceof Membre m) {
            builder.numeroMembre(m.getNumeroMembre())
                   .biographie(m.getBiographie())
                   .dateAdhesion(m.getDateAdhesion())
                   .filiere(m.getFiliere())
                   .anneeEtude(m.getAnneeEtude());
        } else if (u instanceof Formateur f) {
            builder.specialite(f.getSpecialite())
                   .biographieProfessionnelle(f.getBiographieProfessionnelle());
        } else if (u instanceof ResponsableClub r) {
            builder.fonction(r.getFonction());
        } else if (u instanceof Administrateur a) {
            builder.niveauAcces(a.getNiveauAcces());
        }

        return builder.build();
    }
}
