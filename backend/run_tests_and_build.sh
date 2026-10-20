#!/usr/bin/env bash
# ==============================================================================
# CampusFix Java Spring Boot Backend - Build & Test Script
# ==============================================================================

set -e

echo "=== 1. Checking Java & Maven environment == "
java -version
mvn -version || echo "Maven wrapper or command check..."

echo "=== 2. Navigating to backend directory == "
cd "$(dirname "$0")"

echo "=== 3. Cleaning previous Maven builds == "
mvn clean

echo "=== 4. Compiling Java source files == "
mvn compile

echo "=== 5. Executing Unit & Integration Tests (@DataJpaTest) == "
mvn test

echo "=== 6. Packaging Spring Boot Executable JAR == "
mvn package -DskipTests

echo "=== SUCCESS: Backend compiled, tested, and packaged successfully! == "
echo "To run the server: mvn spring-boot:run"
