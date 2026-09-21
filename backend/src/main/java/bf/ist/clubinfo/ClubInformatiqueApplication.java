package bf.ist.clubinfo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Point d'entrée de l'API REST de la plateforme du Club Informatique.
 *
 * Squelette initialisé par OUARE Arnaud (section 2.6 du document de dispatch
 * d'architecture) : configuration transverse uniquement. Les entités,
 * services et controllers métier sont ajoutés par chaque membre dans son
 * module (utilisateur, evenement, formation, ...).
 */
@SpringBootApplication
public class ClubInformatiqueApplication {

    public static void main(String[] args) {
        SpringApplication.run(ClubInformatiqueApplication.class, args);
    }
}
