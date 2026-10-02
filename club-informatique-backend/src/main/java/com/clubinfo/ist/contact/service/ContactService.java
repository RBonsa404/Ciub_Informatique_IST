package com.clubinfo.ist.contact.service;

import com.clubinfo.ist.common.courriel.Courriel;
import com.clubinfo.ist.common.courriel.CourrielService;
import com.clubinfo.ist.common.exception.BusinessException;
import com.clubinfo.ist.contact.dto.ContactDtos.MessageContactDto;
import com.clubinfo.ist.contact.dto.ContactDtos.MessageContactSaisie;
import com.clubinfo.ist.contact.entity.MessageContact;
import com.clubinfo.ist.contact.repository.MessageContactRepository;
import com.clubinfo.ist.user.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;

/**
 * Messages envoyés au club par le formulaire de contact : enregistrés, signalés au club par courriel
 * (la réponse part vers l'expéditeur) et confirmés à l'expéditeur par un accusé de réception.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ContactService {

    /** En dessous, le formulaire n'a pas pu être rempli par une personne. */
    private static final long DUREE_MINIMALE_MS = 3_000;

    private final MessageContactRepository messages;
    private final UtilisateurRepository utilisateurs;
    private final CourrielService courriels;

    @Value("${app.contact.destinataire}")
    private String adresseDuClub;

    /** Un envoi automatique est écarté sans erreur : son auteur ne doit pas savoir qu'il a été reconnu. */
    @Transactional
    public void recevoir(MessageContactSaisie saisie) {
        boolean piegeRempli = saisie.siteWeb() != null && !saisie.siteWeb().isBlank();
        if (piegeRempli || saisie.dureeSaisieMs() < DUREE_MINIMALE_MS) {
            log.warn("Message de contact écarté ({})", piegeRempli ? "champ piège rempli" : "saisie trop rapide");
            return;
        }
        String adresse = saisie.email().trim().toLowerCase(Locale.ROOT);
        MessageContact message = messages.save(MessageContact.builder()
                .nom(saisie.nom().trim())
                .email(adresse)
                .sujet(saisie.sujet().trim())
                .message(saisie.message().trim())
                .traite(false)
                .build());

        courriels.envoyer(new Courriel(adresseDuClub, "Message de contact : " + message.getSujet(), """
                Un message vient d'être envoyé depuis le formulaire de contact du site.

                De : %s <%s>
                Sujet : %s

                %s

                Pour répondre, répondez simplement à ce courriel : la réponse partira vers l'expéditeur.
                """.formatted(message.getNom(), adresse, message.getSujet(), message.getMessage()), adresse));
        courriels.envoyer(new Courriel(adresse, "Nous avons bien reçu votre message", """
                Bonjour %s,

                Le Club Informatique de l'IST a bien reçu votre message et vous répondra dès que possible.

                Sujet : %s

                %s
                """.formatted(message.getNom(), message.getSujet(), message.getMessage())));
    }

    @Transactional(readOnly = true)
    public Page<MessageContactDto> lister(Boolean traite, Pageable pageable) {
        Pageable recentsDAbord = pageable.getSort().isSorted() ? pageable
                : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        return messages.lister(traite, recentsDAbord).map(MessageContactDto::de);
    }

    @Transactional
    public MessageContactDto marquerTraite(Long id, Long auteurId) {
        MessageContact message = messages.findById(id)
                .orElseThrow(() -> new BusinessException("Message introuvable.", HttpStatus.NOT_FOUND));
        if (!Boolean.TRUE.equals(message.getTraite())) {
            message.setTraite(true);
            message.setDateReponse(LocalDateTime.now());
            message.setReponsePar(utilisateurs.findById(auteurId).orElse(null));
        }
        return MessageContactDto.de(message);
    }
}
