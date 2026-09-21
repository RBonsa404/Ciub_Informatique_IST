package bf.ist.clubinfo.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Documentation OpenAPI / Swagger UI (accessible sur /swagger-ui.html).
 * Chaque membre doit documenter ses nouveaux endpoints (contrat de la
 * Definition of Done, section 4.6 du document de dispatch).
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI clubInformatiqueOpenAPI() {
        final String securitySchemeName = "bearerAuth";
        return new OpenAPI()
                .info(new Info()
                        .title("API - Plateforme Club Informatique")
                        .description("API REST de gestion des membres, formations, événements, projets et actualités du Club Informatique.")
                        .version("v0.1"))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")));
    }
}
