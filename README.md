# CleanUpGiveBack Mobile App

Welcome to the CleanUpGiveBack Mobile App repository! This app is built using React Native and [Expo](https://expo.dev/).

## 📱 Running the App with Expo Go

Expo Go is the easiest way to run and test the app directly on your physical iOS or Android device. It allows you to see live updates to the app as you code.

### Prerequisites

Before you begin, ensure you have the following installed on your computer:
- [Node.js](https://nodejs.org/en/) (LTS version recommended)
- `npm` (comes with Node.js) or `yarn`

### Step 1: Install the Expo Go App on Your Phone
Download the **Expo Go** app from your device's app store:
- **iOS**: [Download on the App Store](https://apps.apple.com/us/app/expo-go/id982107779)
- **Android**: [Download on Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Step 2: Install Project Dependencies
On your computer, open a terminal, navigate to this project folder (`nonprofit-mobile-app`), and install the required packages:

```bash
npm install
```

### Step 3: Start the Development Server
Run the following command to start the Expo Metro bundler:

```bash
npx expo start
```
This will start a local development server and display a large QR code in your terminal.

### Step 4: Connect Your Device
1. Make sure your phone and your computer are connected to the **same Wi-Fi network**.
2. Open the app to scan the QR code:
   - **On iOS**: Open the built-in **Camera** app and point it at the QR code in the terminal. Tap the prompt that appears at the top to open it in Expo Go.
   - **On Android**: Open the **Expo Go** app and tap "Scan QR Code" from the Home tab.

The app will now bundle its JavaScript and load on your phone. You will see a loading percentage in your terminal and on your device. Once it reaches 100%, the app will launch!

### 💡 Tips & Troubleshooting
- **Live Reloading**: If you modify any code in your editor and save it, the app will instantly update on your phone!
- **Developer Menu**: Shake your device to open the Expo Developer Menu. From here, you can reload the app, enable performance monitors, or view network requests.
- **Connection Issues**: If Expo Go gets stuck loading or cannot connect:
  - Verify your computer and phone are on the *exact same network*.
  - Try disabling any active VPNs on either device.
  - Press `c` in the terminal to clear the Metro cache and restart the server (`npx expo start -c`).
  - Press `s` in the terminal to switch to a different connection type (e.g., from `LAN` to `Tunnel`). A tunnel routes the connection through Expo's servers, which helps bypass tricky local network firewalls.

## 🛠️ Project Structure
This app is built using [Expo Router](https://docs.expo.dev/router/introduction/) for file-based routing. The main screens and components can be found inside the `src/app` and `src/components` directories.

- `src/app/` - The entry point and main navigational screens.
- `src/app/prototype/` - Prototype screen implementations and standardizations.
- `assets/` - Static assets like images, fonts, and HTML Stitch outputs.

## 💻 Running on Emulators (Optional)
If you prefer developing on your computer instead of a physical phone, you can run the app on simulators:
- Press `i` in the terminal to open the iOS Simulator (requires macOS and Xcode).
- Press `a` in the terminal to open an Android Emulator (requires Android Studio).
