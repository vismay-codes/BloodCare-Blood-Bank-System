# Blood Bank Donor Matching \& Stock Expiry System

A fresher-friendly full-stack project demonstrating donor matching, blood-stock management, request prioritization, expiry monitoring, and analytics.

## Technology Stack

* Java 26
* Spring Boot 4.1.1
* Spring JDBC (JdbcTemplate); no JPA/Hibernate
* MySQL 8.x
* REST APIs
* HTML, CSS, and vanilla JavaScript
* PriorityQueue for request prioritization
* Optional Python 3.12+ tools for sample data and demand analysis
* Optional scikit-learn forecasting script

Node.js, React, Docker, Redis, JWT, and JPA/Hibernate are not required.

## Main Features

1. Donor registration, search, and pagination
2. Blood-group compatibility matching
3. 90-day donor eligibility checks
4. Priority-based urgent request handling
5. Blood-stock addition, issue, and monitoring
6. Alerts for units expiring within three days
7. Request fulfilment using available stock and eligible donors
8. Analytics dashboard with summary cards and charts
9. Optional Python sample-data generation and demand analysis
10. Rule-based BloodCare Assistant
11. Responsive dashboard with donor, request, stock, analytics, map, and About sections

## Requirements

* JDK 26
* MySQL Server 8.x
* Maven 3.9+ (or IDE Maven support)
* Modern web browser

Python 3.12+ is needed only for the optional Python tools.

## Database Setup

1. Start the MySQL service.
2. Open `database/schema.sql` in MySQL Workbench.
3. Review the script and execute it to create the `blood\\\_bank\\\_db` database, tables, indexes, and demo data.
4. Configure the application with the username and password for your own MySQL installation.

Set these environment variables in PowerShell before starting the application:

&#x20;   $env:DB\_USERNAME = "your\_mysql\_username"
$env:DB\_PASSWORD = "your\_mysql\_password"



Replace the example values with your actual MySQL credentials. Do not publish database passwords or API keys.

## Run the Application

Open PowerShell in the project root.

Start with Maven:

&#x20;   mvn spring-boot:run



Alternatively, build the executable JAR:

&#x20;   mvn -DskipTests package



Then run it:

&#x20;   java -jar target/blood-bank-system-1.0.0.jar



Set `DB\\\_USERNAME` and `DB\\\_PASSWORD` in the same PowerShell session before starting either option.

Open the application at:

&#x20;   http://localhost:8080



Keep the terminal running while using the application. Press Ctrl+C in that terminal to stop it.

## Optional Python Tools

From the `python-tools` directory:

&#x20;   python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
python generate\_sample\_data.py
python demand\_analysis.py



The optional forecast script is:

&#x20;   python demand\_forecast.py



These tools are separate from the main Spring Boot application.

## Demo and Limitations

This is an educational demonstration with no login system. It is not intended for real medical decisions or production blood-bank operations.

Compatibility rules are simplified. Actual transfusion decisions require appropriate testing, crossmatching, established blood-bank protocols, and qualified medical professionals.



## \## Screenshots

## 

## \### Dashboard

## 

## !\[BloodCare Dashboard](Screenshots/Dashboard.png)

## 

## \### Donor Management

## 

## !\[BloodCare Donor Management](Screenshots/Donor.png)

## 

## \### Analytics

## 

## !\[BloodCare Analytics](Screenshots/Analytics.png)

