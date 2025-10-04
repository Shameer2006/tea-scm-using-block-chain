# Tea Supply Chain Management System

A comprehensive blockchain-based tea supply chain management platform built with React, React Native, and Solidity smart contracts.

## 🌟 Features

### Web Application
- **Dashboard**: Real-time analytics and supply chain overview
- **Product Management**: Create, track, and manage tea products
- **Traceability**: Interactive map showing product journey from farm to cup
- **QR Scanner**: Scan product QR codes for instant information
- **Analytics**: Comprehensive insights and performance metrics
- **Profile Management**: Stakeholder registration and credential management
- **Business Chat**: Real-time messaging between stakeholders for negotiations

### Mobile Application
- **Native Mobile Experience**: React Native app for iOS and Android
- **Offline Capability**: Work without internet connection
- **Camera Integration**: Built-in QR code scanning
- **Location Tracking**: GPS integration for real-time location updates
- **Push Notifications**: Real-time alerts and updates

### Blockchain Features
- **Smart Contracts**: Automated business logic and agreements
- **Immutable Records**: Tamper-proof transaction history
- **Multi-Stakeholder Support**: Farmers, processors, exporters, importers, retailers
- **Quality Assurance**: Automated quality testing and certification
- **Compliance Management**: Regulatory requirement tracking

## 🏗️ Architecture

```
├── frontend/          # React web application
├── mobile-app/        # React Native mobile app
├── contracts/         # Solidity smart contracts
├── backend/           # Node.js backend services (optional)
└── docs/             # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- MetaMask wallet
- Git

### 1. Clone Repository
```bash
git clone <repository-url>
cd tea2
```

### 2. Deploy Smart Contract

#### Using Remix IDE:
1. Open [Remix IDE](https://remix.ethereum.org/)
2. Create new file `TeaSupplyChain.sol`
3. Copy contract code from `contracts/TeaSupplyChain.sol`
4. Compile with Solidity 0.8.19+
5. Deploy to your preferred network (Sepolia testnet recommended)
6. Copy the deployed contract address and ABI

### 3. Setup Web Application
```bash
cd frontend
npm install
```

#### Configure Web3 Connection:
1. Open `src/context/Web3Context.js`
2. Replace `CONTRACT_ADDRESS` with your deployed contract address
3. Replace `CONTRACT_ABI` with your contract ABI

```javascript
const CONTRACT_ADDRESS = "0xYourContractAddress";
const CONTRACT_ABI = [/* Your Contract ABI */];
```

#### Start Development Server:
```bash
npm start
```

### 4. Setup Mobile Application
```bash
cd mobile-app
npm install
```

#### Start Expo Development:
```bash
npx expo start
```

## 📱 Mobile App Installation

### Development
1. Install Expo Go app on your device
2. Scan QR code from Expo development server
3. App will load on your device

### Production Build
```bash
# Android
npx expo build:android

