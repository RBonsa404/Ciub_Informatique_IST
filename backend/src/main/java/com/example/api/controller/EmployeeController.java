package com.example.api.controller;

import java.util.Optional;
import java.util.List;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.repository.query.Param;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;

import com.example.api.dto.EmployeePatchDTO;
import com.example.api.dto.EmployeeResponseDTO;
import com.example.api.dto.EmployeeUpdateDTO;
import com.example.api.mapper.EmployeeMapper;
import com.example.api.model.Employee;
import com.example.api.service.EmployeeService;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.http.ResponseEntity;


@RestController
public class EmployeeController {

    @Autowired
    private EmployeeService employeeService;
     

    /**
     * Create - Add a new employee
     *   @Param employee An object employee
     *    @return  the employee object saved
     */

    @PostMapping("/employee")
    public Employee createEmployee(@RequestBody  Employee employee){
        return employeeService.saveEmployee(employee);
    }

    @GetMapping("/employees")
    public List<EmployeeResponseDTO> getEmployees() {
        List<EmployeeResponseDTO> result = new java.util.ArrayList<>();
        employeeService.getEmployees().forEach(e -> result.add(EmployeeMapper.toResponseDTO(e)));
        return result;
    }

    @GetMapping("/employees/{id}")
    public EmployeeResponseDTO getEmployees(@PathVariable("id") final Long id) {
        return EmployeeMapper.toResponseDTO(employeeService.getEmployee(id));
    }

    @PreAuthorize("hasAuthority('Admin')")
    @DeleteMapping("/employee")
    public ResponseEntity<Void> deleteEmployees(){


        employeeService.deleteEmployee();
        return ResponseEntity.noContent().build();

    }
    
    @PreAuthorize("hasAuthority('Admin')")
    @DeleteMapping("/employee/{id}")
    public ResponseEntity<String> deleteEmployeeById(@PathVariable("id") final Long id){
        employeeService.deleteEmployeeById(id);
        return ResponseEntity.ok("Employé supprimé avec succès (id: " + id + ")");
    }
    
    /**
     * Mise à jour complète d'un employé. 404 si absent, 400 si validation échoue.
     */
    @PutMapping("/employee/{id}")
    public EmployeeResponseDTO updateEmployee(@PathVariable Long id, @Valid @RequestBody EmployeeUpdateDTO dto) {
        return EmployeeMapper.toResponseDTO(employeeService.updateEmployee(id, dto));
    }

    /**
     * Mise à jour partielle d'un employé (seuls les champs fournis sont modifiés).
     */
    @PatchMapping("/employee/{id}")
    public EmployeeResponseDTO partialUpdate(@PathVariable Long id, @RequestBody EmployeePatchDTO dto) {
        return EmployeeMapper.toResponseDTO(employeeService.partialUpdate(id, dto));
    }

    
   
}
