# CampusFix – Smart Campus Maintenance & Lost & Found Management System

[![Java](https://img.shields.io/badge/Java-17%2B%20%2F%2021-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-blue.svg)](https://www.mysql.com/)
[![Flyway](https://img.shields.io/badge/Flyway-Database%20Migration-red.svg)](https://flywaydb.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Maven](https://img.shields.io/badge/Maven-3.8%2B-C71A36.svg)](https://maven.apache.org/)

**CampusFix** is a modern, enterprise-ready full-stack campus management platform. It combines:
1. **Campus Maintenance & Issue Reporting**: Real-time complaint submission, priority triage, automated staff assignment, and lifecycle tracking.
2. **Campus Lost & Found Management (CampusFind AI)**: Lost/found item reporting, automated similarity matching engine, and secure ownership claim verification workflow.

The backend is built with **Java Spring Boot 3.x, Spring Data JPA, and MySQL 8**, following a clean Domain-Driven Layered Object-Oriented Architecture (Entity, Repository, Service, Controller, DTO).

---

## 📋 Table of Contents

- [System Prerequisites](#-system-prerequisites)
- [Project Architecture](#-project-architecture)
- [Step 1: MySQL Database Setup](#-step-1-mysql-database-setup)
- [Step 2: Backend Configuration & Environment Variables](#-step-2-backend-configuration--environment-variables)
- [Step 3: Build & Run Backend with Maven](#-step-3-build--run-backend-with-maven)
- [Step 4: Frontend Setup & Connecting to Spring Boot](#-step-4-frontend-setup--connecting-to-spring-boot)
- [REST API Endpoints Reference](#-rest-api-endpoints-reference)
- [Database Schema & Migrations](#-database-schema--migrations)
- [Troubleshooting & Common Issues](#-troubleshooting--common-issues)

---

## 🛠️ System Prerequisites

Make sure the following software is installed on your development machine:

| Component | Minimum Version | Verification Command |
|---|---|---|
| **JDK (Java Development Kit)** | Java 17 or Java 21 | `java -version` |
| **Apache Maven** | 3.8.0+ | `mvn -version` |
| **MySQL Server** | 8.0+ | `mysql --version` |
| **Node.js & npm** | Node 18+ & npm 9+ | `node -v && npm -v` |

---

## 🏛️ Project Architecture

```
campusfix-project/
├── backend/                                # Java Spring Boot 3.x Backend
│   ├── pom.xml                             # Maven build configuration & dependencies
│   └── src/main/
│       ├── java/com/campusfix/backend/     # Layered OOP Java code
│       │   ├── CampusManagementApplication.java # Spring Boot entry point
│       │   ├── config/                     # Global exception handlers, CORS, MVC config
│       │   ├── controller/                 # REST Controllers (@RestController)
│       │   ├── dto/                        # Inbound & Outbound Data Transfer Objects
│       │   ├── entity/                     # JPA @Entity models (Complaints, Items, Claims, Users)
│       │   ├── repository/                 # Spring Data JPA Repositories
│       │   └── service/                    # Business logic & matching engine
│       └── resources/
│           ├── application.properties      # Database credentials and JPA configuration
│           └── db/migration/
│               └── V1__init_campus_management.sql # Production Flyway migration script
├── src/                                    # React Frontend (SPA)
│   ├── api/                                # REST API client modules
│   ├── components/                         # Modular UI components
│   ├── pages/                              # Dashboard, Complaints, and Lost & Found views
│   └── services/api.js                     # Centralized API service
├── server.ts                               # Full-stack Node/Vite development server bridge
├── package.json                            # Frontend npm scripts & dependencies
└── README.md                               # Project documentation
```

---

## 🗄️ Step 1: MySQL Database Setup

### 1.1 Start the MySQL Service
Make sure MySQL server is up and running:

- **macOS (Homebrew):**
  ```bash
  brew services start mysql
  ```
- **Linux (Ubuntu/Debian):**
  ```bash
  sudo systemctl start mysql
  sudo systemctl status mysql
  ```
- **Windows:**
  Start the **MySQL** service from `services.msc` or run MySQL Workbench.

### 1.2 Create the Database
Open the MySQL command-line client:
```bash
mysql -u root -p
```

Execute the following SQL statements to initialize the database:
```sql
-- 1. Create the database with UTF-8 character encoding
CREATE DATABASE IF NOT EXISTS campus_management_db 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- 2. Verify database creation
SHOW DATABASES;

-- 3. (Optional) Create a dedicated user for CampusFix
CREATE USER IF NOT EXISTS 'campus_user'@'localhost' IDENTIFIED BY 'CampusFix@2026';
GRANT ALL PRIVILEGES ON campus_management_db.* TO 'campus_user'@'localhost';
FLUSH PRIVILEGES;

EXIT;
```

> **Note on Migrations:** You **do not** need to manually create tables! When the Spring Boot application starts, **Flyway** will automatically execute `V1__init_campus_management.sql` and create all required tables (`users`, `campus_locations`, `complaints`, `lost_found_items`, `item_claims`) along with initial seed data.

---

## ⚙️ Step 2: Backend Configuration & Environment Variables

The backend configuration is managed in `backend/src/main/resources/application.properties`.

### 2.1 Default `application.properties`
```properties
# Server Configuration
server.port=8080
server.servlet.context-path=/

# MySQL Database Connection
spring.datasource.url=jdbc:mysql://localhost:3306/campus_management_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=root
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA & Hibernate Settings
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect

# Flyway Database Migration
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true
spring.flyway.locations=classpath:db/migration

# File Upload Configuration
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```

### 2.2 Setting Custom Environment Variables (Recommended for Production)
You can override any property without modifying `application.properties` by setting environment variables in your terminal:

- **Linux / macOS:**
  ```bash
  export SPRING_DATASOURCE_URL="jdbc:mysql://localhost:3306/campus_management_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"
  export SPRING_DATASOURCE_USERNAME="root"
  export SPRING_DATASOURCE_PASSWORD="your_mysql_password"
  export SERVER_PORT="8080"
  ```

- **Windows (Command Prompt):**
  ```cmd
  set SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/campus_management_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
  set SPRING_DATASOURCE_USERNAME=root
  set SPRING_DATASOURCE_PASSWORD=your_mysql_password
  set SERVER_PORT=8080
  ```

- **Windows (PowerShell):**
  ```powershell
  $env:SPRING_DATASOURCE_URL="jdbc:mysql://localhost:3306/campus_management_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"
  $env:SPRING_DATASOURCE_USERNAME="root"
  $env:SPRING_DATASOURCE_PASSWORD="your_mysql_password"
  $env:SERVER_PORT="8080"
  ```

---

## 🚀 Step 3: Build & Run Backend with Maven

Navigate to the `backend/` folder:
```bash
cd backend
```

### 3.1 Clean and Compile the Project
Download dependencies and compile the Java source code:
```bash
mvn clean compile
```

### 3.2 Run Automated Tests
Execute the JUnit 5 test suite:
```bash
mvn test
```

### 3.3 Package into an Executable JAR
Package the application into a standalone executable Spring Boot JAR file (located in `target/`):
```bash
mvn clean package -DskipTests
```

### 3.4 Run the Backend Application

You can start the backend using either of the following methods:

#### Option A: Run directly with Maven Spring Boot Plugin (Development)
```bash
mvn spring-boot:run
```

#### Option B: Run with custom database credentials via CLI flags
```bash
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.datasource.username=root --spring.datasource.password=your_secret_password"
```

#### Option C: Run the packaged JAR file (Production)
```bash
java -jar target/campusfix-backend-1.0.0.jar
```

### 3.5 Verify the Server is Running
Once started, you will see the Spring Boot banner and the log:
```
Tomcat started on port 8080 (http) with context path ''
Started CampusManagementApplication in 2.845 seconds
```

Test the API in your browser or with `curl`:
```bash
curl http://localhost:8080/api/v1/complaints/stats
```
Expected JSON response:
```json
{
  "total": 5,
  "submitted": 1,
  "in_progress": 2,
  "resolved": 2,
  "emergency": 1
}
```

---

## 💻 Step 4: Frontend Setup & Connecting to Spring Boot

The React frontend is ready to communicate directly with the Spring Boot backend REST endpoints.

### 4.1 Set Environment Variable for the Frontend
In the root directory of the project, create or edit `.env.local`:
```env
# Point to your running Spring Boot server
VITE_JAVA_API_BASE_URL=http://localhost:8080/api
```

### 4.2 Install Frontend Dependencies
From the project root:
```bash
npm install
```

### 4.3 Start Frontend Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser. The frontend will now make real-time REST API requests directly to your Java Spring Boot backend on port `8080`.

---

## 📡 REST API Endpoints Reference

All endpoints return standardized JSON responses and accept `Content-Type: application/json`.

### 1. Maintenance Complaints Module (`/api/v1/complaints`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/complaints` | Fetch all complaints (supports filtering by `category`, `status`, `priority`, `building`) |
| `GET` | `/api/v1/complaints/active` | Fetch all open / in-progress tickets |
| `GET` | `/api/v1/complaints/{idOrCode}` | Retrieve specific complaint details by ID or code (e.g. `CMP-7A2B9C`) |
| `POST` | `/api/v1/complaints` | Submit a new maintenance complaint |
| `PUT` | `/api/v1/complaints/{idOrCode}` | Full update of a complaint record |
| `PATCH` | `/api/v1/complaints/{idOrCode}` | Partial update (status change, staff assignment, notes) |
| `DELETE`| `/api/v1/complaints/{idOrCode}` | Delete a complaint record |
| `GET` | `/api/v1/complaints/stats` | Aggregated dashboard statistics |

### 2. Lost & Found Management Module (`/api/v1/lost-found`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/lost-found/items` | List items (supports filters: `type=LOST|FOUND`, `category`, `status`, `search`) |
| `GET` | `/api/v1/lost-found/items/{idOrCode}` | Retrieve details of a lost or found item |
| `POST` | `/api/v1/lost-found/report` | Report a lost or found item |
| `PUT` | `/api/v1/lost-found/items/{idOrCode}` | Update item report |
| `PATCH` | `/api/v1/lost-found/items/{idOrCode}/status` | Update item status (`OPEN`, `CLAIM_PENDING`, `RETURNED`, `CLOSED`) |
| `DELETE`| `/api/v1/lost-found/items/{idOrCode}` | Delete an item report |
| `GET` | `/api/v1/lost-found/my-reports` | List reports filed by the current user |
| `GET` | `/api/v1/lost-found/items/{idOrCode}/matches` | **Smart Matching Engine**: returns potential candidate matches with match % |
| `GET` | `/api/v1/lost-found/stats` | Summary statistics of items recovered, claimed, and open |

### 3. Ownership Claims & Verification (`/api/v1/lost-found/claims`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/lost-found/claims` | Submit an ownership claim for a found item with proof |
| `GET` | `/api/v1/lost-found/claims/my-claims` | List claims submitted by the authenticated student |
| `GET` | `/api/v1/lost-found/claims/item/{idOrCode}` | View claims associated with a specific item (Staff/Admin) |
| `PATCH` | `/api/v1/lost-found/claims/{claimCode}/status` | Review claim (`APPROVED`, `REJECTED`, `HANDED_OVER`) |

### 4. Campus Locations (`/api/v1/locations`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/locations` | List campus blocks, academic buildings, hostels, and sports grounds |
| `GET` | `/api/v1/locations/{id}` | Get specific location details |

---

## 🗄️ Database Schema & Migrations

The database is managed with **Flyway** in `backend/src/main/resources/db/migration/V1__init_campus_management.sql`:

1. **`users`**:
   - `id`, `user_code`, `email`, `password_hash`, `full_name`, `role` (`STUDENT`, `STAFF`, `ADMIN`), `department`, `phone`, `created_at`.
2. **`campus_locations`**:
   - `id`, `code`, `name`, `category`, `building_number`, `zone`, `floor_count`, `active`.
3. **`complaints`**:
   - `id`, `complaint_code`, `title`, `description`, `category`, `location`, `priority`, `status`, `reporter_id`, `assigned_staff_id`, `image_url`, `created_at`, `resolved_at`.
4. **`lost_found_items`**:
   - `id`, `item_code`, `item_type` (`LOST`, `FOUND`), `title`, `description`, `category`, `location`, `date_lost_or_found`, `reporter_id`, `image_url`, `status`.
5. **`item_claims`**:
   - `id`, `claim_code`, `item_id`, `claimant_id`, `claim_explanation`, `proof_description`, `status` (`PENDING`, `APPROVED`, etc.), `reviewer_id`, `admin_notes`, `created_at`.

---

## 🔧 Troubleshooting & Common Issues

### 1. `Communications link failure` or `Connection refused`
- **Cause:** MySQL is not running or port `3306` is not reachable.
- **Solution:** Verify MySQL status:
  ```bash
  # Check if MySQL is listening on 3306
  netstat -an | grep 3306
  # Start MySQL service
  sudo systemctl start mysql    # Linux
  brew services start mysql     # macOS
  ```

### 2. `Public Key Retrieval is not allowed`
- **Cause:** MySQL 8 uses `caching_sha2_password` authentication by default.
- **Solution:** Ensure `allowPublicKeyRetrieval=true` is present in your JDBC URL:
  ```
  jdbc:mysql://localhost:3306/campus_management_db?allowPublicKeyRetrieval=true&useSSL=false
  ```
  Or change the MySQL user authentication:
  ```sql
  ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root';
  FLUSH PRIVILEGES;
  ```

### 3. `Port 8080 is already in use`
- **Cause:** Another process is running on port 8080.
- **Solution:** Override the port in `application.properties` or via CLI:
  ```bash
  mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8085"
  ```
  Then update `VITE_JAVA_API_BASE_URL=http://localhost:8085/api` in your frontend `.env.local`.

### 4. `Access denied for user 'root'@'localhost'`
- **Cause:** Password mismatch in `application.properties`.
- **Solution:** Pass your actual MySQL password when running Maven:
  ```bash
  export SPRING_DATASOURCE_PASSWORD="your_actual_password"
  mvn spring-boot:run
  ```

---

## 👥 Contributors & Support

- **Institution:** Rajalakshmi Engineering College
- **Developer:** Harikrishna G M (`harikrishna.gm.2025.aids@rajalakshmi.edu.in`)
- **System:** CampusFix & CampusFind AI Management System
