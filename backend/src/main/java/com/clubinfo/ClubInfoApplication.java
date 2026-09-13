package com.clubinfo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Point d'entrée principal de l'application Club Informatique.
 */
@SpringBootApplication
@EnableAsync
public class ClubInfoApplication {

    public static void main(String[] args) {
        SpringApplication.run(ClubInfoApplication.class, args);
    }
}
