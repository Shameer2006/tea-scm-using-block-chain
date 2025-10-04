# Tea Scanner Flutter App

A mobile QR code scanner app for the Tea Supply Chain Management System.

## Features

- **QR Code Scanning**: Real-time camera-based QR code detection
- **Product Traceability**: View complete supply chain journey
- **Interactive Map**: Visualize product locations on map
- **Timeline View**: Step-by-step transaction history
- **Offline Support**: Works without internet connection
- **Modern UI**: Clean, intuitive interface

## Screenshots

### Home Screen
- Welcome screen with app branding
- Quick access to scanner
- Feature highlights

### QR Scanner
- Real-time camera preview
- Overlay frame for QR positioning
- Flash toggle support
- Automatic code detection

### Traceability
- Product information display
- Interactive map with markers
- Timeline of transactions
- Stakeholder details

## Installation

### Prerequisites
- Flutter SDK 3.0+
- Android Studio / VS Code
- Android device or emulator

### Setup
```bash
cd flutter-tea-scanner
flutter pub get
flutter run
```

### Build APK
```bash
flutter build apk --release
```

## QR Code Format

The app recognizes these QR code formats:
- `TEA-BATCH123ABC` (with prefix)
- `TEABATCH123ABC` (direct batch ID)
- URLs containing batch IDs

## Permissions

### Android
- `CAMERA`: For QR code scanning
- `INTERNET`: For API calls (optional)

### iOS
- Camera usage description in Info.plist

## Dependencies

- `qr_code_scanner`: QR code detection
- `flutter_map`: Interactive maps
- `http`: API communication
- `fluttertoast`: User notifications

## Architecture

```
lib/
├── main.dart              # App entry point
├── screens/
│   ├── home_screen.dart   # Welcome screen
│   ├── qr_scanner_screen.dart  # Camera scanner
│   └── traceability_screen.dart # Product details
```

## Integration

This app works with:
- Tea Supply Chain Web App
- Blockchain smart contracts
- Admin approval system

## Usage

1. **Launch App**: Open Tea Scanner
2. **Start Scanning**: Tap "Start Scanning"
3. **Scan QR Code**: Point camera at tea product QR
4. **View Details**: See product journey and map
5. **Navigate**: Use back button to scan more codes

## Development

### Adding New Features
1. Create new screen in `lib/screens/`
2. Add navigation in existing screens
3. Update dependencies in `pubspec.yaml`
4. Test on physical device

### API Integration
- Update base URL in traceability screen
- Add authentication headers
- Handle network errors gracefully

## Troubleshooting

### Camera Issues
- Check device permissions
- Restart app if camera freezes
- Ensure good lighting for scanning

### Build Issues
- Run `flutter clean && flutter pub get`
- Check Flutter and Dart versions
- Update dependencies if needed

## Future Enhancements

- [ ] Offline data caching
- [ ] Push notifications
- [ ] Multi-language support
- [ ] Batch scanning mode
- [ ] Export functionality
- [ ] User authentication

---

**Built for the Tea Supply Chain Management System**