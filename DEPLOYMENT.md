# Deployment Guide

## Smart Contract Deployment

### Using Remix IDE (Recommended for Quick Start)

1. **Open Remix IDE**
   - Go to [https://remix.ethereum.org/](https://remix.ethereum.org/)

2. **Create Contract File**
   - Create new file: `TeaSupplyChain.sol`
   - Copy the contract code from `contracts/TeaSupplyChain.sol`

3. **Compile Contract**
   - Go to Solidity Compiler tab
   - Select compiler version: `0.8.19` or higher
   - Click "Compile TeaSupplyChain.sol"

4. **Deploy Contract**
   - Go to Deploy & Run Transactions tab
   - Select Environment: "Injected Provider - MetaMask"
   - Ensure MetaMask is connected to desired network
   - Click "Deploy"
   - Confirm transaction in MetaMask

5. **Copy Contract Details**
   - Copy deployed contract address
   - Copy ABI from compilation artifacts

### Network Recommendations

#### For Development/Testing
- **Sepolia Testnet**
  - Network ID: 11155111
  - Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
  - Low cost, fast transactions

#### For Production
- **Ethereum Mainnet**
  - Network ID: 1
  - Real ETH required
  - Higher security, higher costs

- **Polygon Mainnet**
  - Network ID: 137
  - Lower transaction costs
  - Faster confirmation times

## Frontend Deployment

### 1. Configure Contract Connection

Update `frontend/src/context/Web3Context.js`:

```javascript
// Replace with your deployed contract address
const CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890";

// Replace with your contract ABI (get from Remix compilation)
const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  // ... rest of your ABI
];
```

### 2. Build for Production

```bash
cd frontend
npm install
npm run build
```

### 3. Deploy to Hosting Services

#### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

#### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=build
```

#### AWS S3 + CloudFront
```bash
aws s3 sync build/ s3://your-bucket-name
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

#### Traditional Web Hosting
- Upload `build` folder contents to your web server
- Configure server to serve `index.html` for all routes

## Mobile App Deployment

### 1. Configure App Settings

Update `mobile-app/app.json`:

```json
{
  "expo": {
    "name": "TeaChain",
    "slug": "tea-supply-chain",
    "version": "1.0.0",
    "platforms": ["ios", "android"],
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#22c55e"
    },
    "android": {
      "package": "com.yourcompany.teachain",
      "versionCode": 1
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.teachain",
      "buildNumber": "1.0.0"
    }
  }
}
```

### 2. Build for Production

#### Android APK
```bash
cd mobile-app
npx expo build:android
```

#### iOS IPA
```bash
cd mobile-app
npx expo build:ios
```

#### Using EAS Build (New Expo Build Service)
```bash
npm install -g @expo/cli
npx expo install expo-dev-client
npx eas build --platform android
npx eas build --platform ios
```

### 3. Publish to App Stores

#### Google Play Store
1. Create developer account
2. Upload APK/AAB file
3. Fill app information
4. Submit for review

#### Apple App Store
1. Create Apple Developer account
2. Use Xcode or Application Loader
3. Upload IPA file
4. Submit for review

## Environment Configuration

### Production Environment Variables

Create `.env.production` in frontend:

```env
REACT_APP_CONTRACT_ADDRESS=0xYourProductionContractAddress
REACT_APP_NETWORK_ID=1
REACT_APP_INFURA_PROJECT_ID=your_infura_project_id
REACT_APP_API_URL=https://api.yourbackend.com
```

### Staging Environment Variables

Create `.env.staging` in frontend:

```env
REACT_APP_CONTRACT_ADDRESS=0xYourStagingContractAddress
REACT_APP_NETWORK_ID=11155111
REACT_APP_INFURA_PROJECT_ID=your_infura_project_id
REACT_APP_API_URL=https://staging-api.yourbackend.com
```

## Backend Services (Optional)

### 1. Node.js API Server

```bash
cd backend
npm install
npm start
```

### 2. Database Setup

#### PostgreSQL
```sql
CREATE DATABASE tea_supply_chain;
CREATE USER tea_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE tea_supply_chain TO tea_user;
```

#### MongoDB
```bash
mongosh
use tea_supply_chain
db.createUser({
  user: "tea_user",
  pwd: "secure_password",
  roles: ["readWrite"]
})
```

### 3. Deploy Backend

#### Heroku
```bash
heroku create tea-supply-chain-api
git push heroku main
```

#### AWS EC2
```bash
# Install Node.js and PM2
sudo apt update
sudo apt install nodejs npm
npm install -g pm2

# Deploy application
git clone your-repo
cd backend
npm install
pm2 start app.js --name tea-api
```

#### Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Domain and SSL Configuration

### 1. Domain Setup
- Purchase domain from registrar
- Configure DNS to point to your hosting service
- Set up subdomains if needed (api.yourdomain.com)

### 2. SSL Certificate
- Use Let's Encrypt for free SSL
- Configure HTTPS redirect
- Update CORS settings for secure connections

## Monitoring and Analytics

### 1. Error Tracking
```bash
npm install @sentry/react @sentry/react-native
```

### 2. Analytics
```bash
npm install react-ga4
```

### 3. Performance Monitoring
- Set up Google PageSpeed Insights
- Configure Web Vitals tracking
- Monitor blockchain transaction costs

## Security Checklist

### Smart Contract Security
- [ ] Contract audited by security firm
- [ ] Access controls properly implemented
- [ ] Reentrancy guards in place
- [ ] Gas optimization completed
- [ ] Emergency pause mechanism

### Frontend Security
- [ ] Environment variables secured
- [ ] API endpoints protected
- [ ] Input validation implemented
- [ ] XSS protection enabled
- [ ] CSRF tokens configured

### Infrastructure Security
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] DDoS protection enabled
- [ ] Regular security updates

## Backup and Recovery

### 1. Smart Contract Backup
- Save contract source code
- Backup deployment scripts
- Store ABI and bytecode
- Document contract addresses

### 2. Database Backup
```bash
# PostgreSQL
pg_dump tea_supply_chain > backup.sql

# MongoDB
mongodump --db tea_supply_chain
```

### 3. Application Backup
- Version control with Git
- Automated deployment scripts
- Configuration management
- Asset backup (images, documents)

## Scaling Considerations

### 1. Frontend Scaling
- CDN for static assets
- Code splitting and lazy loading
- Service worker for caching
- Progressive Web App features

### 2. Backend Scaling
- Load balancer configuration
- Database read replicas
- Caching layer (Redis)
- Microservices architecture

### 3. Blockchain Scaling
- Layer 2 solutions (Polygon, Arbitrum)
- State channels for frequent updates
- IPFS for large data storage
- Batch transactions for efficiency

## Maintenance

### 1. Regular Updates
- Security patches
- Dependency updates
- Smart contract upgrades
- Mobile app updates

### 2. Monitoring
- Server health checks
- Blockchain network status
- User activity analytics
- Error rate monitoring

### 3. Support
- User documentation
- Help desk system
- Community forums
- Developer resources

---

## Quick Deployment Checklist

- [ ] Smart contract deployed and verified
- [ ] Contract address and ABI updated in frontend
- [ ] Frontend built and deployed
- [ ] Mobile app built and published
- [ ] Domain and SSL configured
- [ ] Monitoring and analytics set up
- [ ] Security measures implemented
- [ ] Backup systems in place
- [ ] Documentation updated
- [ ] Team trained on maintenance procedures

**Need help?** Contact our deployment support team or create an issue in the repository.