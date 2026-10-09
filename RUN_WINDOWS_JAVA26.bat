@echo off
setlocal
if defined JAVA_HOME_26 (
  set "JAVA_HOME=%JAVA_HOME_26%"
  set "PATH=%JAVA_HOME%\bin;%PATH%"
)
echo Using:
java -version
echo.
call RUN_WINDOWS.bat
