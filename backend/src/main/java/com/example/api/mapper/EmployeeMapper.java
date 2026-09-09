package com.example.api.mapper;

import com.example.api.dto.EmployeeRequestDTO;
import com.example.api.dto.EmployeeResponseDTO;
import com.example.api.model.Employee;

/**
 * Conversion manuelle Entity <-> DTO.
 * Volontairement simple (pas de MapStruct) pour rester lisible en formation.
 */
public final class EmployeeMapper {

    private EmployeeMapper() {
    }

    public static EmployeeResponseDTO toResponseDTO(Employee employee) {
        return new EmployeeResponseDTO(
                employee.getId(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getMail(),
                employee.getRole()
        );
    }

    public static Employee toEntity(EmployeeRequestDTO dto) {
        Employee employee = new Employee();
        employee.setFirstName(dto.getFirstName());
        employee.setLastName(dto.getLastName());
        employee.setMail(dto.getMail());
        employee.setPassword(dto.getPassword());
        return employee;
    }
}