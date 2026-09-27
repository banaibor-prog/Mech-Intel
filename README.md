# Reject Mech Intel

A React Native application for Reject Mech Intel.

## Download the Android APK

Prebuilt APKs are published on the [Releases page](../../releases):

- Pushing a `v*` tag (e.g. `v1.0.0`) publishes a versioned release.
- Running the "Android Release" workflow manually (Actions tab → Android Release → Run workflow) publishes/updates a `latest` pre-release build.

These APKs are signed with the React Native debug keystore (not a Play Store release key), so they're only meant for sideloading. To install: download the `.apk` from the release onto your phone, then open it — you'll need to allow "install unknown apps" for whichever app you used to download it.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
```

### Running the App

#### iOS

```bash
npm run ios
# or
yarn ios
```

#### Android

```bash
npm run android
# or
yarn android
```

#### Start Metro Bundler

```bash
npm start
# or
yarn start
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components
├── constants/      # App constants (colors, spacing, etc.)
├── utils/          # Utility functions
├── App.tsx         # Root component
└── index.js        # Entry point
```

## Development

### Linting

```bash
npm run lint
```

### Testing

```bash
npm test
```

## Dependencies

- React 18.2.0
- React Native 0.72.0

## License

MIT
