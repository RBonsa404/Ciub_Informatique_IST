package bf.ist.clubinfo;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Test de fumée : vérifie que le contexte Spring démarre (config, sécurité,
 * CORS, OpenAPI). Sert de garde-fou minimal pour la CI GitHub Actions tant
 * que les tests d'intégration par module ne sont pas encore écrits.
 */
@SpringBootTest
@ActiveProfiles("test")
class ClubInformatiqueApplicationTests {

    @Test
    void contextLoads() {
    }
}
