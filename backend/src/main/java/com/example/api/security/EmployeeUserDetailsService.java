package com.example.api.security;

import com.example.api.model.Employee;
import com.example.api.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Permet à Spring Security d'authentifier un Employee via son email + mot de passe (haché).
 * Chaque employé a le rôle ROLE_EMPLOYEE ; à faire évoluer si des rôles distincts
 * (ex: ROLE_ADMIN) sont nécessaires plus tard dans le fil rouge.
 */
@Service
public class EmployeeUserDetailsService implements UserDetailsService {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Override
    public UserDetails loadUserByUsername(String mail) throws UsernameNotFoundException {
        Employee employee = employeeRepository.findByMail(mail)
                .orElseThrow(() -> new UsernameNotFoundException("Aucun compte pour l'email : " + mail));

        return User.builder()
                .username(employee.getMail())
                .password(employee.getPassword())
                .authorities(List.of(new SimpleGrantedAuthority(employee.getRole())))
                .build();
    }
}