# Msosi Fasta Frontend 🍽️🇹🇿

Modern React Native Expo mobile application for the Msosi Fasta food delivery platform.

## Features 🚀
- **Savanna Ember Design**: Premium, vibrant UI inspired by Tanzanian culture.
- **Bilingual Support**: Swahili and English interface.
- **Real-time Tracking**: Order status updates.
- **Secure Payments**: Integration with Selcom (M-Pesa, Tigo Pesa, Airtel Money).
- **Authentication**: JWT-based login/register with role selection (Customer/Restaurant Owner).
- **Cart Management**: Seamless food discovery and checkout.

## Tech Stack 🛠️
- **Framework**: Expo (React Native)
- **Navigation**: Expo Router (File-based)
- **State**: React Context (Auth & Cart)
- **Network**: Axios with Interceptors
- **Icons**: Expo Vector Icons (Ionicons)
- **Styling**: Vanilla StyleSheet with design tokens

## Getting Started 🏁

### 1. Prerequisites
- Node.js (LTS)
- Expo Go app on your phone (or an emulator)

### 2. Installation
```bash
cd msosi_frontend
npm install
```

### 3. Configuration
Open `services/api.ts` and update `BASE_URL` to your local backend IP:
```typescript
export const BASE_URL = 'http://YOUR_LOCAL_IP:8000/api';
```

### 4. Running
```bash
npx expo start
```
Scan the QR code with Expo Go.

## Project Structure 📁
- `app/`: Expo Router screens (Auth, Tabs, Details)
- `components/`: Shared UI components
- `constants/`: Theme, colors, and global constants
- `services/`: API layer (Axios instance)
- `store/`: Context providers for state management

## Note on Backend 🔌
Ensure the Django backend is running and accessible on your network. Use your machine's local IP (e.g., `192.168.x.x`) instead of `localhost` for testing on real devices.

---
Built with ❤️ by Msosi Fasta Team
