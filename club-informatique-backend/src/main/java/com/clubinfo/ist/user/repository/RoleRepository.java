package com.clubinfo.ist.user.repository;

import com.clubinfo.ist.user.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByNom(String nom);

    boolean existsByNom(String nom);
}
