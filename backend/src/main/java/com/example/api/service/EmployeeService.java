package com.example.api.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.api.dto.EmployeePatchDTO;
import com.example.api.dto.EmployeeUpdateDTO;
import com.example.api.model.Employee;
import com.example.api.repository.EmployeeRepository;

import lombok.Data;

@Data
@Service
public class EmployeeService {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Employee getEmployee(final Long id) {
        return employeeRepository.findById(id).orElseThrow(() -> new RuntimeException("Employee absent"));
    }

    public Iterable<Employee> getEmployees() {
        return employeeRepository.findAll();
    }

    public void deleteEmployee(final Long id) {
        employeeRepository.deleteById(id);
    }

    public void deleteEmployee() {
        employeeRepository.deleteAll();
    }

    public void deleteEmployees() {
        employeeRepository.deleteAll();
    }

    public Employee saveEmployee(Employee employee) {
        employee.setPassword(passwordEncoder.encode(employee.getPassword()));
        Employee savedEmployee = employeeRepository.save(employee);
        return savedEmployee;
    }

    public void deleteEmployeeById(final Long id) {
        if (!employeeRepository.existsById(id)) {
            System.out.println("Il n'y a pas de user");
        }
        employeeRepository.deleteById(id);
    }

    /**
     * Mise à jour complète (PUT). Le mot de passe n'est modifié que s'il est fourni ;
     * sinon le hash existant est conservé.
     */
    public Employee updateEmployee(final Long id, EmployeeUpdateDTO dto) {
        Employee employee = getEmployee(id);
        if (!employee.getMail().equalsIgnoreCase(dto.getMail()) && employeeRepository.existsByMail(dto.getMail())) {
            System.out.println("Le mail existe deja ");
        }
        employee.setFirstName(dto.getFirstName());
        employee.setLastName(dto.getLastName());
        employee.setMail(dto.getMail());
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            employee.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        return employeeRepository.save(employee);
    }

    /**
     * Mise à jour partielle (PATCH). Seuls les champs non-nuls du DTO sont appliqués.
     */
    public Employee partialUpdate(final Long id, EmployeePatchDTO dto) {
        Employee employee = getEmployee(id);

        if (dto.getFirstName() != null) {
            employee.setFirstName(dto.getFirstName());
        }
        if (dto.getLastName() != null) {
            employee.setLastName(dto.getLastName());
        }
        if (dto.getMail() != null) {
            if (!employee.getMail().equalsIgnoreCase(dto.getMail()) && employeeRepository.existsByMail(dto.getMail())) {
                throw new RuntimeException("L'Email existe deja ");
            }
            employee.setMail(dto.getMail());
        }
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            employee.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        return employeeRepository.save(employee);
    }
}