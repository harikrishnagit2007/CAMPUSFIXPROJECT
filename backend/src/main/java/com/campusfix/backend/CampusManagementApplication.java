package com.campusfix.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * CampusFix & CampusFind AI - Spring Boot Application
 *
 * Integrated Smart Campus Issue Reporting and Lost & Found Management System
 * Backed by MySQL relational database and Spring Data JPA.
 */
@SpringBootApplication
public class CampusManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(CampusManagementApplication.class, args);
    }
}
