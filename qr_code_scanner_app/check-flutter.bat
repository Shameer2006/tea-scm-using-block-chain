@echo off
echo Checking Flutter installation...
echo.

echo Testing flutter command...
flutter --version
if %errorlevel% neq 0 (
    echo.
    echo Flutter not found! Please:
    echo 1. Download Flutter from https://flutter.dev/docs/get-started/install/windows
    echo 2. Extract to C:\flutter
    echo 3. Add C:\flutter\bin to PATH
    echo 4. Restart command prompt
    echo.
    pause
    exit /b 1
)

echo.
echo Flutter found! Running doctor...
flutter doctor
echo.
pause