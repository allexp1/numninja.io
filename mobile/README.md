# NumNinja Mobile App

A React Native mobile application for NumNinja virtual phone system, built with Expo and featuring RevenueCat integration for in-app purchases.

## Features

- 📱 Virtual phone number management
- 💳 In-app purchases with RevenueCat
- 📊 Call Detail Records (CDR)
- 💬 SMS history and configuration
- 🔔 Push notifications
- 🔐 Secure authentication
- 📞 Call forwarding configuration
- 🛒 Shopping cart functionality

## Prerequisites

- Node.js 16+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator
- RevenueCat account and API keys
- Backend API running (see main project)

## Setup Instructions

### 1. Install Dependencies

```bash
cd mobile
npm install
# or
yarn install
```

### 2. Configure Environment

Update `app.json` with your configuration:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "YOUR_API_URL",
      "revenueCatApiKey": {
        "ios": "YOUR_IOS_REVENUECAT_KEY",
        "android": "YOUR_ANDROID_REVENUECAT_KEY"
      },
      "eas": {
        "projectId": "YOUR_EAS_PROJECT_ID"
      }
    }
  }
}
```

### 3. RevenueCat Setup

1. Create a RevenueCat account at https://www.revenuecat.com
2. Create a new project for NumNinja
3. Configure products in RevenueCat dashboard:
   - Monthly subscriptions
   - SMS packages
   - Forwarding packages
   - Bundle deals
4. Add your API keys to `app.json`

### 4. Push Notifications Setup

For Expo push notifications:

```bash
expo install expo-notifications expo-device expo-constants
eas build:configure
```

### 5. Running the App

#### Development

```bash
# Start Expo development server
npm start
# or
expo start

# Run on iOS Simulator
npm run ios
# or
expo start --ios

# Run on Android Emulator
npm run android
# or
expo start --android
```

#### Testing on Physical Device

1. Install Expo Go app on your device
2. Scan the QR code from the development server
3. The app will load in Expo Go

## Build and Deployment

### Building for Production

#### Using EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Build for both platforms
eas build --platform all
```

#### Local Build

```bash
# iOS (Mac only)
expo build:ios

# Android
expo build:android
```

### App Store Submission

#### iOS

1. Build the app with EAS or locally
2. Download the IPA file
3. Upload to App Store Connect using Transporter
4. Complete app information in App Store Connect
5. Submit for review

#### Android

1. Build the app with EAS or locally
2. Download the APK/AAB file
3. Upload to Google Play Console
4. Complete store listing
5. Submit for review

## RevenueCat Products Configuration

### Product Identifiers

Configure these products in RevenueCat dashboard:

```javascript
// Monthly Subscriptions
monthly_number_basic    - Basic number subscription
monthly_number_premium  - Premium with SMS
monthly_number_business - Business with all features

// SMS Packages
sms_addon_100          - 100 SMS credits
sms_addon_500          - 500 SMS credits
sms_addon_1000         - 1000 SMS credits
sms_addon_unlimited    - Unlimited SMS

// Forwarding Packages
forwarding_basic       - Basic call forwarding
forwarding_advanced    - Advanced with conditions
forwarding_enterprise  - Enterprise features

// Bundles
bundle_starter         - Starter package
bundle_professional    - Professional package
bundle_enterprise      - Enterprise package
```

### Entitlements

Configure these entitlements in RevenueCat:

- `pro` - Pro features access
- `premium` - Premium features access
- `sms_enabled` - SMS features enabled
- `forwarding_enabled` - Call forwarding enabled
- `unlimited` - Unlimited usage

## Project Structure

```
mobile/
├── App.tsx                 # Main app entry point
├── app.json               # Expo configuration
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript configuration
├── src/
│   ├── api/              # API client and endpoints
│   ├── components/       # Reusable components
│   │   ├── NumberCard.tsx
│   │   ├── PurchaseButton.tsx
│   │   └── ...
│   ├── contexts/         # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── CartContext.tsx
│   │   └── RevenueCatContext.tsx
│   ├── navigation/       # Navigation configuration
│   ├── screens/          # App screens
│   │   ├── auth/        # Authentication screens
│   │   ├── HomeScreen.tsx
│   │   ├── NumbersScreen.tsx
│   │   └── ...
│   ├── services/         # External services
│   │   ├── revenuecat.ts
│   │   └── notifications.ts
│   └── utils/           # Utility functions
└── assets/              # Images and assets
```

## API Integration

The app connects to the existing Next.js backend API. Ensure the backend is running and accessible:

- Development: `http://localhost:3000/api`
- Production: `https://numninja.io/api`

## Testing

### Unit Tests

```bash
npm test
```

### E2E Tests with Detox

```bash
# iOS
detox test --configuration ios

# Android
detox test --configuration android
```

## Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx react-native start --reset-cache
   ```

2. **iOS build failures**
   ```bash
   cd ios && pod install
   ```

3. **Android build failures**
   ```bash
   cd android && ./gradlew clean
   ```

4. **RevenueCat initialization errors**
   - Verify API keys in app.json
   - Check RevenueCat dashboard configuration
   - Ensure products are created in app stores

5. **Push notification issues**
   - Verify Expo project ID
   - Check notification permissions
   - Test with Expo push notification tool

## Environment Variables

For different environments, create separate configuration files:

- `app.development.json` - Development config
- `app.staging.json` - Staging config
- `app.production.json` - Production config

## Security

- API keys are stored in Expo's secure store
- Authentication tokens are encrypted
- Sensitive data is never logged
- SSL pinning for API communications
- Biometric authentication support

## Performance Optimization

- Lazy loading of screens
- Image optimization with expo-image
- List virtualization for large datasets
- Memoization of expensive computations
- Background task optimization

## Support

For issues and questions:
- GitHub Issues: [github.com/numninja/mobile/issues](https://github.com/numninja/mobile/issues)
- Email: support@numninja.io
- Documentation: [docs.numninja.io](https://docs.numninja.io)

## License

Copyright © 2024 NumNinja. All rights reserved.