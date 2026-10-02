package com.clubinfo.ist.fichier;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface FichierRepository extends JpaRepository<Fichier, String> {

    @Query("SELECT f FROM Fichier f WHERE f.deposantId IN (SELECT u.id FROM Utilisateur u WHERE u.test = true)")
    List<Fichier> deposesParComptesDeTest();
}
