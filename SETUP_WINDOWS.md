# Windows setup — one-time

## You already have
- JDK 26
- Python
- MySQL

## One additional tool needed for the easiest command-line run
**Apache Maven 3.9+**.

If you use IntelliJ IDEA, you can alternatively open this Maven project in IntelliJ and use its Maven integration, so a separate Maven installation may not be necessary.

No Node.js, Docker, Redis, JPA/Hibernate or JWT is required.

## MySQL
Make sure the MySQL Server service is running.

The default application configuration is:
- database: `blood_bank_db`
- username: `root`
- password: `root`

If your root password is not `root`, edit only `src/main/resources/application.properties`.

Then run `database/schema.sql` once.

## Python
Python is not required to launch the Java web application. It is used for the analytics/ML companion tools.

Recommended:
Python 3.12

Commands:
    cd python-tools
    py -3.12 -m venv .venv
    .venv\Scripts\activate
    pip install -r requirements.txt
    python generate_sample_data.py
    python demand_analysis.py
    python demand_forecast.py

## Start the application
From the project root:
    mvn spring-boot:run

Then open:
    http://localhost:8080

## Important
The UI is self-contained. There is no npm/Node build step and no external image library required. The hero illustration is a local SVG and the UI uses CSS-based glass/3D-style effects, so the project remains runnable offline after Maven dependencies have been downloaded.
