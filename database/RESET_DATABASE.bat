@echo off
echo This will recreate the blood_bank_db database and demo data.
set /p DBPASS=Enter MySQL root password:
mysql -u root -p%DBPASS% < schema.sql
if errorlevel 1 (
 echo Database setup failed. Check that MySQL is running and the password is correct.
) else (
 echo Database setup completed.
)
pause
