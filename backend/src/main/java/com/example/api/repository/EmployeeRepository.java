package com.example.api.repository;

import com.example.api.model.Employee;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;


@Repository
public interface EmployeeRepository extends CrudRepository<Employee, Long> {

    Optional <Employee> findByMail(String mail);
    

    boolean existsByMail(String mail);
}

