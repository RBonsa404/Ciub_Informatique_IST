package com.example.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import lombok.Data;
@Data
public class LoginRequestDTO {
    @NotBlank(message = "L'email ne doit pas etre vide ")
    @Email(message= "Email doit etre valide ")
    private String mail;

    @NotBlank(message = "Le mot de passe ne peut pas etre vide ")
    private String password;
    
}
