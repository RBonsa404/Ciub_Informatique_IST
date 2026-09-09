package com.example.api.service;

import com.example.api.dto.EmployeePatchDTO;
import com.example.api.dto.EmployeeUpdateDTO;
import com.example.api.exception.EmailAlreadyUsedException;
import com.example.api.exception.EmployeeNotFoundException;
import com.example.api.model.Employee;
import com.example.api.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private EmployeeService employeeService;

    private Employee employee;

    @BeforeEach
    void setUp() {
        employee = new Employee();
        employee.setId(1L);
        employee.setFirstName("Laurent");
        employee.setLastName("GINA");
        employee.setMail("laurentgina@mail.com");
        employee.setPassword("plainPassword");
    }

    @Test
    void getEmployee_shouldReturnEmployee_whenExists() {
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));

        Employee result = employeeService.getEmployee(1L);

        assertThat(result).isEqualTo(employee);
    }

    @Test
    void getEmployee_shouldThrow_whenNotFound() {
        when(employeeRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> employeeService.getEmployee(99L))
                .isInstanceOf(EmployeeNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void getEmployees_shouldReturnAll() {
        when(employeeRepository.findAll()).thenReturn(List.of(employee));

        Iterable<Employee> result = employeeService.getEmployees();

        assertThat(result).containsExactly(employee);
    }

    @Test
    void saveEmployee_shouldHashPasswordAndSave_whenMailNotUsed() {
        when(employeeRepository.existsByMail("laurentgina@mail.com")).thenReturn(false);
        when(passwordEncoder.encode("plainPassword")).thenReturn("hashedPassword");
        when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> inv.getArgument(0));

        Employee result = employeeService.saveEmployee(employee);

        assertThat(result.getPassword()).isEqualTo("hashedPassword");
        verify(employeeRepository).save(employee);
    }

    @Test
    void saveEmployee_shouldThrow_whenMailAlreadyUsed() {
        when(employeeRepository.existsByMail("laurentgina@mail.com")).thenReturn(true);

        assertThatThrownBy(() -> employeeService.saveEmployee(employee))
                .isInstanceOf(EmailAlreadyUsedException.class);

        verify(employeeRepository, never()).save(any());
    }

    @Test
    void deleteEmployeeById_shouldDelete_whenExists() {
        when(employeeRepository.existsById(1L)).thenReturn(true);

        employeeService.deleteEmployeeById(1L);

        verify(employeeRepository).deleteById(1L);
    }

    @Test
    void deleteEmployeeById_shouldThrow_whenNotFound() {
        when(employeeRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> employeeService.deleteEmployeeById(99L))
                .isInstanceOf(EmployeeNotFoundException.class);

        verify(employeeRepository, never()).deleteById(any());
    }

    @Test
    void deleteEmployees_shouldDeleteAll() {
        employeeService.deleteEmployees();

        verify(employeeRepository).deleteAll();
    }

    @Test
    void updateEmployee_shouldUpdateFieldsAndKeepPassword_whenPasswordNotProvided() {
        EmployeeUpdateDTO dto = new EmployeeUpdateDTO();
        dto.setFirstName("Laurent2");
        dto.setLastName("GINA2");
        dto.setMail("laurent2@mail.com");
        // pas de mot de passe fourni

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> inv.getArgument(0));

        Employee result = employeeService.updateEmployee(1L, dto);

        assertThat(result.getFirstName()).isEqualTo("Laurent2");
        assertThat(result.getMail()).isEqualTo("laurent2@mail.com");
        assertThat(result.getPassword()).isEqualTo("plainPassword"); // inchangé
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    void updateEmployee_shouldHashNewPassword_whenProvided() {
        EmployeeUpdateDTO dto = new EmployeeUpdateDTO();
        dto.setFirstName("Laurent");
        dto.setLastName("GINA");
        dto.setMail("laurentgina@mail.com");
        dto.setPassword("newPassword");

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(passwordEncoder.encode("newPassword")).thenReturn("hashedNewPassword");
        when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> inv.getArgument(0));

        Employee result = employeeService.updateEmployee(1L, dto);

        assertThat(result.getPassword()).isEqualTo("hashedNewPassword");
    }

    @Test
    void updateEmployee_shouldThrow_whenNotFound() {
        EmployeeUpdateDTO dto = new EmployeeUpdateDTO();
        when(employeeRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> employeeService.updateEmployee(99L, dto))
                .isInstanceOf(EmployeeNotFoundException.class);
    }

    @Test
    void partialUpdate_shouldOnlyChangeProvidedFields() {
        EmployeePatchDTO dto = new EmployeePatchDTO();
        dto.setFirstName("NouveauPrenom");
        // lastName, mail, password non fournis (null)

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> inv.getArgument(0));

        Employee result = employeeService.partialUpdate(1L, dto);

        assertThat(result.getFirstName()).isEqualTo("NouveauPrenom");
        assertThat(result.getLastName()).isEqualTo("GINA"); // inchangé
        assertThat(result.getMail()).isEqualTo("laurentgina@mail.com"); // inchangé
        assertThat(result.getPassword()).isEqualTo("plainPassword"); // inchangé
    }

    @Test
    void partialUpdate_shouldThrow_whenNotFound() {
        EmployeePatchDTO dto = new EmployeePatchDTO();
        when(employeeRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> employeeService.partialUpdate(99L, dto))
                .isInstanceOf(EmployeeNotFoundException.class);
    }

    @Test
    void updateEmployee_shouldThrow_whenMailAlreadyUsedByOtherEmployee() {
        EmployeeUpdateDTO dto = new EmployeeUpdateDTO();
        dto.setMail("used@mail.com");

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(employeeRepository.existsByMail("used@mail.com")).thenReturn(true);

        assertThatThrownBy(() -> employeeService.updateEmployee(1L, dto))
                .isInstanceOf(EmailAlreadyUsedException.class);
    }

    @Test
    void partialUpdate_shouldThrow_whenMailAlreadyUsedByOtherEmployee() {
        EmployeePatchDTO dto = new EmployeePatchDTO();
        dto.setMail("used@mail.com");

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(employeeRepository.existsByMail("used@mail.com")).thenReturn(true);

        assertThatThrownBy(() -> employeeService.partialUpdate(1L, dto))
                .isInstanceOf(EmailAlreadyUsedException.class);
    }
}