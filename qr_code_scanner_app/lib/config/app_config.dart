class AppConfig {
  // Blockchain Configuration
  static const String contractAddress = "0xYourContractAddress"; // Replace with deployed contract
  static const String rpcUrl = "https://sepolia.infura.io/v3/your_infura_id"; // Replace with your Infura ID
  static const String networkName = "Sepolia Testnet";
  
  // API Configuration (if using backend)
  static const String apiBaseUrl = "https://your-api-domain.com/api";
  
  // App Configuration
  static const String appName = "Tea Scanner";
  static const String appVersion = "1.0.0";
  
  // QR Code Configuration
  static const List<String> supportedPrefixes = ["TEA-", "TEA"];
  
  // Map Configuration
  static const String mapTileUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  static const double defaultZoom = 8.0;
  
  // Default coordinates (Colombo, Sri Lanka)
  static const double defaultLat = 6.9271;
  static const double defaultLng = 79.8612;
}