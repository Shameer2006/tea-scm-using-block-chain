@echo off
echo Building Flutter Tea Scanner APK...
echo.

echo Step 1: Getting Flutter dependencies...
call flutter pub get
if %errorlevel% neq 0 (
    echo Error: Failed to get dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Building APK...
call flutter build apk --release
if %errorlevel% neq 0 (
    echo Error: Build failed
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo APK location: build\app\outputs\flutter-apk\app-release.apk
echo.
echo You can install this APK on your Android device.
pause