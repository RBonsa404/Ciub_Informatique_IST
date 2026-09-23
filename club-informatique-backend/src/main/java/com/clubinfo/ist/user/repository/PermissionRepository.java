package com.clubinfo.ist.user.repository;

import com.clubinfo.ist.user.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {

    Optional<Permission> findByCode(String code);

    boolean existsByCode(String code);

    default Optional<Permission> findByNom(String nom) {
        return findByCode(nom);
    }
}