# iOS
npx expo build:ios
```

## 🔧 Configuration

### Environment Variables
Create `.env` file in frontend directory:
```env
REACT_APP_CONTRACT_ADDRESS=0xYourContractAddress
REACT_APP_NETWORK_ID=11155111
REACT_APP_INFURA_PROJECT_ID=your_infura_id
```

### Network Configuration
The app supports multiple networks:
- **Mainnet**: Production deployment
- **Sepolia**: Testnet for development
- **Localhost**: Local development with Ganache

## 🎯 Usage Guide

### For Farmers
1. **Register**: Connect wallet and register as farmer
2. **Create Products**: Add new tea batches with details
3. **Quality Tests**: Record quality test results
4. **Transfer**: Send products to processors

### For Processors
1. **Receive Products**: Accept products from farmers
2. **Processing**: Update processing status and methods
3. **Quality Control**: Add processing quality tests
4. **Export Preparation**: Mark products ready for export
5. **Business Communication**: Chat with farmers and exporters

### For Exporters/Importers
1. **Product Discovery**: Browse products ready for export
2. **Business Negotiations**: Chat with processors for pricing and terms
3. **Shipment Tracking**: Monitor products in transit
4. **Documentation**: Manage export/import documents
5. **Customs**: Handle customs clearance
6. **Delivery Confirmation**: Confirm receipt

### For Retailers
1. **Inventory Management**: Track received products
2. **Customer Information**: Provide traceability to customers
3. **Sales Recording**: Record final sales transactions

## 💬 Business Chat System

### Real-time Communication
- **Floating Widget**: Always accessible chat button on Products and Traceability pages
- **Multi-stakeholder**: Connect farmers, processors, exporters, importers, and retailers
- **Product Context**: Chat about specific batches and products
- **Persistent Messages**: Conversations saved locally for continuity

### Chat Features
- **Batch Requests**: Exporters can request specific batches from processors
- **Business Negotiations**: Discuss pricing, quality, delivery terms
- **Unread Indicators**: Visual notifications for new messages
- **Contact Management**: Automatic stakeholder identification

## 🔍 QR Code Integration

### Generating QR Codes
Products automatically generate QR codes containing:
- Batch ID
- Product information
- Blockchain transaction hash
- Traceability link

### Scanning QR Codes
- **Web**: Use QR Scanner page with camera
- **Mobile**: Built-in camera scanner
- **Manual**: Enter batch ID manually

## 🗺️ Map Integration

### Location Tracking
- **Real-time GPS**: Track product locations
- **Interactive Maps**: Leaflet.js integration
- **Journey Visualization**: Show complete supply chain path
- **Geofencing**: Location-based alerts

### Supported Map Features
- Satellite and street view
- Custom markers for each stakeholder
- Route optimization
- Offline map caching (mobile)

## 📊 Analytics Dashboard

### Key Metrics
- Total products tracked
- Supply chain efficiency
- Quality scores
- Transit times
- Stakeholder performance

### Visualizations
- Line charts for trends
- Pie charts for distributions
- Bar charts for comparisons
- Heat maps for geographic data

## 🔐 Security Features

### Blockchain Security
- Private key management
- Multi-signature wallets
- Smart contract auditing
- Access control mechanisms

### Application Security
- JWT authentication
- API rate limiting
- Input validation
- XSS protection
- CSRF protection

## 🧪 Testing

### Smart Contract Testing
```bash
cd contracts
npm install
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

### Mobile Testing
```bash
cd mobile-app
npm test
```

## 📦 Deployment

### Web Application
```bash
cd frontend
npm run build
# Deploy build folder to your hosting service
```

### Mobile Application
```bash
cd mobile-app
# Android
npx expo build:android

# iOS  
npx expo build:ios
```

### Smart Contracts
1. Use Remix IDE for quick deployment
2. Or use Hardhat/Truffle for advanced deployment
3. Verify contracts on Etherscan

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

#### MetaMask Connection Issues
- Ensure MetaMask is installed and unlocked
- Check network configuration
- Verify contract address and ABI

#### Mobile App Issues
- Clear Expo cache: `npx expo start -c`
- Restart Metro bundler
- Check device permissions

#### Smart Contract Issues
- Verify contract deployment
- Check gas limits
- Ensure proper network selection

### Getting Help
- Create GitHub issue for bugs
- Join our Discord community
- Check documentation wiki
- Contact support team

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ Basic supply chain tracking
- ✅ QR code integration
- ✅ Mobile application
- ✅ Web dashboard

### Phase 2 (Next)
- 🔄 IoT sensor integration
- 🔄 Advanced analytics
- 🔄 Multi-language support
- 🔄 API marketplace
- ✅ Business chat system
- ✅ Export workflow management

### Phase 3 (Future)
- 📋 AI-powered insights
- 📋 Cross-chain compatibility
- 📋 Enterprise integrations
- 📋 Global marketplace

## 📈 Performance

### Optimization Tips
- Use React.memo for component optimization
- Implement lazy loading for routes
- Optimize images and assets
- Use service workers for caching
- Implement proper state management

### Monitoring
- Set up error tracking (Sentry)
- Monitor performance metrics
- Track user analytics
- Monitor blockchain transactions

---

**Built with ❤️ for the tea industry**

*Bringing transparency and trust to the global tea supply chain through blockchain technology.*