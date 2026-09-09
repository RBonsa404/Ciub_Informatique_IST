package com.example.api.controller;

import com.example.api.dto.EmployeePatchDTO;
import com.example.api.dto.EmployeeRequestDTO;
import com.example.api.dto.EmployeeUpdateDTO;
import com.example.api.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests d'intégration bout-en-bout : contrôleur + service + repository + H2
 * (profil "test").
 * 
 * @WithMockUser simule un utilisateur authentifié pour les routes protégées par
 *               Spring Security.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EmployeeControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private com.example.api.model.Employee existingEmployee;

    @BeforeEach
    void setUp() {
        employeeRepository.deleteAll();
        com.example.api.model.Employee employee = new com.example.api.model.Employee();
        employee.setFirstName("Sophie");
        employee.setLastName("FONCEK");
        employee.setMail("sophie.integration@mail.com");
        employee.setPassword(passwordEncoder.encode("motdepasse123"));
        existingEmployee = employeeRepository.save(employee);
    }

    @Test
    void createEmployee_shouldReturn201_whenPublicAndValid() throws Exception {
        EmployeeRequestDTO dto = new EmployeeRequestDTO();
        dto.setFirstName("Agathe");
        dto.setLastName("FEELING");
        dto.setMail("agathe.integration@mail.com");
        dto.setPassword("motdepasse123");

        mockMvc.perform(post("/employee")
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mail").value("agathe.integration@mail.com"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void createEmployee_shouldReturn400_whenInvalidEmail() throws Exception {
        EmployeeRequestDTO dto = new EmployeeRequestDTO();
        dto.setFirstName("Agathe");
        dto.setLastName("FEELING");
        dto.setMail("pas-un-email");
        dto.setPassword("motdepasse123");

        mockMvc.perform(post("/employee")
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.mail").exists());
    }

    @Test
    void createEmployee_shouldReturn409_whenEmailAlreadyUsed() throws Exception {
        EmployeeRequestDTO dto = new EmployeeRequestDTO();
        dto.setFirstName("Sophie");
        dto.setLastName("FONCEK");
        dto.setMail("sophie.integration@mail.com"); // déjà pris dans setUp()
        dto.setPassword("motdepasse123");

        mockMvc.perform(post("/employee")
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict());
    }

    @Test
    void getEmployees_shouldReturn401_whenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/employees"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser
    void getEmployees_shouldReturnList_whenAuthenticated() throws Exception {
        mockMvc.perform(get("/employees"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].mail").value("sophie.integration@mail.com"));
    }

    @Test
    @WithMockUser
    void getEmployee_shouldReturn200_whenExists() throws Exception {
        mockMvc.perform(get("/employee/{id}", existingEmployee.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Sophie"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    @WithMockUser
    void getEmployee_shouldReturn404_whenNotExists() throws Exception {
        mockMvc.perform(get("/employee/{id}", 999999L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value(containsString("999999")));
    }

    @Test
    @WithMockUser
    void updateEmployee_shouldReturn200_whenExists() throws Exception {
        EmployeeUpdateDTO dto = new EmployeeUpdateDTO();
        dto.setFirstName("SophieModifiee");
        dto.setLastName("FONCEK");
        dto.setMail("sophie.integration@mail.com");

        mockMvc.perform(put("/employee/{id}", existingEmployee.getId())
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("SophieModifiee"));
    }

    @Test
    @WithMockUser
    void updateEmployee_shouldReturn404_whenNotExists() throws Exception {
        EmployeeUpdateDTO dto = new EmployeeUpdateDTO();
        dto.setFirstName("X");
        dto.setLastName("Y");
        dto.setMail("x.y@mail.com");

        mockMvc.perform(put("/employee/{id}", 999999L)
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser
    void partialUpdate_shouldReturn200_andOnlyChangeGivenField() throws Exception {
        EmployeePatchDTO dto = new EmployeePatchDTO();
        dto.setFirstName("SophiePatchee");

        mockMvc.perform(patch("/employee/{id}", existingEmployee.getId())
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("SophiePatchee"))
                .andExpect(jsonPath("$.lastName").value("FONCEK"));
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void deleteEmployeeById_shouldReturn204_whenExists() throws Exception {
        mockMvc.perform(delete("/employee/{id}", existingEmployee.getId()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/employee/{id}", existingEmployee.getId()))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void deleteEmployeeById_shouldReturn404_whenNotExists() throws Exception {
        mockMvc.perform(delete("/employee/{id}", 999999L))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void deleteEmployees_shouldReturn204_andEmptyListAfter() throws Exception {
        mockMvc.perform(delete("/employees"))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/employees"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }
}