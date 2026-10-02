package com.clubinfo.ist.common.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * Dates de l'API en ISO 8601 UTC. Les horodatages sont conservés en UTC (fuseau de la JVM et de la connexion) ;
 * ils sont écrits avec le suffixe « Z » et lus avec ou sans décalage, puis ramenés en UTC.
 */
@Configuration
public class JacksonConfig {

    private static final DateTimeFormatter SORTIE = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

    /** Écrit un horodatage UTC avec son fuseau. */
    public static String enUtc(LocalDateTime valeur) {
        return SORTIE.format(valeur);
    }

    /** Lit un horodatage ISO 8601, avec ou sans décalage, et le ramène en UTC. */
    public static LocalDateTime depuisIso(String texte) {
        try {
            return OffsetDateTime.parse(texte).withOffsetSameInstant(ZoneOffset.UTC).toLocalDateTime();
        } catch (DateTimeParseException sansDecalage) {
            return LocalDateTime.parse(texte);
        }
    }

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer datesEnUtc() {
        return builder -> builder
                .serializerByType(LocalDateTime.class, new JsonSerializer<LocalDateTime>() {
                    @Override
                    public void serialize(LocalDateTime valeur, JsonGenerator generateur, SerializerProvider fournisseur) throws IOException {
                        generateur.writeString(enUtc(valeur));
                    }
                })
                .deserializerByType(LocalDateTime.class, new JsonDeserializer<LocalDateTime>() {
                    @Override
                    public LocalDateTime deserialize(JsonParser analyseur, DeserializationContext contexte) throws IOException {
                        String texte = analyseur.getValueAsString();
                        if (texte == null || texte.isBlank()) {
                            return null;
                        }
                        try {
                            return depuisIso(texte.trim());
                        } catch (DateTimeParseException invalide) {
                            return (LocalDateTime) contexte.handleWeirdStringValue(LocalDateTime.class, texte, "date attendue au format ISO 8601");
                        }
                    }
                });
    }
}
