# CampusFix & CampusFind AI — Spring Boot & MySQL Backend

This is the production-ready Java Spring Boot backend for the integrated **Campus Issue Reporting (CampusFix)** and **Lost & Found Management (CampusFind AI)** platform.

---

## 🛠️ Technology Stack
- **Language**: Java 17+
- **Framework**: Spring Boot 3.2.5
- **Persistence**: Spring Data JPA / Hibernate
- **Database**: MySQL 8.0+
- **Schema Migrations**: Flyway Database Migration
- **Architecture**: Domain-Driven Layered OOP (Entity, Repository, Service, Controller, DTO)

---

## 📁 Project Structure

```
backend/
├── pom.xml
└── src/
    └── main/
        ├── java/
        │   └── com/campusfix/backend/
        │       ├── CampusManagementApplication.java
        │       ├── config/
        │       │   ├── GlobalExceptionHandler.java
        │       │   └── WebMvcConfig.java
        │       ├── controller/
        │       │   ├── CampusLocationController.java
        │       │   ├── ComplaintController.java
        │       │   ├── ItemClaimController.java
        │       │   └── LostFoundController.java
        │       ├── dto/
        │       │   ├── ComplaintRequest.java
        │       │   ├── ComplaintResponse.java
        │       │   ├── DashboardStatsResponse.java
        │       │   ├── ItemClaimRequest.java
        │       │   ├── ItemClaimResponse.java
        │       │   ├── LostFoundItemRequest.java
        │       │   ├── LostFoundItemResponse.java
        │       │   ├── PotentialMatchResult.java
        │       │   └── StatusUpdateRequest.java
        │       ├── entity/
        │       │   ├── CampusLocation.java
        │       │   ├── Complaint.java
        │       │   ├── ItemClaim.java
        │       │   ├── LostFoundItem.java
        │       │   ├── User.java
        │       │   └── enums/
        │       │       ├── ClaimStatus.java
        │       │       ├── ComplaintPriority.java
        │       │       ├── ComplaintStatus.java
        │       │       ├── ItemStatus.java
        │       │       └── ItemType.java
        │       ├── repository/
        │       │   ├── CampusLocationRepository.java
        │       │   ├── ComplaintRepository.java
        │       │   ├── ItemClaimRepository.java
        │       │   ├── LostFoundItemRepository.java
        │       │   └── UserRepository.java
        │       └── service/
        │           ├── CampusLocationService.java
        │           ├── ComplaintService.java
        │           ├── ComplaintServiceImpl.java
        │           ├── LostFoundService.java
        │           └── LostFoundServiceImpl.java
        └── resources/
            ├── application.properties
            └── db/
                └── migration/
                    └── V1__init_campus_management.sql
```

---

## 🚀 How to Run the Spring Boot Backend

### 1. Configure MySQL Database
Make sure your MySQL database is running and credentials match `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/campus_management_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=root
```

Flyway will automatically create and migrate the tables on first startup (`V1__init_campus_management.sql`).

### 2. Build and Start
Run from the `backend/` directory:

```bash
mvn clean package
mvn spring-boot:run
```

The server starts at `http://localhost:8080`.

---

## 🌐 Connecting the React Frontend to the Java Backend

In your React frontend root directory, set the backend URL in `.env.local`:

```env
VITE_JAVA_API_BASE_URL=http://localhost:8080/api
```

The frontend service layer in `src/services/api.js` and `src/api/lostAndFound.js` automatically routes all HTTP requests (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) to the Spring Boot REST endpoints.

---

## 📡 REST API Endpoints Overview

### 1. Maintenance Complaint Tickets (`/api/v1/complaints`)
- `GET    /api/v1/complaints` — Retrieve all complaints (supports filtering by `status`, `category`, `priority`, `building`)
- `GET    /api/v1/complaints/active` — Retrieve active / in-progress tickets
- `GET    /api/v1/complaints/{idOrCode}` — Get single ticket by numeric ID or code (e.g. `CMP-7A2B9C`)
- `POST   /api/v1/complaints` — Create a new maintenance issue report
- `PUT    /api/v1/complaints/{idOrCode}` — Update an existing complaint
- `PATCH  /api/v1/complaints/{idOrCode}` — Partially update status or assigned staff
- `DELETE /api/v1/complaints/{idOrCode}` — Delete a complaint record
- `GET    /api/v1/complaints/stats` — Summary metrics for dashboards

### 2. Lost & Found Management (`/api/v1/lost-found`)
- `GET    /api/v1/lost-found/items` — Retrieve items (filters: `type=LOST|FOUND`, `category`, `building`, `status`, `search`)
- `GET    /api/v1/lost-found/items/{idOrCode}` — Get details for an item
- `POST   /api/v1/lost-found/report` — Report a lost or found item
- `PUT    /api/v1/lost-found/items/{idOrCode}` — Update a report
- `PATCH  /api/v1/lost-found/items/{idOrCode}/status` — Change item status (`OPEN`, `CLAIM_PENDING`, `RETURNED`, `CLOSED`)
- `DELETE /api/v1/lost-found/items/{idOrCode}` — Delete an item report
- `GET    /api/v1/lost-found/my-reports` — Retrieve user's reported items
- `GET    /api/v1/lost-found/items/{idOrCode}/matches` — Smart matching engine finding opposite candidate items
- `GET    /api/v1/lost-found/stats` — Overall Lost & Found stats

### 3. Ownership Claims (`/api/v1/lost-found/claims`)
- `POST   /api/v1/lost-found/claims` — Submit an ownership claim for a found item
- `GET    /api/v1/lost-found/claims/my-claims` — Get active claims submitted by user
- `GET    /api/v1/lost-found/claims/item/{idOrCode}` — Get claims submitted for a specific item
- `PATCH  /api/v1/lost-found/claims/{claimCode}/status` — Review and update claim status (`APPROVED`, `REJECTED`, `HANDED_OVER`)
