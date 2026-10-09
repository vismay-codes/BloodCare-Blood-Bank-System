@echo off
setlocal
echo ==========================================
echo   BloodCare - Blood Bank System
echo ==========================================
java -version >nul 2>&1
if errorlevel 1 (
  echo ERROR: Java is not available in PATH.
  echo Install/configure JDK 27 and reopen this window.
  pause
  exit /b 1
)
mvn -version >nul 2>&1
if errorlevel 1 (
  echo ERROR: Maven was not found.
  echo Install Apache Maven 3.9+ OR open this folder in IntelliJ IDEA and run the Maven Spring Boot application.
  pause
  exit /b 1
)
echo Starting Spring Boot...
mvn spring-boot:run
pause
